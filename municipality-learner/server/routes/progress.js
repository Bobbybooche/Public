const express = require('express');
const router = express.Router();
const sr = require('../models/spacedRepetition');

/**
 * GET /api/progress
 * Get overall progress statistics
 */
router.get('/progress', async (req, res) => {
  try {
    const progress = await sr.getProgress();
    res.json(progress);
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * GET /api/progress/:countryId
 * Get progress for a specific country
 */
router.get('/progress/:countryId', async (req, res) => {
  try {
    const { countryId } = req.params;
    const progress = await sr.getCountryProgress(parseInt(countryId));

    if (!progress) {
      return res.status(404).json({ error: 'Country not found' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error getting country progress:', error);
    res.status(500).json({ error: 'Failed to get country progress' });
  }
});

/**
 * GET /api/streak
 * Get current daily streak and today's stats
 */
router.get('/streak', async (req, res) => {
  try {
    const streak = await sr.getStreak();
    res.json(streak);
  } catch (error) {
    console.error('Error getting streak:', error);
    res.status(500).json({ error: 'Failed to get streak' });
  }
});

module.exports = router;
