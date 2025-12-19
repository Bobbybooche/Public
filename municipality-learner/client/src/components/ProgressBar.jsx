import React from 'react';

/**
 * ProgressBar component for displaying completion progress
 * Supports success variant for completed progress
 */
function ProgressBar({ value, max = 100, variant = 'default', showLabel = false, label }) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="progress-container">
      {(showLabel || label) && (
        <div className="progress-label" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.25rem',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)'
        }}>
          <span>{label || 'Progress'}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`progress-bar ${variant === 'success' ? 'progress-bar--success' : ''}`}>
        <div
          className="progress-bar__fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
