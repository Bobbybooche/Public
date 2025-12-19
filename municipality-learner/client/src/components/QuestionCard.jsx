import React from 'react';
import AudioPlayer from './AudioPlayer';

/**
 * QuestionCard component displays the current question
 * Supports both text-to-country and audio-to-text-country question types
 */
function QuestionCard({ question, onAnswerSubmit, disabled }) {
  if (!question) {
    return (
      <div className="card card--centered empty-state">
        <div className="empty-state__icon">?</div>
        <div className="empty-state__title">No Question Available</div>
        <p>Start a practice session to begin learning!</p>
      </div>
    );
  }

  const isTextQuestion = question.questionType === 'text_to_country';
  const isAudioQuestion = question.questionType === 'audio_to_text_country';

  return (
    <div className="card question-card">
      <div className="question-type">
        {isTextQuestion ? 'Name the Country' : 'Listen & Spell'}
      </div>

      {isTextQuestion && (
        <div className="municipality-name">
          {question.municipalityName}
        </div>
      )}

      {isAudioQuestion && (
        <AudioPlayer
          audioFile={question.audioFile}
          hasAudio={question.hasAudio}
        />
      )}

      <AnswerForm
        questionType={question.questionType}
        onSubmit={onAnswerSubmit}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * AnswerForm component handles user input for different question types
 */
function AnswerForm({ questionType, onSubmit, disabled }) {
  const [country, setCountry] = React.useState('');
  const [municipality, setMunicipality] = React.useState('');
  const isAudioQuestion = questionType === 'audio_to_text_country';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;

    if (isAudioQuestion) {
      onSubmit({ municipality, country });
    } else {
      onSubmit(country);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  // Reset inputs when question type changes
  React.useEffect(() => {
    setCountry('');
    setMunicipality('');
  }, [questionType]);

  const isValid = isAudioQuestion
    ? municipality.trim() && country.trim()
    : country.trim();

  return (
    <form className="answer-section" onSubmit={handleSubmit}>
      {isAudioQuestion && (
        <div className="input-group">
          <label className="input-label" htmlFor="municipality">
            Municipality Name
          </label>
          <input
            id="municipality"
            type="text"
            className="answer-input"
            placeholder="Type the municipality name..."
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
      )}

      <div className="input-group">
        <label className="input-label" htmlFor="country">
          Country
        </label>
        <input
          id="country"
          type="text"
          className="answer-input"
          placeholder="Type the country name..."
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          autoFocus={!isAudioQuestion}
        />
      </div>

      <button
        type="submit"
        className="btn btn--primary btn--block btn--lg"
        disabled={disabled || !isValid}
      >
        Check Answer
      </button>
    </form>
  );
}

export default QuestionCard;
