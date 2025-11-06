'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DhammaPost } from '@/types/admin';
import { useAuth } from '@/contexts/AuthContext';
import { recordDhammaRead } from '@/lib/metricsService';

interface DhammaPostReaderProps {
  post: DhammaPost;
  onClose: () => void;
}

export function DhammaPostReader({ post, onClose }: DhammaPostReaderProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [fontSize, setFontSize] = useState('base');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id && post?.id) {
      recordDhammaRead(post.id, user.id);
    }
  }, [user?.id, post?.id]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      meditation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
      buddhism: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
      philosophy: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      practice: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200',
      teachings: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const getLanguageLabel = (language: string) => {
    const labels = {
      en: 'English',
      si: 'Sinhala',
      pa: 'Pali'
    };
    return labels[language as keyof typeof labels] || language;
  };

  const getFontSizeClass = (size: string) => {
    const sizes = {
      small: 'text-sm',
      base: 'text-base',
      large: 'text-lg',
      xlarge: 'text-xl'
    };
    return sizes[size as keyof typeof sizes] || 'text-base';
  };

  const renderContent = (content: string) => {
    // Split content into paragraphs
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map((paragraph, index) => {
      // Check if paragraph contains YouTube video embed
      const videoMatch = paragraph.match(/\[VIDEO:(https:\/\/www\.youtube\.com\/watch\?v=([^]]+))\]/);
      
      if (videoMatch) {
        const videoId = videoMatch[2];
        return (
          <div key={index} className="my-6">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <div className="aspect-w-16 aspect-h-9 mb-4">
                <iframe
                  className="w-full h-64 rounded-lg"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                🎥 Embedded YouTube Video
              </p>
            </div>
          </div>
        );
      }
      
      // Regular paragraph
      if (paragraph.trim()) {
        return (
          <p key={index} className={`${getFontSizeClass(fontSize)} leading-relaxed mb-4 text-gray-800 dark:text-gray-200`}>
            {paragraph.trim()}
          </p>
        );
      }
      
      return null;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Library</span>
            </Button>

            <div className="flex items-center space-x-3">
              {/* Font Size Controls */}
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFontSize('small')}
                  className={`px-2 py-1 text-xs ${fontSize === 'small' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                >
                  A
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFontSize('base')}
                  className={`px-2 py-1 text-xs ${fontSize === 'base' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                >
                  A
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFontSize('large')}
                  className={`px-2 py-1 text-xs ${fontSize === 'large' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                >
                  A
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFontSize('xlarge')}
                  className={`px-2 py-1 text-xs ${fontSize === 'xlarge' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                >
                  A
                </Button>
              </div>

              {/* Bookmark Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2 ${isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Post Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(post.category)}`}>
              {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              {getLanguageLabel(post.language)}
            </span>
            {post.featured && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                ⭐ Featured
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {post.authorName || 'Admin'}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(post.createdAt)}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {post.readTime || 5} min read
              </span>
            </div>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.viewCount || 0} views
            </span>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8">
            <img 
              src={post.featuredImage} 
              alt={post.title}
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Post Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Post Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Published on {formatDate(post.createdAt)}
              </span>
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  • Updated on {formatDate(post.updatedAt)}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`flex items-center space-x-2 ${isBookmarked ? 'text-yellow-600 border-yellow-300' : ''}`}
              >
                <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 5.754 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.523 18.246 19 16.5 19c-1.746 0-3.332-.477-4.5-1.253" />
                </svg>
                <span>Back to Library</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
