import React from 'react';

/**
 * AnswerInput component - standalone text input for answers
 * Mobile-optimized with large touch targets
 */
function AnswerInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type your answer...',
  label,
  disabled = false,
  autoFocus = false
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="input-group">
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}
      <input
        type="text"
        className="answer-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />
    </div>
  );
}

export default AnswerInput;
