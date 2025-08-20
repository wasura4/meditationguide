'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { DEFAULT_MEDITATION_TYPES, TIMER_SETTINGS, MEDITATION_CATEGORY_DETAILS } from '@/constants';

interface MeditationSetupProps {
  onStart: (type: string, duration: number) => void;
  onCancel: () => void;
}

export const MeditationSetup: React.FC<MeditationSetupProps> = ({ onStart, onCancel }) => {
  const [selectedType, setSelectedType] = useState('anapanasathi');
  const [customDuration, setCustomDuration] = useState<number>(20);
  const [selectedCategory, setSelectedCategory] = useState('theravada');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter meditations based on search and category
  const filteredMeditations = useMemo(() => {
    return DEFAULT_MEDITATION_TYPES.filter(type => {
      const matchesSearch = type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           type.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           type.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || type.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleStart = () => {
    onStart(selectedType, customDuration);
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    // Set default duration for the selected type
    const type = DEFAULT_MEDITATION_TYPES.find(t => t.id === typeId);
    if (type) {
      setCustomDuration(type.defaultDuration);
    }
  };

  const handleDurationChange = (duration: number) => {
    if (duration >= TIMER_SETTINGS.minDuration && duration <= TIMER_SETTINGS.maxDuration) {
      setCustomDuration(duration);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery(''); // Clear search when changing category
  };

  const selectedMeditation = DEFAULT_MEDITATION_TYPES.find(t => t.id === selectedType);

  return (
    <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Prepare Your Session
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose your meditation type and set your intention
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search meditations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => handleCategorySelect('all')}
            variant={selectedCategory === 'all' ? "meditation" : "outline"}
            size="sm"
            className="px-4 py-2"
          >
            🌟 All Types
          </Button>
          {MEDITATION_CATEGORY_DETAILS.map((category) => (
            <Button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              variant={selectedCategory === category.id ? "meditation" : "outline"}
              size="sm"
              className="px-4 py-2"
            >
              {category.icon} {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Meditation Type Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Choose Meditation Type
          {searchQuery && (
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              ({filteredMeditations.length} results)
            </span>
          )}
        </h3>
        
        {filteredMeditations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🔍</div>
            <p className="text-gray-600 dark:text-gray-300">
              No meditations found matching &quot;{searchQuery}&quot;
            </p>
            <Button
              onClick={() => setSearchQuery('')}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredMeditations.map((type) => (
              <div
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedType === type.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-left">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                      {type.name}
                    </h4>
                    {selectedType === type.id && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                    {type.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {type.defaultDuration}m
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                      {type.category}
                    </span>
                  </div>
                  {type.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {type.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Duration Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Session Duration
        </h3>
        
        {/* Quick Duration Buttons */}
        <div className="mb-4">
          <div className="flex flex-wrap justify-center gap-2">
            {[5, 10, 15, 20, 30, 45, 60].map((minutes) => (
              <Button
                key={minutes}
                onClick={() => setCustomDuration(minutes)}
                variant={customDuration === minutes ? "meditation" : "outline"}
                size="sm"
                className="px-4 py-2"
              >
                {minutes}m
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Duration Input */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Custom Duration:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={TIMER_SETTINGS.minDuration}
                max={TIMER_SETTINGS.maxDuration}
                value={customDuration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || TIMER_SETTINGS.defaultDuration)}
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">minutes</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Range: {TIMER_SETTINGS.minDuration}-{TIMER_SETTINGS.maxDuration} minutes
          </p>
        </div>
      </div>

      {/* Session Summary */}
      {selectedMeditation && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 mb-8 border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">
            🎯 Session Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Type:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                {selectedMeditation.name}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Duration:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                {customDuration} minutes
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Category:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-white capitalize">
                {selectedMeditation.category}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Focus:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                {selectedMeditation.description.split('.')[0]}
              </span>
            </div>
          </div>
          {selectedMeditation.tags && (
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedMeditation.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={onCancel}
          variant="outline"
          size="lg"
          className="px-8 py-3"
        >
          Cancel
        </Button>
        <Button
          onClick={handleStart}
          variant="meditation"
          size="lg"
          className="px-8 py-3"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Begin Meditation
        </Button>
      </div>
    </div>
  );
};
