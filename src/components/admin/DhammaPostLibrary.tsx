'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { DhammaPost } from '@/types/admin';
import { DhammaService } from '@/lib/dhammaService';
import { ContentRenderer } from '@/utils/contentRenderer';
import { useToast } from '@/components/ui/toast';

interface DhammaPostLibraryProps {
  onEditPost: (post: DhammaPost) => void;
  onDeletePost: (postId: string) => Promise<void>;
  onRefresh: () => void;
}

export default function DhammaPostLibrary({ onEditPost, onDeletePost, onRefresh }: DhammaPostLibraryProps) {
  const { adminUser } = useAdminAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<DhammaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load posts from Firestore
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const fetchedPosts = await DhammaService.getAllPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error loading posts:', error);
        // Keep existing posts if there's an error
      } finally {
        setLoading(false);
      }
    };

    if (adminUser) {
      loadPosts();
    }
  }, [adminUser]);

  const handleDelete = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await onDeletePost(postId);
        setPosts(posts.filter(post => post.id !== postId));
        showToast({
          type: 'success',
          title: 'Post Deleted!',
          message: 'The Dhamma post has been successfully deleted.',
          duration: 4000
        });
      } catch (err) {
        console.error('Error deleting post:', err);
        showToast({
          type: 'error',
          title: 'Error Deleting Post',
          message: 'Failed to delete post. Please try again.',
          duration: 6000
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-muted text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'meditation': return 'bg-muted text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'buddhism': return 'bg-muted text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'philosophy': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300';
      case 'practice': return 'bg-muted text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'teachings': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = filterCategory === 'all' || post.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesStatus && matchesSearch;
  });

  if (!adminUser) {
    return (
      <div className="bg-[var(--color-status-error)]/10 border border-[var(--color-status-error)] rounded-lg p-4">
        <p className="text-[var(--color-status-error)]">You must be logged in as an admin to manage Dhamma posts.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading Dhamma posts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="meditation">Meditation</option>
              <option value="buddhism">Buddhism</option>
              <option value="philosophy">Philosophy</option>
              <option value="practice">Practice</option>
              <option value="teachings">Teachings</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={onRefresh}
              variant="outline"
              className="w-full"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">

        {filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {posts.length === 0 ? 'No Dhamma posts yet' : 'No posts match your filters'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {posts.length === 0 
                ? 'Create your first Dhamma post to share wisdom with your users!'
                : 'Try adjusting your filters to see more posts.'
              }
            </p>
          </div>
        ) : (
                     filteredPosts.map((post) => (
             <div
               key={post.id}
               className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
             >
               <div className="flex flex-col lg:flex-row">
                 {/* Featured Image */}
                 {post.featuredImage && (
                   <div className="lg:w-1/3 lg:min-w-[200px]">
                     <img
                       src={post.featuredImage}
                       alt={post.title}
                       className="w-full h-48 lg:h-full object-cover"
                     />
                   </div>
                 )}
                 
                 {/* Content */}
                 <div className={`flex-1 p-6 ${post.featuredImage ? 'lg:w-2/3' : ''}`}>
                   <div className="flex items-start justify-between mb-3">
                     <div className="flex-1">
                       <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                         {post.title}
                         {post.featured && (
                           <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                             ⭐ Featured
                           </span>
                         )}
                       </h3>
                       <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                         {post.excerpt}
                       </p>
                       {/* Content Preview with Video Support */}
                       <div className="text-sm text-gray-700 dark:text-gray-300 mb-3 max-h-32 overflow-hidden">
                         <ContentRenderer content={post.content} />
                       </div>
                     </div>
                   </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                      {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {post.language.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-muted text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                      {post.readTime} min read
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-muted text-green-800 dark:bg-green-900/20 dark:text-green-300">
                      {post.viewCount} views
                    </span>
                  </div>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Created: {post.createdAt.toLocaleDateString()}
                    {post.publishedAt && ` • Published: ${post.publishedAt.toLocaleDateString()}`}
                    • Author: {post.authorName}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 mt-4 lg:mt-0 lg:ml-4">
                  <Button
                    onClick={() => onEditPost(post)}
                    variant="outline"
                    size="sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(post.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-[var(--color-status-error)]/10 dark:hover:bg-red-900/20"
                    disabled={isDeleting}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
        Showing {filteredPosts.length} of {posts.length} posts
      </div>
    </div>
  );
}

