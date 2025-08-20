'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { DhammaPost } from '@/types/admin';

interface DhammaPostCardProps {
  post: DhammaPost;
  onClick: () => void;
  featured?: boolean;
}

export function DhammaPostCard({ post, onClick, featured = false }: DhammaPostCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border transition-all duration-200 hover:shadow-md cursor-pointer ${
        featured 
          ? 'border-yellow-300 dark:border-yellow-600 shadow-yellow-100 dark:shadow-yellow-900/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
      }`}
      onClick={onClick}
    >
      {/* Featured Badge */}
      {featured && (
        <div className="bg-yellow-500 text-white text-xs font-semibold px-3 py-1 text-center">
          ⭐ Featured Post
        </div>
      )}

      {/* Post Thumbnail */}
      <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center relative">
        {post.featuredImage ? (
          <img 
            src={post.featuredImage} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <svg className="w-16 h-16 text-purple-600 dark:text-purple-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 5.754 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.523 18.246 19 16.5 19c-1.746 0-3.332-.477-4.5-1.253" />
            </svg>
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Dhamma Teaching</p>
          </div>
        )}
        
        {/* Category Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
          {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
        </div>

        {/* Language Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          {getLanguageLabel(post.language)}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 text-lg leading-tight">
            {post.title}
          </h3>
        </div>
        
        {post.excerpt && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag} 
                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                +{post.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Post Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.viewCount || 0} views
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {post.readTime || 5} min read
            </span>
          </div>
          <span>{formatDate(post.createdAt)}</span>
        </div>

        {/* Author */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {post.authorName || 'Admin'}
            </span>
          </div>

          {/* Read Button */}
          <Button
            variant="outline"
            size="sm"
            className="text-purple-600 border-purple-300 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-600 dark:hover:bg-purple-900/20"
          >
            Read Post
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
