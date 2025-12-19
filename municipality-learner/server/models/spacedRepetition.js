const db = require('../db');

/**
 * SM-2 Spaced Repetition Algorithm Implementation
 *
 * The SM-2 algorithm calculates the next review interval based on:
 * - Quality of response (0-5 scale, we use 0-1 for simplicity: correct/incorrect)
 * - Current ease factor (starts at 2.5)
 * - Current interval
 */

// Quality ratings mapped to SM-2 scale
const QUALITY_CORRECT = 4;    // Good response with effort
const QUALITY_INCORRECT = 1;  // Incorrect response

/**
 * Calculate the next ease factor based on quality of response
 * EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
 * EF must not fall below 1.3
 */
function calculateEaseFactor(currentEF, quality) {
  const newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.max(1.3, Math.round(newEF * 100) / 100);
}

/**
 * Calculate the next interval in days
 * I(1) = 1
 * I(2) = 6
 * I(n) = I(n-1) * EF for n > 2
 */
function calculateInterval(currentInterval, easeFactor, isCorrect) {
  if (!isCorrect) {
    // Reset to 1 day on incorrect answer
    return 1;
  }

  if (currentInterval === 1) {
    return 1; // First correct: review tomorrow
  } else if (currentInterval <= 6) {
    return 6; // Second correct: review in 6 days
  } else {
    // Subsequent corrects: multiply by ease factor
    return Math.round(currentInterval * easeFactor);
  }
}

/**
 * Get the next question for review based on spaced repetition
 * Prioritizes:
 * 1. Items due for review (next_review <= now)
 * 2. Items never seen
 * 3. Items with lower ease factor (harder items)
 * @param {number|null} countryId - Filter by country
 * @param {string|null} exerciseType - 'text_to_country' or 'audio_to_text_country' or null for random
 */
async function getNextQuestion(countryId = null, exerciseType = null) {
  let query = `
    SELECT
      m.id,
      m.name,
      m.audio_file,
      c.name as country_name,
      c.code as country_code,
      COALESCE(p.correct_count, 0) as correct_count,
      COALESCE(p.incorrect_count, 0) as incorrect_count,
      COALESCE(p.ease_factor, 2.5) as ease_factor,
      COALESCE(p.interval_days, 1) as interval_days,
      p.last_seen,
      p.next_review
    FROM municipalities m
    JOIN countries c ON m.country_id = c.id
    LEFT JOIN user_progress p ON m.id = p.municipality_id
    WHERE 1=1
  `;

  const params = [];

  if (countryId) {
    params.push(countryId);
    query += ` AND m.country_id = $${params.length}`;
  }

  // Order by: due items first, then by ease factor (harder items first), then random
  query += `
    ORDER BY
      CASE
        WHEN p.next_review IS NULL THEN 0
        WHEN p.next_review <= NOW() THEN 1
        ELSE 2
      END,
      COALESCE(p.ease_factor, 2.5) ASC,
      RANDOM()
    LIMIT 1
  `;

  const result = await db.query(query, params);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  // Determine question type based on parameter or default to text_to_country
  let questionType = 'text_to_country';
  if (exerciseType === 'audio_to_text_country' && row.audio_file) {
    questionType = 'audio_to_text_country';
  } else if (exerciseType === 'text_to_country') {
    questionType = 'text_to_country';
  } else if (!exerciseType && row.audio_file && Math.random() > 0.5) {
    // Random selection only if no exerciseType specified (legacy behavior)
    questionType = 'audio_to_text_country';
  }

  return {
    id: row.id,
    name: row.name,
    audioFile: row.audio_file,
    country: {
      name: row.country_name,
      code: row.country_code
    },
    questionType,
    stats: {
      correctCount: row.correct_count,
      incorrectCount: row.incorrect_count,
      easeFactor: parseFloat(row.ease_factor),
      intervalDays: row.interval_days,
      lastSeen: row.last_seen,
      nextReview: row.next_review
    }
  };
}

/**
 * Record an answer and update spaced repetition data
 */
