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
    <div className="w-full max-w-md mx-auto space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Audio Element */}
      <audio ref={audioRef} src={audio.fileUrl} preload="metadata" />
      
      {/* Title - Mobile Optimized */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate px-2">
          {audio.title}
        </h3>
      </div>
      
      {/* Play/Pause Button - Larger for Mobile */}
      <div className="flex justify-center">
        <Button
          onClick={togglePlayPause}
          size="lg"
          className="w-16 h-16 rounded-full p-0 shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation"
        >
          {isPlaying ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </Button>
      </div>

      {/* Progress Bar - Touch Friendly */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 px-1">
          <span className="font-mono">{formatTime(currentTime)}</span>
          <span className="font-mono">{formatTime(duration)}</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>
      </div>

      {/* Volume Control - Mobile Optimized */}
      <div className="flex items-center justify-center space-x-3">
        <Button
          onClick={toggleMute}
          variant="ghost"
          size="sm"
          className="p-2 h-10 w-10 touch-manipulation"
        >
          {isMuted || volume === 0 ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : volume < 0.5 ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </Button>
        
        {/* Volume Slider - Hidden on very small screens, shown on larger mobile */}
        <div className="hidden sm:block flex-1 max-w-24">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>
        
        {/* Volume Display for Small Screens */}
        <div className="sm:hidden text-sm text-gray-600 dark:text-gray-300 font-mono min-w-[3rem] text-center">
          {Math.round(volume * 100)}%
        </div>
      </div>

      {/* Custom CSS for better slider appearance on mobile */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        @media (max-width: 640px) {
          .slider::-webkit-slider-thumb {
            height: 24px;
            width: 24px;
          }
          
          .slider::-moz-range-thumb {
            height: 24px;
            width: 24px;
          }
        }
      `}</style>
    </div>
  );
}
