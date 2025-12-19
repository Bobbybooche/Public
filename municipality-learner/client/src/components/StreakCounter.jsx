import React from 'react';

/**
 * StreakCounter component displays the current daily streak
 * Visual prominence with gradient background
 */
function StreakCounter({ streak, todayQuestions = 0, todayAccuracy = 0 }) {
  const streakDays = streak?.currentStreak || 0;

  return (
    <div className="card">
      <div className="streak-counter">
        <span className="streak-counter__icon" role="img" aria-label="Fire">
          {streakDays > 0 ? getStreakEmoji(streakDays) : '-'}
        </span>
        <div>
          <div className="streak-counter__value">
            {streakDays} {streakDays === 1 ? 'day' : 'days'}
          </div>
          <div className="streak-counter__label">Current Streak</div>
        </div>
      </div>

      {todayQuestions > 0 && (
        <div style={{
          marginTop: 'var(--spacing-md)',
          paddingTop: 'var(--spacing-md)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)'
        }}>
          <span>Today: {todayQuestions} questions</span>
          <span>{todayAccuracy}% accuracy</span>
        </div>
      )}
    </div>
  );
}

/**
 * Get appropriate emoji based on streak length
 */
function getStreakEmoji(days) {
  if (days >= 30) return '!';
  if (days >= 14) return '*';
  if (days >= 7) return '+';
  if (days >= 3) return '^';
  return '>';
}

export default StreakCounter;
