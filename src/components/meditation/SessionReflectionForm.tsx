'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MeditationSession } from '@/types';

interface SessionReflectionFormProps {
  session: MeditationSession;
  onSave: (session: MeditationSession) => void;
  onSkip: () => void;
}

export const SessionReflectionForm: React.FC<SessionReflectionFormProps> = ({
  session,
  onSave,
  onSkip
}) => {
  const [notes, setNotes] = useState(session.notes || '');
  const [rating, setRating] = useState(session.rating || 0);
  const [mood, setMood] = useState(session.mood || 'neutral');
  const [distractions, setDistractions] = useState<string[]>(session.distractions || []);
  const [insights, setInsights] = useState<string[]>(session.insights || []);
  const [newDistraction, setNewDistraction] = useState('');
  const [newInsight, setNewInsight] = useState('');

  const moodOptions = [
    { value: 'excellent', label: 'Excellent', emoji: '🌟', color: 'text-green-600' },
    { value: 'good', label: 'Good', emoji: '😊', color: 'text-blue-600' },
    { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'text-gray-600' },
    { value: 'challenging', label: 'Challenging', emoji: '😰', color: 'text-yellow-600' },
    { value: 'difficult', label: 'Difficult', emoji: '😓', color: 'text-red-600' },
  ];

  const handleSave = () => {
    const updatedSession: MeditationSession = {
      ...session,
      notes,
      rating,
      mood,
      distractions,
      insights,
      updatedAt: new Date(),
    };
    onSave(updatedSession);
  };

  const addDistraction = () => {
    if (newDistraction.trim() && !distractions.includes(newDistraction.trim())) {
      setDistractions([...distractions, newDistraction.trim()]);
      setNewDistraction('');
    }
  };

  const removeDistraction = (index: number) => {
    setDistractions(distractions.filter((_, i) => i !== index));
  };

  const addInsight = () => {
    if (newInsight.trim() && !insights.includes(newInsight.trim())) {
      setInsights([...insights, newInsight.trim()]);
      setNewInsight('');
    }
  };

  const removeInsight = (index: number) => {
    setInsights(insights.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Session Complete!
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Take a moment to reflect on your meditation experience
        </p>
      </div>

      {/* Session Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          Session Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-300">Type:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {session.typeName}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-300">Duration:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {session.duration}m
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-300">Started:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {session.startTime.toLocaleTimeString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-300">Completed:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {session.endTime?.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          How was your session? *
        </label>
        <div className="flex justify-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`p-2 rounded-lg transition-all ${
                rating >= star
                  ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
              }`}
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
        <div className="text-center mt-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {rating === 1 && 'Very difficult'}
            {rating === 2 && 'Difficult'}
            {rating === 3 && 'Okay'}
            {rating === 4 && 'Good'}
            {rating === 5 && 'Excellent'}
          </span>
        </div>
      </div>

      {/* Mood */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          How do you feel after this session?
        </label>
        <div className="grid grid-cols-5 gap-2">
          {moodOptions.map((option) => (
            <button
              key={option.value}
                             onClick={() => setMood(option.value as 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult')}
              className={`p-3 rounded-lg border-2 transition-all ${
                mood === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-1">{option.emoji}</div>
              <div className={`text-xs font-medium ${option.color}`}>
                {option.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Session Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How was your experience? Any thoughts or observations?"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Distractions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Distractions (optional)
        </label>
        <div className="space-y-2">
          {distractions.map((distraction, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                {distraction}
              </span>
              <button
                onClick={() => removeDistraction(index)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newDistraction}
              onChange={(e) => setNewDistraction(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, addDistraction)}
              placeholder="Add a distraction..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              onClick={addDistraction}
              variant="outline"
              size="sm"
              disabled={!newDistraction.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Insights (optional)
        </label>
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                💡 {insight}
              </span>
              <button
                onClick={() => removeInsight(index)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newInsight}
              onChange={(e) => setNewInsight(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, addInsight)}
              placeholder="Add an insight..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              onClick={addInsight}
              variant="outline"
              size="sm"
              disabled={!newInsight.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={onSkip}
          variant="outline"
          size="lg"
          className="px-8 py-3"
        >
          Skip Reflection
        </Button>
        <Button
          onClick={handleSave}
          variant="meditation"
          size="lg"
          className="px-8 py-3"
          disabled={rating === 0}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Reflection
        </Button>
      </div>
    </div>
  );
};
