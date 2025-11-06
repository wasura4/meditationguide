'use client';

import React, { useState } from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import AudioUploadForm from '@/components/admin/AudioUploadForm';
import AudioLibrary from '@/components/admin/AudioLibrary';
import { useToast } from '@/components/ui/toast';

const AudioManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [refreshKey, setRefreshKey] = useState(0);
  const { showToast } = useToast();

  const handleUploadSuccess = () => {
    setActiveTab('library');
    setRefreshKey(prev => prev + 1);
    showToast({
      type: 'success',
      title: 'Audio Uploaded!',
      message: 'Switched to library view to see your new audio file.',
      duration: 3000
    });
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    showToast({
      type: 'info',
      title: 'Library Refreshed',
      message: 'Audio library has been updated.',
      duration: 2000
    });
  };

  const handleTabChange = (tab: 'upload' | 'library') => {
    setActiveTab(tab);
    showToast({
      type: 'info',
      title: 'View Changed',
      message: `Switched to ${tab === 'upload' ? 'upload' : 'library'} view.`,
      duration: 1500
    });
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/audio">
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-gray-900">Audio Management</h1>
            <p className="text-gray-600 mt-1">
              Upload and manage Kamatahan audio files for meditation sessions
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('upload')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upload Audio
              </button>
              <button
                onClick={() => handleTabChange('library')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'library'
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Audio Library
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {activeTab === 'upload' ? (
              <AudioUploadForm onUploadSuccess={handleUploadSuccess} />
            ) : (
              <AudioLibrary key={refreshKey} onRefresh={handleRefresh} />
            )}
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AudioManagementPage;