async function recordAnswer(municipalityId, isCorrect) {
  // Get current progress
  const currentProgress = await db.query(
    `SELECT * FROM user_progress WHERE municipality_id = $1`,
    [municipalityId]
  );

  let currentEF = 2.5;
  let currentInterval = 1;
  let correctCount = 0;
  let incorrectCount = 0;

  if (currentProgress.rows.length > 0) {
    const row = currentProgress.rows[0];
    currentEF = parseFloat(row.ease_factor);
    currentInterval = row.interval_days;
    correctCount = row.correct_count;
    incorrectCount = row.incorrect_count;
  }

  // Calculate new values
  const quality = isCorrect ? QUALITY_CORRECT : QUALITY_INCORRECT;
  const newEF = calculateEaseFactor(currentEF, quality);
  const newInterval = calculateInterval(currentInterval, newEF, isCorrect);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  // Update or insert progress
  await db.query(`
    INSERT INTO user_progress (
      municipality_id,
      correct_count,
      incorrect_count,
      ease_factor,
      interval_days,
      last_seen,
      next_review,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW(), $6, NOW())
    ON CONFLICT (municipality_id)
    DO UPDATE SET
      correct_count = EXCLUDED.correct_count,
      incorrect_count = EXCLUDED.incorrect_count,
      ease_factor = EXCLUDED.ease_factor,
      interval_days = EXCLUDED.interval_days,
      last_seen = EXCLUDED.last_seen,
      next_review = EXCLUDED.next_review,
      updated_at = EXCLUDED.updated_at
  `, [
    municipalityId,
    isCorrect ? correctCount + 1 : correctCount,
    isCorrect ? incorrectCount : incorrectCount + 1,
    newEF,
    newInterval,
    nextReview
  ]);

  // Update daily stats
  await db.query(`
    INSERT INTO daily_stats (date, questions_answered, correct_answers, updated_at)
    VALUES (CURRENT_DATE, 1, $1, NOW())
    ON CONFLICT (date)
    DO UPDATE SET
      questions_answered = daily_stats.questions_answered + 1,
      correct_answers = daily_stats.correct_answers + $1,
      updated_at = NOW()
  `, [isCorrect ? 1 : 0]);

  // Check and unlock achievements
  await checkAchievements(isCorrect, correctCount + (isCorrect ? 1 : 0));

  return {
    easeFactor: newEF,
    intervalDays: newInterval,
    nextReview,
    correctCount: isCorrect ? correctCount + 1 : correctCount,
    incorrectCount: isCorrect ? incorrectCount : incorrectCount + 1
  };
}

/**
 * Check and unlock achievements based on current progress
 */
async function checkAchievements(isCorrect, totalCorrect) {
  const achievements = [];

  // First correct answer
  if (isCorrect && totalCorrect === 1) {
    achievements.push('first_correct');
  }

  // Check streak achievements
  const streakResult = await db.query(`
    SELECT COUNT(*) as streak
    FROM (
      SELECT date
      FROM daily_stats
      WHERE questions_answered > 0
      ORDER BY date DESC
    ) t
    WHERE date >= CURRENT_DATE - INTERVAL '1 day' * (
      SELECT COUNT(*) FROM daily_stats WHERE questions_answered > 0
    )
  `);

  const streak = parseInt(streakResult.rows[0]?.streak || 0);

  if (streak >= 3) achievements.push('streak_3');
  if (streak >= 7) achievements.push('streak_7');
  if (streak >= 30) achievements.push('streak_30');

  // Century achievement
  const totalResult = await db.query(`
    SELECT SUM(questions_answered) as total FROM daily_stats
  `);
  const totalQuestions = parseInt(totalResult.rows[0]?.total || 0);
  if (totalQuestions >= 100) achievements.push('century');

  // Unlock achievements
  for (const code of achievements) {
    await db.query(`
      UPDATE achievements
      SET unlocked_at = NOW()
      WHERE code = $1 AND unlocked_at IS NULL
    `, [code]);
  }
}

/**
 * Get overall progress statistics
 */
async function getProgress() {
  const result = await db.query(`
    SELECT
      COUNT(DISTINCT m.id) as total_municipalities,
      COUNT(DISTINCT CASE WHEN p.correct_count > 0 THEN m.id END) as learned,
      COUNT(DISTINCT CASE WHEN p.ease_factor >= 2.5 AND p.correct_count >= 3 THEN m.id END) as mastered,
      COALESCE(SUM(p.correct_count), 0) as total_correct,
      COALESCE(SUM(p.incorrect_count), 0) as total_incorrect,
      COUNT(DISTINCT CASE WHEN p.next_review <= NOW() THEN m.id END) as due_for_review
    FROM municipalities m
    LEFT JOIN user_progress p ON m.id = p.municipality_id
  `);

  const stats = result.rows[0];
  const totalAnswered = parseInt(stats.total_correct) + parseInt(stats.total_incorrect);

  return {
    totalMunicipalities: parseInt(stats.total_municipalities),
    learned: parseInt(stats.learned),
    mastered: parseInt(stats.mastered),
    dueForReview: parseInt(stats.due_for_review),
    accuracy: totalAnswered > 0
      ? Math.round((parseInt(stats.total_correct) / totalAnswered) * 100)
      : 0,
    totalCorrect: parseInt(stats.total_correct),
    totalIncorrect: parseInt(stats.total_incorrect)
  };
}

