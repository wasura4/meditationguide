'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TIMER_SETTINGS } from '@/constants';
import { MEDITATION_CATEGORY_DETAILS_UI } from '@/constants/meditation-ui';
import { MeditationTypeService } from '@/lib/meditationTypeService';
import { MeditationType } from '@/types';
import { useToast } from '@/components/ui/toast';

interface MeditationSetupProps {
  onStart: (type: string, duration: number) => void;
  onCancel: () => void;
}

export const MeditationSetup: React.FC<MeditationSetupProps> = ({ onStart, onCancel }) => {
  const [selectedType, setSelectedType] = useState('');
  const [customDuration, setCustomDuration] = useState<number>(15);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [meditationTypes, setMeditationTypes] = useState<MeditationType[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Load meditation types from Firebase
  useEffect(() => {
    const loadTypes = async () => {
      try {
        setLoading(true);
        const types = await MeditationTypeService.getActiveTypes();
        setMeditationTypes(types);

        // Set default selected type to the first available type
        if (types.length > 0 && !selectedType) {
          setSelectedType(types[0].id);
          setCustomDuration(types[0].defaultDuration);
        }
      } catch (error) {
        console.error('Error loading meditation types:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load meditation types. Using defaults.',
          duration: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    loadTypes();
  }, []);

  // Filter meditations based on search and category
  const filteredMeditations = useMemo(() => {
    return meditationTypes.filter(type => {
      const matchesSearch = type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           type.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           type.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || type.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [meditationTypes, searchQuery, selectedCategory]);

  const handleStart = () => {
    onStart(selectedType, customDuration);
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    // Set default duration for the selected type
    const type = meditationTypes.find(t => t.id === typeId);
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

  const selectedMeditation = meditationTypes.find(t => t.id === selectedType);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Meditation Types
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Preparing your meditation options...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="bg-card rounded-xl p-6 shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Find Your Practice</h2>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search meditation types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Filter by Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategorySelect(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Categories</option>
            {MEDITATION_CATEGORY_DETAILS_UI.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Meditation Type Selection */}
      <div className="bg-card rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Select Meditation Type</h2>
          {searchQuery && (
            <span className="text-sm text-muted-foreground">
              {filteredMeditations.length} {filteredMeditations.length === 1 ? 'result' : 'results'}
            </span>
          )}
        </div>

        {filteredMeditations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-muted-foreground mb-4">
              No meditations found matching &quot;{searchQuery}&quot;
            </p>
            <Button
              onClick={() => setSearchQuery('')}
              variant="outline"
              size="sm"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMeditations.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className={`p-4 rounded-lg border-2 text-left cursor-pointer transition-all hover:shadow-md ${
                  selectedType === type.id
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm leading-tight">
                    {type.name}
                  </h4>
                  {selectedType === type.id && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                      <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {type.description}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 bg-muted rounded-full">
                    {type.defaultDuration}m
                  </span>
                  <span className="text-xs px-2 py-1 bg-muted rounded-full capitalize">
                    {type.category}
                  </span>
                </div>
                {type.tags && type.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {type.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 text-xs bg-muted/50 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Duration Selection */}
      <div className="bg-card rounded-xl p-6 shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Set Duration</h2>

        {/* Quick Duration Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[5, 10, 15, 20, 30, 45, 60].map((minutes) => (
            <Button
              key={minutes}
              onClick={() => setCustomDuration(minutes)}
              variant={customDuration === minutes ? "default" : "outline"}
              size="sm"
              className="flex-1 min-w-[60px]"
            >
              {minutes}m
            </Button>
          ))}
        </div>

        {/* Custom Duration Input */}
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <label className="text-sm font-medium whitespace-nowrap">
            Custom:
          </label>
          <input
            type="number"
            min={TIMER_SETTINGS.minDuration}
            max={TIMER_SETTINGS.maxDuration}
            value={customDuration}
            onChange={(e) => handleDurationChange(parseInt(e.target.value) || TIMER_SETTINGS.defaultDuration)}
            className="w-20 px-3 py-2 border rounded-lg text-center bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-sm text-muted-foreground">minutes</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Range: {TIMER_SETTINGS.minDuration}-{TIMER_SETTINGS.maxDuration} minutes
        </p>
      </div>

      {/* Session Summary */}
      {selectedMeditation && (
        <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg mb-1">Ready to Begin</h3>
            <p className="text-sm text-muted-foreground">Review your session details</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Type</div>
              <div className="font-semibold text-sm">{selectedMeditation.name}</div>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Duration</div>
              <div className="font-semibold text-sm">{customDuration} min</div>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Category</div>
              <div className="font-semibold text-sm capitalize">{selectedMeditation.category}</div>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Focus</div>
              <div className="font-semibold text-sm line-clamp-1">{selectedMeditation.description.split('.')[0]}</div>
            </div>
          </div>

          {selectedMeditation.tags && selectedMeditation.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedMeditation.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onCancel}
          variant="outline"
          size="lg"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleStart}
          variant="default"
          size="lg"
          className="flex-1"
          disabled={!selectedType}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Begin Session
        </Button>
      </div>
    </div>
  );
};

