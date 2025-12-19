import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../hooks/useSpacedRepetition';
import StreakCounter from '../components/StreakCounter';
import ProgressBar from '../components/ProgressBar';

/**
 * Home page - Dashboard showing overview and quick access to practice
 */
function Home() {
  const { progress, streak, loading, fetchAll } = useProgress();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-hero__title">Municipality Learner</h1>
        <p className="home-hero__subtitle">
          Master European municipalities with spaced repetition
        </p>

        <div className="home-cta">
          <Link to="/practice" className="btn btn--primary btn--lg btn--block-mobile">
            Start Practice
          </Link>
          <Link to="/progress" className="btn btn--secondary btn--lg btn--block-mobile">
            View Progress
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner" />
          <span>Loading your progress...</span>
        </div>
      ) : (
        <>
          {/* Streak Counter */}
          {streak && (
            <StreakCounter
              streak={streak}
              todayQuestions={streak.todayQuestions}
              todayAccuracy={streak.todayAccuracy}
            />
          )}

          {/* Quick Stats */}
          {progress && (
            <div className="card" style={{ marginTop: 'var(--spacing-md)' }}>
              <h3 className="section-title">Your Progress</h3>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card__value">{progress.learned}</div>
                  <div className="stat-card__label">Learned</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card__value">{progress.mastered}</div>
                  <div className="stat-card__label">Mastered</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card__value">{progress.dueForReview}</div>
                  <div className="stat-card__label">Due Today</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card__value">{progress.accuracy}%</div>
                  <div className="stat-card__label">Accuracy</div>
                </div>
              </div>

              <ProgressBar
                value={progress.learned}
                max={progress.totalMunicipalities}
                label={`${progress.learned} of ${progress.totalMunicipalities} municipalities`}
                showLabel
              />
            </div>
          )}

          {/* Motivational message */}
          {progress && progress.dueForReview > 0 && (
            <div className="card card--centered" style={{ marginTop: 'var(--spacing-md)' }}>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                You have <strong>{progress.dueForReview}</strong> municipalities due for review.
              </p>
              <Link
                to="/practice"
                className="btn btn--success"
                style={{ marginTop: 'var(--spacing-md)' }}
              >
                Review Now
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;
