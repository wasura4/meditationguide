"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DhammaPost } from '@/types/admin';

interface DhammaPostCardProps {
  post: DhammaPost;
  onClick?: () => void;
  featured?: boolean;
}

export function DhammaPostCard({ post, onClick, featured = false }: DhammaPostCardProps) {
  const router = useRouter();

  const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const getLanguageLabel = (lng: string) => ({ en: 'English', si: 'Sinhala', pa: 'Pali' }[lng as 'en'|'si'|'pa'] || lng);

  return (
    <div
      className={`bg-background rounded-lg shadow-sm overflow-hidden border transition-all duration-200 hover:shadow-md cursor-pointer border-border`}
      onClick={onClick || (() => router.push(`/dhamma/${post.id}`))}
    >
      {featured && (
        <div className="bg-amber-500 text-white text-xs font-semibold px-3 py-1 text-center">
          <span className="inline-flex items-center">
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            Featured Post
          </span>
        </div>
      )}

      <div className="h-48 bg-muted flex items-center justify-center relative">
        {post.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <svg className="w-16 h-16 text-[var(--primary)] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 5.754 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.523 18.246 19 16.5 19c-1.746 0-3.332-.477-4.5-1.253" />
            </svg>
            <p className="text-sm text-[var(--primary)] font-medium">Dhamma Teaching</p>
          </div>
        )}

        <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
          {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
          {getLanguageLabel(post.language)}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-foreground line-clamp-2 text-lg leading-tight">{post.title}</h3>
        </div>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3 leading-relaxed">{post.excerpt}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
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

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-xs text-muted-foreground">{post.authorName || 'Admin'}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-[var(--primary)] border-border hover:bg-[var(--primary)]/10"
            onClick={(e) => { e.stopPropagation(); router.push(`/dhamma/${post.id}`); }}
          >
            Learn
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}

