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
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header Section - Minimal & Clean */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground">
          Choose Your <span className="font-medium text-primary">Practice</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
          Select a meditation style and duration to begin your journey to mindfulness.
        </p>
      </div>

      {/* Search and Filter Bar - Glass Effect */}
      <div className="bg-background/40 backdrop-blur-xl rounded-2xl p-2 shadow-lg border border-white/10 dark:border-white/5 flex flex-col md:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search practices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 rounded-xl bg-transparent border-none px-12 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0"
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

        {/* Category Filter */}
        <div className="relative min-w-[200px]">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-12 appearance-none rounded-xl bg-background/50 border-l border-white/10 pl-10 pr-8 text-foreground focus:outline-none cursor-pointer hover:bg-background/70 transition-colors"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* Meditation Types Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-semibold text-foreground/90">
            {isFiltering ? 'Search Results' : showAllTypes ? 'All Practices' : 'Featured'}
          </h2>
          {isFiltering && (
            <span className="text-sm text-muted-foreground">
              {filteredMeditations.length} results
            </span>
          )}
        </div>

        {displayedMeditations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-background/20 backdrop-blur-sm rounded-3xl border border-dashed border-muted">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
              <Search className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">No matches found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters</p>
            <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} variant="outline">
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedMeditations.map((type) => {
                const categoryInfo = categories.find(c => c.id === type.category);
                const isSelected = selectedType === type.id;

                return (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className={`group relative p-6 rounded-3xl text-left transition-all duration-300 border ${isSelected
                        ? 'bg-primary/10 border-primary/50 shadow-[0_0_30px_-10px_rgba(var(--primary-rgb),0.3)] scale-[1.02]'
                        : 'bg-background/40 backdrop-blur-md border-white/10 hover:bg-background/60 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1'
                      }`}
                  >
                    {/* Selection Indicator */}
                    <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 group-hover:border-primary/50'
                      }`}>
                      {isSelected && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </div>

                    <div className="mb-4">
                      {categoryInfo && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-primary/80 mb-2 block">
                          {categoryInfo.name}
                        </span>
                      )}
                      <h4 className={`font-bold text-xl mb-2 transition-colors ${isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                        {type.name}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {type.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/80">
                      <Clock className="w-3.5 h-3.5" />
                      {type.defaultDuration} min
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Show All Button */}
            {!isFiltering && remainingMeditations.length > 0 && (
              <div className="flex justify-center pt-8">
                <Button
                  onClick={() => setShowAllTypes(!showAllTypes)}
                  variant="ghost"
                  className="group text-muted-foreground hover:text-primary"
                >
                  {showAllTypes ? 'Show Less' : `View All (${meditationTypes.length})`}
                  <svg className={`w-4 h-4 ml-2 transition-transform duration-300 ${showAllTypes ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Duration & Start Section */}
      <div className="bg-background/40 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/10 mb-24">
        <div className="flex flex-col gap-6">
          {/* Duration Slider/Selector */}
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Session Duration</h3>
              <span className="text-2xl font-light text-primary">{customDuration} <span className="text-sm text-muted-foreground font-normal">min</span></span>
            </div>

            {/* Duration Pills - Horizontal Scroll for Mobile */}
            <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar -mx-2 px-2">
              {[5, 10, 15, 20, 30, 45, 60].map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => setCustomDuration(minutes)}
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${customDuration === minutes
                      ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                      : 'bg-background/50 hover:bg-primary/10 text-muted-foreground hover:text-primary'
                    }`}
                >
                  {minutes}
                </button>
              ))}
            </div>

            {/* Manual Input Fallback */}
            <div className="flex items-center gap-4 pt-2">
              <label className="text-sm text-muted-foreground">Custom:</label>
              <input
                type="number"
                min={TIMER_SETTINGS.minDuration}
                max={TIMER_SETTINGS.maxDuration}
                value={customDuration}
                onChange={(e) => setCustomDuration(Number(e.target.value))}
                className="w-20 bg-transparent border-b border-border focus:border-primary text-center py-1 focus:outline-none"
              />
            </div>
          </div>

          {/* Start Action */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between px-4 py-3 bg-background/30 rounded-xl">
              <span className="text-sm font-medium">Completion Bell</span>
              <button
                onClick={() => setTimerSoundEnabled(!timerSoundEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative ${timerSoundEnabled ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${timerSoundEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <Button
              onClick={handleStart}
              size="lg"
              className="w-full h-14 text-lg rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
            >
              Start Meditation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

