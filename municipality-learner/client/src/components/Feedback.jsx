import React from 'react';

/**
 * Feedback component displays the result of an answer
 * Shows correct/incorrect state with the correct answer
 */
function Feedback({ feedback, onNext }) {
  if (!feedback) return null;

  const { correct, feedback: details } = feedback;

  return (
    <div className={`feedback ${correct ? 'feedback--correct' : 'feedback--incorrect'}`}>
      <div className="feedback__icon">
        {correct ? 'O' : 'X'}
      </div>
      <div className="feedback__title">
        {correct ? 'Correct!' : 'Not quite...'}
      </div>

      {!correct && (
        <div className="feedback__detail">
          {details.correctAnswer && (
            <p>
              The country is{' '}
              <span className="feedback__correct-answer">{details.correctAnswer}</span>
            </p>
          )}

          {details.correctMunicipality && (
            <>
              <p>
                Municipality:{' '}
                <span className="feedback__correct-answer">{details.correctMunicipality}</span>
                {details.municipalityCorrect ? ' (correct)' : ''}
              </p>
              <p>
                Country:{' '}
                <span className="feedback__correct-answer">{details.correctCountry}</span>
                {details.countryCorrect ? ' (correct)' : ''}
              </p>
            </>
          )}
        </div>
      )}

      <button
        className="btn btn--primary btn--block"
        onClick={onNext}
        style={{ marginTop: 'var(--spacing-md)' }}
        autoFocus
      >
        Next Question
      </button>
    </div>
  );
}

export default Feedback;
