'use client';

import React, { useState } from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import DhammaPostForm from '@/components/admin/DhammaPostForm';
import DhammaPostLibrary from '@/components/admin/DhammaPostLibrary';
import { Button } from '@/components/ui/button';
import { DhammaPost, DhammaPostFormData } from '@/types/admin';
import { DhammaService } from '@/lib/dhammaService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';

export default function DhammaContentPage() {
  const { adminUser } = useAdminAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'library' | 'create' | 'edit'>('library');
  const [editingPost, setEditingPost] = useState<DhammaPost | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreatePost = async (postData: DhammaPostFormData) => {
    try {
      if (!adminUser) {
        throw new Error('Admin user not found');
      }
      
      await DhammaService.createPost(postData, adminUser.id, adminUser.displayName || 'Admin');
      showToast({
        type: 'success',
        title: 'Post Created!',
        message: 'Your new Dhamma post has been created successfully.',
        duration: 4000
      });
      setActiveTab('library');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error creating post:', error);
      showToast({
        type: 'error',
        title: 'Error Creating Post',
        message: 'Failed to create post. Please try again.',
        duration: 6000
      });
      throw error;
    }
  };

  const handleUpdatePost = async (postData: DhammaPostFormData) => {
    try {
      if (!editingPost) {
        throw new Error('No post selected for editing');
      }
      
      await DhammaService.updatePost(editingPost.id, postData);
      showToast({
        type: 'success',
        title: 'Post Updated!',
        message: 'Your Dhamma post has been updated successfully.',
        duration: 4000
      });
      setActiveTab('library');
      setEditingPost(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error updating post:', error);
      showToast({
        type: 'error',
        title: 'Error Updating Post',
        message: 'Failed to update post. Please try again.',
        duration: 6000
      });
      throw error;
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await DhammaService.deletePost(postId);
      showToast({
        type: 'success',
        title: 'Post Deleted!',
        message: 'The Dhamma post has been deleted successfully.',
        duration: 4000
      });
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast({
        type: 'error',
        title: 'Error Deleting Post',
        message: 'Failed to delete post. Please try again.',
        duration: 6000
      });
      throw error;
    }
  };

  const handleEditPost = (post: DhammaPost) => {
    setEditingPost(post);
    setActiveTab('edit');
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setActiveTab('library');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'create':
        return (
          <DhammaPostForm
            onSave={handleCreatePost}
            onCancel={() => setActiveTab('library')}
            isEditing={false}
          />
        );
      case 'edit':
        return editingPost ? (
          <DhammaPostForm
            post={editingPost}
            onSave={handleUpdatePost}
            onCancel={handleCancelEdit}
            isEditing={true}
          />
        ) : (
          <div>Post not found</div>
        );
      case 'library':
      default:
        return (
          <DhammaPostLibrary
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onRefresh={handleRefresh}
          />
        );
    }
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/dhamma">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dhamma Content Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Create and manage Dhamma posts for your users
              </p>
            </div>
            {activeTab === 'library' && (
              <Button
                onClick={() => setActiveTab('create')}
                variant="meditation"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Post
              </Button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('library')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'library'
                    ? 'border-[var(--primary)] text-[var(--primary)] dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Content Library
              </button>
              {activeTab === 'create' && (
                <button
                  className="border-[var(--primary)] text-[var(--primary)] dark:text-blue-400 py-2 px-1 border-b-2 font-medium text-sm"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Post
                </button>
              )}
              {activeTab === 'edit' && (
                <button
                  className="border-[var(--primary)] text-[var(--primary)] dark:text-blue-400 py-2 px-1 border-b-2 font-medium text-sm"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Post
                </button>
              )}
            </nav>
          </div>

          {/* Content */}
          <div key={refreshKey}>
            {renderContent()}
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}


