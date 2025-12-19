const express = require('express');
const router = express.Router();
const sr = require('../models/spacedRepetition');

/**
 * GET /api/question
 * Get next municipality for review based on spaced repetition
 * Query params:
 *   - countryId: Filter by specific country (optional)
 */
router.get('/question', async (req, res) => {
  try {
    const { countryId } = req.query;
    const question = await sr.getNextQuestion(countryId ? parseInt(countryId) : null);

    if (!question) {
      return res.status(404).json({
        error: 'No questions available',
        message: 'All municipalities have been reviewed recently. Check back later!'
      });
    }

    // Don't send the answer in the response for text_to_country questions
    const response = {
      id: question.id,
      questionType: question.questionType,
      stats: question.stats
    };

    if (question.questionType === 'text_to_country') {
      response.municipalityName = question.name;
    } else if (question.questionType === 'audio_to_text_country') {
      response.audioFile = question.audioFile;
      response.hasAudio = !!question.audioFile;
    }

    // Store correct answer in session or memory for validation
    // Since this is a single-user app, we can use a simple in-memory store
    res.locals.currentQuestion = question;

    res.json(response);
  } catch (error) {
    console.error('Error getting question:', error);
    res.status(500).json({ error: 'Failed to get question' });
  }
});

/**
 * POST /api/answer
 * Submit an answer for a municipality
 * Body:
 *   - municipalityId: ID of the municipality
 *   - userAnswer: User's answer (country name or municipality name)
 *   - questionType: Type of question (text_to_country or audio_to_text_country)
 */
router.post('/answer', async (req, res) => {
  try {
    const { municipalityId, userAnswer, questionType } = req.body;

    if (!municipalityId || userAnswer === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the correct answer from database
    const db = require('../db');
    const result = await db.query(`
      SELECT m.name, c.name as country_name
      FROM municipalities m
      JOIN countries c ON m.country_id = c.id
      WHERE m.id = $1
    `, [municipalityId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Municipality not found' });
    }

    const { name: municipalityName, country_name: countryName } = result.rows[0];

    // Normalize answers for comparison (lowercase, trim, remove accents)
    const normalize = (str) => {
      return str
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
    };

    let isCorrect = false;
    let feedback = {};

    if (questionType === 'text_to_country') {
      // User needs to guess the country
      isCorrect = normalize(userAnswer) === normalize(countryName);
      feedback = {
        correctAnswer: countryName,
        userAnswer,
        municipality: municipalityName
      };
    } else if (questionType === 'audio_to_text_country') {
      // User needs to guess both municipality name and country
      // userAnswer should be an object with { municipality, country }
      const userMunicipality = typeof userAnswer === 'object' ? userAnswer.municipality : userAnswer;
      const userCountry = typeof userAnswer === 'object' ? userAnswer.country : '';

      const municipalityCorrect = normalize(userMunicipality || '') === normalize(municipalityName);
      const countryCorrect = normalize(userCountry || '') === normalize(countryName);

      isCorrect = municipalityCorrect && countryCorrect;
      feedback = {
        correctMunicipality: municipalityName,
        correctCountry: countryName,
        userMunicipality,
        userCountry,
        municipalityCorrect,
        countryCorrect
      };
    }

    // Record the answer with spaced repetition
    const progressUpdate = await sr.recordAnswer(municipalityId, isCorrect);

    res.json({
      correct: isCorrect,
      feedback,
      progress: progressUpdate
    });
  } catch (error) {
    console.error('Error recording answer:', error);
    res.status(500).json({ error: 'Failed to record answer' });
  }
});

/**
 * GET /api/countries
 * List all countries with completion status
 */
router.get('/countries', async (req, res) => {
  try {
    const countries = await sr.getCountries();
    res.json(countries);
  } catch (error) {
    console.error('Error getting countries:', error);
    res.status(500).json({ error: 'Failed to get countries' });
  }
});

/**
 * GET /api/achievements
 * Get all achievements with unlock status
 */
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await sr.getAchievements();
    res.json(achievements);
  } catch (error) {
    console.error('Error getting achievements:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

module.exports = router;
