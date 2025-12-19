import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * AudioPlayer component for playing pronunciation audio
 * Features:
 * - Large touch-friendly play button
 * - Auto-play on load (optional)
 * - Replay functionality
 * - Loading and error states
 */
function AudioPlayer({ audioFile, hasAudio, autoPlay = true }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  // Reset state when audio file changes
  useEffect(() => {
    setIsPlaying(false);
    setIsLoaded(false);
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
        <div className="audio-button" style={{ opacity: 0.5 }}>
          <span role="img" aria-label="No audio">-</span>
        </div>
        <p className="audio-hint">Audio not available for this municipality</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audio-player">
        <div className="audio-button" style={{ background: 'var(--color-error)' }}>
          <span role="img" aria-label="Error">!</span>
        </div>
        <p className="audio-hint">{error}</p>
      </div>
    );
  }

  return (
    <div className="audio-player">
      <button
        className={`audio-button ${isPlaying ? 'audio-button--playing' : ''}`}
        onClick={playAudio}
        disabled={!isLoaded}
        aria-label={isPlaying ? 'Playing audio' : 'Play audio'}
      >
        {!isLoaded ? (
          <span className="loading-spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
        ) : isPlaying ? (
          <PlayingIcon />
        ) : (
          <PlayIcon />
        )}
      </button>
      <p className="audio-hint">
        {!isLoaded ? 'Loading audio...' : 'Tap to play pronunciation'}
      </p>
    </div>
  );
}

// Simple SVG icons for play states
function PlayIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PlayingIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
    </svg>
  );
}

export default AudioPlayer;
