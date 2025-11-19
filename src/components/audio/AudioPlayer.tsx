'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { KamatahanAudio } from '@/types/admin';

interface AudioPlayerProps {
  audio: KamatahanAudio;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function AudioPlayer({ audio }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Load playback speed from localStorage
  useEffect(() => {
    const savedSpeed = localStorage.getItem('audio_playback_speed');
    if (savedSpeed) {
      const speed = parseFloat(savedSpeed);
      if (PLAYBACK_SPEEDS.includes(speed)) {
        setPlaybackSpeed(speed);
      }
    }
  }, []);

  // Apply playback speed to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    console.log('🎵 AudioPlayer mounted for:', audio.title);
    console.log('🎵 Audio URL:', audio.fileUrl);
    console.log('🎵 Audio element created:', audioElement);

    // Set initial playback speed
    audioElement.playbackRate = playbackSpeed;

    const updateTime = () => setCurrentTime(audioElement.currentTime);
    const updateDuration = () => {
      console.log('🎵 Audio duration loaded:', audioElement.duration);
      setDuration(audioElement.duration);
    };
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('❌ Audio element error event:', e);
      console.error('❌ Audio element error details:', {
        error: audioElement.error,
        networkState: audioElement.networkState,
        readyState: audioElement.readyState
      });
      setIsPlaying(false);
      showToast({
        type: 'error',
        title: 'Playback Error',
        message: 'Failed to play audio file. Please try again.',
        duration: 3000
      });
    };

    audioElement.addEventListener('timeupdate', updateTime);
    audioElement.addEventListener('loadedmetadata', updateDuration);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);

    return () => {
      audioElement.removeEventListener('timeupdate', updateTime);
      audioElement.removeEventListener('loadedmetadata', updateDuration);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
    };
  }, [showToast, audio.title, audio.fileUrl, playbackSpeed]);

  const togglePlayPause = useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      console.log('🎵 Attempting to play audio:', audio.title);
      console.log('🎵 Audio URL:', audio.fileUrl);
      console.log('🎵 Audio element src:', audioElement.src);
      
      audioElement.play().catch((error) => {
        console.error('❌ Error playing audio:', error);
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          code: error.code
        });
        showToast({
          type: 'error',
          title: 'Playback Error',
          message: `Failed to start playback: ${error.message}`,
          duration: 3000
        });
      });
      setIsPlaying(true);
    }
  }, [isPlaying, showToast, audio.title, audio.fileUrl]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const newTime = parseFloat(e.target.value);
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  // Skip forward/backward
  const skip = useCallback((seconds: number) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const newTime = Math.max(0, Math.min(audioElement.currentTime + seconds, duration));
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // Change playback speed
  const changePlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    localStorage.setItem('audio_playback_speed', speed.toString());
    setShowSpeedMenu(false);
  }, []);

  // Handle progress bar hover for preview
  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    setHoverTime(time);
  }, [duration]);

  const handleProgressLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioElement.volume = newVolume;
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isMuted) {
      audioElement.volume = volume;
      setIsMuted(false);
    } else {
      audioElement.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      {/* Audio Element */}
      <audio ref={audioRef} src={audio.fileUrl} preload="metadata" />

      {/* Enhanced Player Card - Layout A */}
      <div className="bg-card/50 backdrop-blur-sm rounded-xl border p-4 space-y-3 hover:shadow-md transition-shadow">
        {/* Title & Time */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm sm:text-base truncate">
              {audio.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="font-mono">{formatTime(currentTime)}</span>
              <span>/</span>
              <span className="font-mono">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Speed */}
          <div className="relative">
            <Button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs font-medium"
            >
              {playbackSpeed}x
            </Button>
            {showSpeedMenu && (
              <div className="absolute right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg z-10 py-1 min-w-[80px]">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => changePlaybackSpeed(speed)}
                    className={`w-full px-3 py-1.5 text-xs hover:bg-accent text-left ${
                      speed === playbackSpeed ? 'bg-accent font-semibold' : ''
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Progress Bar with Hover Preview */}
        <div
          ref={progressBarRef}
          className="relative pt-1 group"
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
        >
          <div className="relative h-3 bg-muted rounded-full overflow-hidden cursor-pointer">
            <div
              className="absolute h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all rounded-full"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
            {/* Hover indicator */}
            {hoverTime !== null && (
              <div
                className="absolute top-0 w-0.5 h-full bg-foreground/30"
                style={{ left: `${(hoverTime / (duration || 1)) * 100}%` }}
              />
            )}
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer touch-manipulation"
          />
          {/* Hover time tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 bg-popover border px-2 py-1 rounded text-xs font-mono shadow-lg pointer-events-none"
              style={{ left: `${(hoverTime / (duration || 1)) * 100}%`, transform: 'translateX(-50%)' }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Skip Buttons + Play/Pause */}
        <div className="flex items-center justify-center gap-2">
          {/* -30s */}
          <Button
            onClick={() => skip(-30)}
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs touch-manipulation"
            title="Skip backward 30 seconds"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
            30s
          </Button>

          {/* -10s */}
          <Button
            onClick={() => skip(-10)}
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs touch-manipulation"
            title="Skip backward 10 seconds"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4z" />
            </svg>
            10s
          </Button>

          {/* Play/Pause */}
          <Button
            onClick={togglePlayPause}
            size="lg"
            className="w-12 h-12 rounded-full p-0 shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </Button>

          {/* +10s */}
          <Button
            onClick={() => skip(10)}
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs touch-manipulation"
            title="Skip forward 10 seconds"
          >
            10s
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </Button>

          {/* +30s */}
          <Button
            onClick={() => skip(30)}
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs touch-manipulation"
            title="Skip forward 30 seconds"
          >
            30s
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </Button>

          {/* Volume Control */}
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="sm"
            className="p-2 h-9 w-9 touch-manipulation shrink-0"
          >
            {isMuted || volume === 0 ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
