import React, { useState, useEffect } from 'react';
import { useSpacedRepetition, useProgress } from '../hooks/useSpacedRepetition';
import QuestionCard from '../components/QuestionCard';
import Feedback from '../components/Feedback';
import CountrySelector from '../components/CountrySelector';

/**
 * Practice page - Main learning interface
 * Handles the spaced repetition practice flow
 */
function Practice() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  // Default to 'text_to_country' since there's only Slovenia for now
  const [exerciseType, setExerciseType] = useState('text_to_country');

  const {
    question,
    loading,
    error,
    feedback,
    sessionStats,
    fetchQuestion,
    submitAnswer,
    nextQuestion
  } = useSpacedRepetition();

  const { countries, fetchAll } = useProgress();

  // Fetch initial data
  useEffect(() => {
    fetchAll();
    fetchQuestion(selectedCountry, exerciseType);
  }, []);

  // Handle country selection
  const handleCountrySelect = (countryId) => {
    setSelectedCountry(countryId);
    setShowCountrySelector(false);
    fetchQuestion(countryId, exerciseType);
  };

  // Handle exercise type change
  const handleExerciseTypeChange = (newType) => {
    setExerciseType(newType);
    fetchQuestion(selectedCountry, newType);
  };

  // Handle answer submission
  const handleAnswerSubmit = async (answer) => {
    await submitAnswer(answer);
  };

  // Handle next question
  const handleNext = () => {
    nextQuestion(selectedCountry, exerciseType);
  };

  return (
    <div className="practice">
      {/* Exercise Type Selector */}
      <div className="card" style={{
        padding: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-md)'
      }}>
        <div style={{ marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Exercise Type
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button
            className={`btn ${exerciseType === 'text_to_country' ? 'btn--primary' : 'btn--secondary'}`}
            style={{ flex: 1, padding: 'var(--spacing-sm)' }}
            onClick={() => handleExerciseTypeChange('text_to_country')}
          >
            Name the Country
          </button>
          <button
            className={`btn ${exerciseType === 'audio_to_text_country' ? 'btn--primary' : 'btn--secondary'}`}
            style={{ flex: 1, padding: 'var(--spacing-sm)' }}
            onClick={() => handleExerciseTypeChange('audio_to_text_country')}
          >
            Listen & Spell
          </button>
        </div>
      </div>

      {/* Session Stats Bar */}
      <div className="card" style={{
        padding: 'var(--spacing-sm) var(--spacing-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-md)'
      }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Session: {sessionStats.answered} answered
          {sessionStats.answered > 0 && (
            <span> ({Math.round((sessionStats.correct / sessionStats.answered) * 100)}% correct)</span>
          )}
        </div>
        <button
          className="btn btn--secondary"
          style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', minHeight: 'auto' }}
          onClick={() => setShowCountrySelector(!showCountrySelector)}
        >
          {selectedCountry
            ? countries.find(c => c.id === selectedCountry)?.name || 'Filter'
            : 'All Countries'
          }
        </button>
      </div>

      {/* Country Selector (collapsible) */}
      {showCountrySelector && (
        <CountrySelector
          countries={countries}
          selectedCountry={selectedCountry}
          onSelect={handleCountrySelect}
        />
      )}

      {/* Loading State */}
      {loading && !question && !feedback && (
        <div className="card loading">
          <div className="loading-spinner" />
          <span>Loading question...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="card card--centered">
          <div className="empty-state">
            <div className="empty-state__icon">!</div>
            <div className="empty-state__title">
              {error.includes('caught up') ? 'All Caught Up!' : 'Error'}
            </div>
            <p>{error}</p>
            <button
              className="btn btn--primary"
              onClick={() => fetchQuestion(selectedCountry)}
              style={{ marginTop: 'var(--spacing-md)' }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Question Card */}
      {!error && !feedback && question && (
        <QuestionCard
          question={question}
          onAnswerSubmit={handleAnswerSubmit}
          disabled={loading}
        />
      )}

      {/* Feedback */}
      {feedback && (
        <div className="card">
          <Feedback feedback={feedback} onNext={handleNext} />
        </div>
      )}

      {/* Tips */}
      {!loading && !error && !question && !feedback && (
        <div className="card card--centered">
          <div className="empty-state">
            <div className="empty-state__icon">?</div>
            <div className="empty-state__title">No Questions Available</div>
            <p>
              {selectedCountry
                ? 'All municipalities in this country are up to date!'
                : 'Start by selecting a country or practice all municipalities.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Practice;
