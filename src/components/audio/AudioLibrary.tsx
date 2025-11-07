'use client';

import React, { useState, useEffect } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { KamatahanAudio } from '@/types/admin';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function AudioLibrary() {
  const [audioFiles, setAudioFiles] = useState<KamatahanAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchAudioFiles();
  }, []);

  const fetchAudioFiles = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching audio files from kamatahan_audio collection...');
      const audioRef = collection(db, 'kamatahan_audio');
      // Temporarily remove orderBy to test if that's causing the issue
      // const q = query(audioRef, orderBy('uploadDate', 'desc'));
      const q = query(audioRef);
      const querySnapshot = await getDocs(q);
      
      console.log('📊 Query snapshot size:', querySnapshot.size);
      console.log('📊 Query snapshot empty:', querySnapshot.empty);
      
      const files: KamatahanAudio[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🎵 Audio file data:', { id: doc.id, ...data });
        files.push({ id: doc.id, ...data } as KamatahanAudio);
      });
      
      console.log('🎵 Total audio files found:', files.length);
      setAudioFiles(files);
    } catch (error) {
      console.error('❌ Error fetching audio files:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load audio files. Please try again.',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAudioFiles = audioFiles.filter((audio) => {
    const matchesCategory = selectedCategory === 'all' || audio.category === selectedCategory;
    const matchesLanguage = selectedLanguage === 'all' || audio.language === selectedLanguage;
    const matchesSearch = audio.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         audio.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesLanguage && matchesSearch;
  });

  const categories = ['all', ...Array.from(new Set(audioFiles.map(audio => audio.category)))];
  const languages = ['all', ...Array.from(new Set(audioFiles.map(audio => audio.language)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audio files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-card rounded-xl p-4 sm:p-6 shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search audio files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="lg:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div className="lg:w-48">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language === 'all' ? 'All Languages' : language}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          {filteredAudioFiles.length} audio file{filteredAudioFiles.length !== 1 ? 's' : ''} found
        </p>
        <Button
          onClick={fetchAudioFiles}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </Button>
      </div>

      {/* Audio Files Grid */}
      {filteredAudioFiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No audio files found</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedCategory !== 'all' || selectedLanguage !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No audio files have been uploaded yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredAudioFiles.map((audio) => (
            <div key={audio.id} className="bg-card rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              {/* Audio Thumbnail */}
              <div className="h-40 sm:h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-muted/50 flex items-center justify-center">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>

              {/* Audio Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm sm:text-base line-clamp-2 flex-1">
                    {audio.title}
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded shrink-0">
                    {audio.duration || 'N/A'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                  {audio.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {audio.category}
                  </span>
                  <span className="text-xs bg-accent/50 text-accent-foreground px-2 py-1 rounded-full">
                    {audio.language}
                  </span>
                </div>

                {/* Audio Player */}
                <AudioPlayer audio={audio} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

