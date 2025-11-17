'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TIMER_SETTINGS } from '@/constants';
import { MeditationTypeService } from '@/lib/meditationTypeService';
import { MeditationCategoryService } from '@/lib/meditationCategoryService';
import { MeditationType } from '@/types';
import { MeditationCategory } from '@/types/admin';
import { useToast } from '@/components/ui/toast';
import { Search, Clock, Filter, X } from 'lucide-react';

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
  const [categories, setCategories] = useState<MeditationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [timerSoundEnabled, setTimerSoundEnabled] = useState(true);
  const { showToast } = useToast();

  // Load timer sound preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('meditation_timer_sound');
    if (savedPreference !== null) {
      setTimerSoundEnabled(savedPreference === 'true');
    }
  }, []);

  // Save timer sound preference to localStorage
  useEffect(() => {
    localStorage.setItem('meditation_timer_sound', timerSoundEnabled.toString());
  }, [timerSoundEnabled]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load both types and categories
        const [types, cats] = await Promise.all([
          MeditationTypeService.getActiveTypes(),
          MeditationCategoryService.getActiveCategories()
        ]);

        setMeditationTypes(types);
        setCategories(cats);

        if (types.length > 0 && !selectedType) {
          setSelectedType(types[0].id);
          setCustomDuration(types[0].defaultDuration);
        }
      } catch (error) {
        console.error('Error loading meditation data:', error);
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

    loadData();
  }, []);

  const filteredMeditations = useMemo(() => {
    return meditationTypes.filter(type => {
      const matchesSearch = type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           type.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           type.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || type.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [meditationTypes, searchQuery, selectedCategory]);

  // Featured meditations (first 8 based on order)
  const featuredMeditations = useMemo(() => {
    return filteredMeditations.slice(0, 8);
  }, [filteredMeditations]);

  // Remaining meditations (after first 8)
  const remainingMeditations = useMemo(() => {
    return filteredMeditations.slice(8);
  }, [filteredMeditations]);

  // Determine if we're in search/filter mode
  const isFiltering = searchQuery !== '' || selectedCategory !== 'all';

  // Meditations to display
  const displayedMeditations = useMemo(() => {
    // If filtering or showing all, show filtered results
    if (isFiltering || showAllTypes) {
      return filteredMeditations;
    }
    // Otherwise show only featured
    return featuredMeditations;
  }, [filteredMeditations, featuredMeditations, isFiltering, showAllTypes]);

  const handleStart = () => {
    onStart(selectedType, customDuration);
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    const type = meditationTypes.find(t => t.id === typeId);
    if (type) {
      setCustomDuration(type.defaultDuration);
    }
  };

  const selectedMeditation = meditationTypes.find(t => t.id === selectedType);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto bg-card rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Loading Meditation Types
          </h2>
          <p className="text-muted-foreground">
            Preparing your meditation options...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Choose Your Practice</h1>
          <p className="text-muted-foreground">Select a meditation type and duration to begin your journey</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search meditation types, categories, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-muted/60 border border-border px-12 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium text-foreground">Filter by Category</label>
          </div>
          <div className="flex w-full max-w-sm">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl bg-muted/60 border border-border px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Meditation Types Grid */}
      <div className="bg-card rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {isFiltering ? 'Search Results' : showAllTypes ? 'All Meditation Types' : 'Featured Practices'}
            </h2>
            {!isFiltering && !showAllTypes && (
              <p className="text-sm text-muted-foreground mt-1">
                Discover our top meditation practices
              </p>
            )}
          </div>
          {isFiltering && (
            <span className="text-sm text-muted-foreground">
              {filteredMeditations.length} {filteredMeditations.length === 1 ? 'result' : 'results'}
            </span>
          )}
        </div>

        {displayedMeditations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No meditation types found</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Try adjusting your search or filter to find what you&apos;re looking for.
            </p>
            <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} variant="outline" size="sm">
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedMeditations.map((type) => {
              const categoryInfo = categories.find(c => c.id === type.category);
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`group relative p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                    selectedType === type.id
                      ? 'border-primary bg-primary/5 shadow-lg scale-105'
                      : 'border-border hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  {/* Content */}
                  <div className="mb-3">
                    <h4 className="font-bold text-base text-foreground mb-1 leading-tight group-hover:text-primary transition-colors">
                      {type.name}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {type.description}
                    </p>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-muted rounded-full font-medium">
                      <Clock className="w-3 h-3" />
                      {type.defaultDuration}m
                    </span>
                    {categoryInfo && (
                      <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary rounded-full font-medium">
                        {categoryInfo.name}
                      </span>
                    )}
                  </div>

                  {/* Selected Indicator */}
                  {selectedType === type.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
            </div>

            {/* Show All / Show Less Button */}
            {!isFiltering && remainingMeditations.length > 0 && (
              <div className="mt-6 text-center">
                <Button
                  onClick={() => setShowAllTypes(!showAllTypes)}
                  variant="outline"
                  size="lg"
                  className="min-w-[200px]"
                >
                  {showAllTypes ? (
                    <>
                      Show Less
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      Browse All {meditationTypes.length} Types
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </Button>
                {!showAllTypes && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {remainingMeditations.length} more meditation types available
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Duration Selection */}
      <div className="bg-card rounded-xl p-6 shadow-sm border">
        <h2 className="text-2xl font-bold text-foreground mb-6">Set Duration</h2>

        {/* Quick Duration Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-6">
          {[5, 10, 15, 20, 30, 45, 60].map((minutes) => (
            <button
              key={minutes}
              onClick={() => setCustomDuration(minutes)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                customDuration === minutes
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/30 hover:bg-muted/50'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{minutes}</div>
                <div className="text-xs text-muted-foreground mt-1">min</div>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Duration Input */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border">
          <label className="text-sm font-semibold text-foreground whitespace-nowrap">
            Custom Duration:
          </label>
          <input
            type="number"
            min={TIMER_SETTINGS.minDuration}
            max={TIMER_SETTINGS.maxDuration}
            value={customDuration}
            onChange={(e) => setCustomDuration(Number(e.target.value))}
            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            minutes ({TIMER_SETTINGS.minDuration}-{TIMER_SETTINGS.maxDuration})
          </span>
        </div>

        {/* Timer Sound Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border mt-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div>
              <label className="text-sm font-semibold text-foreground cursor-pointer">
                Completion Bell Sound
              </label>
              <p className="text-xs text-muted-foreground">Play a bell sound when timer ends</p>
            </div>
          </div>
          <button
            onClick={() => setTimerSoundEnabled(!timerSoundEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              timerSoundEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                timerSoundEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Selected Summary & Actions */}
      {selectedMeditation && (
        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-4 sm:p-6 border border-primary/20">
          <div className="flex flex-col gap-4">
            {/* Selected Practice Info */}
            <div className="flex-1">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Selected Practice</h3>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{selectedMeditation.name}</h2>
              <p className="text-sm text-muted-foreground mb-3">{selectedMeditation.description}</p>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock className="w-5 h-5 text-primary" />
                {customDuration} minutes
              </div>
            </div>

            {/* Action Buttons - Responsive */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                onClick={onCancel}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStart}
                variant="default"
                size="lg"
                className="w-full sm:w-auto sm:min-w-[140px]"
              >
                Begin Practice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

