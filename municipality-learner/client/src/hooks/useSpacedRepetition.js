import { useState, useCallback } from 'react';

const API_BASE = '/api';

/**
 * Custom hook for managing spaced repetition practice sessions
 */
export function useSpacedRepetition() {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    answered: 0,
    correct: 0
  });

  /**
   * Fetch the next question from the API
   * @param {number|null} countryId - Filter by country
   * @param {string|null} exerciseType - 'text_to_country' or 'audio_to_text_country'
   */
  const fetchQuestion = useCallback(async (countryId = null, exerciseType = null) => {
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const params = new URLSearchParams();
      if (countryId) params.append('countryId', countryId);
      if (exerciseType) params.append('exerciseType', exerciseType);
      const queryString = params.toString();
      const url = queryString ? `${API_BASE}/question?${queryString}` : `${API_BASE}/question`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          setQuestion(null);
          setError('All caught up! No more questions due for review.');
          return;
        }
        throw new Error('Failed to fetch question');
      }

      const data = await response.json();
      setQuestion(data);
    } catch (err) {
      setError(err.message);
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Submit an answer
   */
  const submitAnswer = useCallback(async (answer) => {
    if (!question) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          municipalityId: question.id,
          userAnswer: answer,
          questionType: question.questionType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();

      setFeedback(data);
      setSessionStats(prev => ({
        answered: prev.answered + 1,
        correct: prev.correct + (data.correct ? 1 : 0)
      }));

      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [question]);

  /**
   * Move to the next question after feedback
   */
  const nextQuestion = useCallback((countryId = null, exerciseType = null) => {
    setFeedback(null);
    fetchQuestion(countryId, exerciseType);
  }, [fetchQuestion]);

  /**
   * Reset the session
   */
  const resetSession = useCallback(() => {
    setQuestion(null);
    setFeedback(null);
    setError(null);
    setSessionStats({ answered: 0, correct: 0 });
  }, []);

  return {
    question,
    loading,
    error,
    feedback,
    sessionStats,
    fetchQuestion,
    submitAnswer,
    nextQuestion,
    resetSession
  };
}

/**
 * Hook for fetching progress data
 */
export function useProgress() {
  const [progress, setProgress] = useState(null);
  const [streak, setStreak] = useState(null);
  const [countries, setCountries] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [progressRes, streakRes, countriesRes, achievementsRes] = await Promise.all([
        fetch(`${API_BASE}/progress`),
        fetch(`${API_BASE}/streak`),
        fetch(`${API_BASE}/countries`),
        fetch(`${API_BASE}/achievements`)
      ]);

      if (!progressRes.ok || !streakRes.ok || !countriesRes.ok || !achievementsRes.ok) {
        throw new Error('Failed to fetch progress data');
      }

      const [progressData, streakData, countriesData, achievementsData] = await Promise.all([
        progressRes.json(),
        streakRes.json(),
        countriesRes.json(),
        achievementsRes.json()
      ]);

      setProgress(progressData);
      setStreak(streakData);
      setCountries(countriesData);
      setAchievements(achievementsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCountryProgress = useCallback(async (countryId) => {
    try {
      const response = await fetch(`${API_BASE}/progress/${countryId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch country progress');
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    progress,
    streak,
    countries,
    achievements,
    loading,
    error,
    fetchAll,
    fetchCountryProgress
  };
}

export default useSpacedRepetition;
