'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { KamatahanAudio } from '@/types/admin';

interface AudioPlayerProps {
  audio: KamatahanAudio;
}

export function AudioPlayer({ audio }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    console.log('🎵 AudioPlayer mounted for:', audio.title);
    console.log('🎵 Audio URL:', audio.fileUrl);
    console.log('🎵 Audio element created:', audioElement);

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
  }, [showToast, audio.title, audio.fileUrl]);

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

      {/* Compact Player Card */}
      <div className="bg-card/50 backdrop-blur-sm rounded-xl border p-4 space-y-3 hover:shadow-md transition-shadow">
        {/* Play Button & Title */}
        <div className="flex items-center gap-3">
          <Button
            onClick={togglePlayPause}
            size="lg"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0 shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation shrink-0"
          >
            {isPlaying ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </Button>

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

        {/* Progress Bar */}
        <div className="relative pt-1">
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all rounded-full"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer touch-manipulation"
          />
        </div>
      </div>
    </div>
  );
}
