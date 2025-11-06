'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { DhammaPost } from '@/types/admin';
import { DhammaService } from '@/lib/dhammaService';
import { DhammaPostCard } from './DhammaPostCard';
import { DhammaPostReader } from './DhammaPostReader';

export function DhammaContentLibrary() {
  const [posts, setPosts] = useState<DhammaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<DhammaPost | null>(null);
  const { showToast } = useToast();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const publishedPosts = await DhammaService.getPublishedPosts();
      setPosts(publishedPosts);
    } catch (error) {
      console.error('Error fetching Dhamma posts:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load Dhamma posts. Please try again.',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesLanguage = selectedLanguage === 'all' || post.language === selectedLanguage;
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesLanguage && matchesSearch;
  });

  const categories = ['all', ...Array.from(new Set(posts.map(post => post.category)))];
  const languages = ['all', ...Array.from(new Set(posts.map(post => post.language)))];

  const handlePostClick = async (post: DhammaPost) => {
    try {
      // Increment view count
      await DhammaService.incrementViewCount(post.id);
      setSelectedPost(post);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleCloseReader = () => {
    setSelectedPost(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Dhamma posts...</p>
        </div>
      </div>
    );
  }

  if (selectedPost) {
    return (
      <DhammaPostReader 
        post={selectedPost} 
        onClose={handleCloseReader}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search Dhamma posts by title, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-background text-foreground"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="lg:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-background text-foreground"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div className="lg:w-48">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-background text-foreground"
            >
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language === 'all' ? 'All Languages' : language === 'en' ? 'English' : language === 'si' ? 'Sinhala' : 'Pali'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600 dark:text-gray-300">
          {filteredPosts.length} Dhamma post{filteredPosts.length !== 1 ? 's' : ''} found
        </p>
        <Button
          onClick={fetchPosts}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </Button>
      </div>

      {/* Featured Posts */}
      {filteredPosts.filter(post => post.featured).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <svg className="w-6 h-6 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured Posts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts
              .filter(post => post.featured)
              .slice(0, 3)
              .map((post) => (
                <DhammaPostCard 
                  key={post.id} 
                  post={post} 
                  onClick={() => handlePostClick(post)}
                  featured={true}
                />
              ))}
          </div>
        </div>
      )}

      {/* All Posts */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          All Posts
        </h2>
        
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 5.754 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.523 18.246 19 16.5 19c-1.746 0-3.332-.477-4.5-1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts found</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchQuery || selectedCategory !== 'all' || selectedLanguage !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No Dhamma posts have been published yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <DhammaPostCard 
                key={post.id} 
                post={post} 
                onClick={() => handlePostClick(post)}
                featured={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
