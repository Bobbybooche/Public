import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * AudioPlayer component for playing pronunciation audio
 * Features:
 * - Large touch-friendly play button (64px)
 * - Auto-play on load (optional)
 * - Prominent replay functionality
 * - Loading and error states
 */
function AudioPlayer({ audioFile, hasAudio, autoPlay = true }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  // Reset state when audio file changes
  useEffect(() => {
    setIsPlaying(false);
    setIsLoaded(false);
    setHasPlayed(false);
    setError(null);
  }, [audioFile]);

  // Preload audio
  useEffect(() => {
    if (!audioFile || !hasAudio) return;

    const audio = new Audio(`/audio/${audioFile}`);
    audioRef.current = audio;

    audio.addEventListener('loadeddata', () => {
      setIsLoaded(true);
      if (autoPlay) {
        playAudio();
      }
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setHasPlayed(true);
    });

    audio.addEventListener('error', () => {
      setError('Audio file not available');
      setIsLoaded(true);
    });

    // Preload
    audio.load();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioFile, hasAudio, autoPlay]);

  const playAudio = useCallback(() => {
    if (!audioRef.current || error) return;

    // Reset to beginning if already played
    audioRef.current.currentTime = 0;

    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        console.error('Audio playback failed:', err);
        setError('Could not play audio');
      });
  }, [error]);

  if (!hasAudio) {
    return (
      <div className="audio-player">
        <div className="audio-button audio-button--disabled">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        </div>
        <p className="audio-hint">Audio not available for this municipality</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audio-player">
        <div className="audio-button audio-button--error">
          <span>!</span>
        </div>
        <p className="audio-hint">{error}</p>
      </div>
    );
  }

  return (
    <div className="audio-player">
      <button
        className={`audio-button ${isPlaying ? 'audio-button--playing' : ''} ${hasPlayed ? 'audio-button--replay' : ''}`}
        onClick={playAudio}
        disabled={!isLoaded}
        aria-label={isPlaying ? 'Playing audio' : hasPlayed ? 'Play again' : 'Play audio'}
        style={{
          width: '64px',
          height: '64px',
          minWidth: '64px',
          minHeight: '64px',
          borderRadius: '50%',
          border: 'none',
          background: isPlaying ? 'var(--color-success)' : 'var(--color-primary)',
          color: 'white',
          cursor: isLoaded ? 'pointer' : 'wait',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--shadow-md)',
          transform: isPlaying ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {!isLoaded ? (
          <span className="loading-spinner" style={{
            width: '24px',
            height: '24px',
            borderWidth: '3px',
            borderColor: 'rgba(255,255,255,0.3)',
            borderTopColor: 'white'
          }} />
        ) : isPlaying ? (
          <PlayingIcon />
        ) : (
          <PlayIcon />
        )}
      </button>
      <p className="audio-hint" style={{ marginTop: 'var(--spacing-sm)' }}>
        {!isLoaded ? 'Loading audio...' : (
          isPlaying ? 'Playing...' : (
            hasPlayed ? 'Tap to play again' : 'Tap to play pronunciation'
          )
        )}
      </p>
    </div>
  );
}

// Simple SVG icons for play states (larger for touch targets)
function PlayIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
    </svg>
  );
}

function PlayingIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
    </svg>
  );
}

export default AudioPlayer;