/**
 * Get progress for a specific country
 */
async function getCountryProgress(countryId) {
  const result = await db.query(`
    SELECT
      c.id,
      c.name,
      c.code,
      c.municipality_count,
      COUNT(DISTINCT m.id) as total,
      COUNT(DISTINCT CASE WHEN p.correct_count > 0 THEN m.id END) as learned,
      COUNT(DISTINCT CASE WHEN p.ease_factor >= 2.5 AND p.correct_count >= 3 THEN m.id END) as mastered,
      COALESCE(SUM(p.correct_count), 0) as correct,
      COALESCE(SUM(p.incorrect_count), 0) as incorrect
    FROM countries c
    LEFT JOIN municipalities m ON c.id = m.country_id
    LEFT JOIN user_progress p ON m.id = p.municipality_id
    WHERE c.id = $1
    GROUP BY c.id
  `, [countryId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  const totalAnswered = parseInt(row.correct) + parseInt(row.incorrect);

  return {
    country: {
      id: row.id,
      name: row.name,
      code: row.code
    },
    total: parseInt(row.total),
    learned: parseInt(row.learned),
    mastered: parseInt(row.mastered),
    accuracy: totalAnswered > 0
      ? Math.round((parseInt(row.correct) / totalAnswered) * 100)
      : 0,
    progress: Math.round((parseInt(row.learned) / parseInt(row.total)) * 100)
  };
}

/**
 * Get daily streak
 */
async function getStreak() {
  const result = await db.query(`
    WITH RECURSIVE dates AS (
      SELECT CURRENT_DATE as date
      UNION ALL
      SELECT date - 1
      FROM dates
      WHERE EXISTS (
        SELECT 1 FROM daily_stats
        WHERE daily_stats.date = dates.date - 1
        AND questions_answered > 0
      )
    )
    SELECT COUNT(*) as streak
    FROM dates
    WHERE EXISTS (
      SELECT 1 FROM daily_stats
      WHERE daily_stats.date = dates.date
      AND questions_answered > 0
    )
  `);

  // Also get today's stats
  const todayResult = await db.query(`
    SELECT questions_answered, correct_answers
    FROM daily_stats
    WHERE date = CURRENT_DATE
  `);

  const today = todayResult.rows[0] || { questions_answered: 0, correct_answers: 0 };

  return {
    currentStreak: parseInt(result.rows[0]?.streak || 0),
    todayQuestions: parseInt(today.questions_answered),
    todayCorrect: parseInt(today.correct_answers),
    todayAccuracy: today.questions_answered > 0
      ? Math.round((today.correct_answers / today.questions_answered) * 100)
      : 0
  };
}

/**
 * Get all countries with their progress
 */
async function getCountries() {
  const result = await db.query(`
    SELECT
      c.id,
      c.name,
      c.code,
      c.municipality_count,
      COUNT(DISTINCT m.id) as total,
      COUNT(DISTINCT CASE WHEN p.correct_count > 0 THEN m.id END) as learned,
      COUNT(DISTINCT CASE WHEN p.ease_factor >= 2.5 AND p.correct_count >= 3 THEN m.id END) as mastered
    FROM countries c
    LEFT JOIN municipalities m ON c.id = m.country_id
    LEFT JOIN user_progress p ON m.id = p.municipality_id
    GROUP BY c.id
    ORDER BY c.name
  `);

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    code: row.code,
    total: parseInt(row.total),
    learned: parseInt(row.learned),
    mastered: parseInt(row.mastered),
    progress: parseInt(row.total) > 0
      ? Math.round((parseInt(row.learned) / parseInt(row.total)) * 100)
      : 0
  }));
}

/**
 * Get unlocked achievements
 */
async function getAchievements() {
  const result = await db.query(`
    SELECT code, name, description, icon, unlocked_at
    FROM achievements
    ORDER BY
      CASE WHEN unlocked_at IS NOT NULL THEN 0 ELSE 1 END,
      unlocked_at DESC
  `);

  return result.rows.map(row => ({
    code: row.code,
    name: row.name,
    description: row.description,
    icon: row.icon,
    unlocked: row.unlocked_at !== null,
    unlockedAt: row.unlocked_at
  }));
}

module.exports = {
  getNextQuestion,
  recordAnswer,
  getProgress,
  getCountryProgress,
  getStreak,
  getCountries,
  getAchievements
};
