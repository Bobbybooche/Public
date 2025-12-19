import React, { useEffect } from 'react';
import { useProgress } from '../hooks/useSpacedRepetition';
import StreakCounter from '../components/StreakCounter';
import ProgressBar from '../components/ProgressBar';

/**
 * Progress page - Detailed view of learning progress
 * Shows countries, achievements, and statistics
 */
function Progress() {
  const {
    progress,
    streak,
    countries,
    achievements,
    loading,
    fetchAll
  } = useProgress();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <span>Loading progress...</span>
      </div>
    );
  }

  return (
    <div className="progress-page">
      {/* Streak */}
      {streak && (
        <StreakCounter
          streak={streak}
          todayQuestions={streak.todayQuestions}
          todayAccuracy={streak.todayAccuracy}
        />
      )}

      {/* Overall Stats */}
      {progress && (
        <div className="card" style={{ marginTop: 'var(--spacing-md)' }}>
          <h3 className="section-title">Overall Statistics</h3>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card__value">{progress.totalMunicipalities}</div>
              <div className="stat-card__label">Total</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{progress.learned}</div>
              <div className="stat-card__label">Learned</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{progress.mastered}</div>
              <div className="stat-card__label">Mastered</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{progress.accuracy}%</div>
              <div className="stat-card__label">Accuracy</div>
            </div>
          </div>

          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <ProgressBar
              value={progress.learned}
              max={progress.totalMunicipalities}
              label="Overall Progress"
              showLabel
              variant={progress.learned === progress.totalMunicipalities ? 'success' : 'default'}
            />
          </div>

          <div style={{
            marginTop: 'var(--spacing-md)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            <span>Correct: {progress.totalCorrect}</span>
            <span>Incorrect: {progress.totalIncorrect}</span>
            <span>Due: {progress.dueForReview}</span>
          </div>
        </div>
      )}

      {/* Countries Progress */}
      {countries && countries.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--spacing-md)' }}>
          <h3 className="section-title">Countries</h3>

          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            {countries.map((country) => (
              <div
                key={country.id}
                style={{
                  padding: 'var(--spacing-md) 0',
                  borderBottom: '1px solid var(--color-border)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  <span style={{ fontWeight: 500 }}>
                    {country.name}
                    <span style={{
                      marginLeft: '0.5rem',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      ({country.code})
                    </span>
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {country.learned}/{country.total}
                  </span>
                </div>

                <ProgressBar
                  value={country.learned}
                  max={country.total}
                  variant={country.progress === 100 ? 'success' : 'default'}
                />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 'var(--spacing-xs)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)'
                }}>
                  <span>{country.progress}% learned</span>
                  <span>{country.mastered} mastered</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--spacing-md)' }}>
          <h3 className="section-title">Achievements</h3>

          <div className="achievements-grid">
            {achievements.map((achievement) => (
              <div
                key={achievement.code}
                className={`achievement ${achievement.unlocked ? 'achievement--unlocked' : 'achievement--locked'}`}
              >
                <span className="achievement__icon">{achievement.icon}</span>
                <span className="achievement__name">{achievement.name}</span>
                <span className="achievement__description">
                  {achievement.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Progress;
