'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { KamatahanAudio } from '@/types/admin';
import { useToast } from '@/components/ui/toast';

interface AudioLibraryProps {
  onRefresh: () => void;
}

const AudioLibrary: React.FC<AudioLibraryProps> = ({ onRefresh }) => {
  const { hasPermission } = useAdminAuth();
  const { showToast } = useToast();
  const [audioFiles, setAudioFiles] = useState<KamatahanAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<KamatahanAudio | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'meditation', label: 'Meditation' },
    { value: 'dhamma_talk', label: 'Dhamma Talk' },
    { value: 'chanting', label: 'Chanting' },
    { value: 'guided_meditation', label: 'Guided Meditation' },
    { value: 'background', label: 'Background Music' }
  ];

  useEffect(() => {
    loadAudioFiles();
  }, []);

  const loadAudioFiles = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'kamatahan_audio'));
      const audioData: KamatahanAudio[] = [];
      
      querySnapshot.forEach((doc) => {
        audioData.push({
          id: doc.id,
          ...doc.data()
        } as KamatahanAudio);
      });

      // Sort by creation date (newest first)
      audioData.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setAudioFiles(audioData);
    } catch (err) {
      console.error('Error loading audio files:', err);
      setError('Failed to load audio files');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (audioId: string) => {
    if (!hasPermission('audio', 'delete')) {
      setError('You do not have permission to delete audio files');
      return;
    }

    if (!confirm('Are you sure you want to delete this audio file? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'kamatahan_audio', audioId));
      
      // Remove from local state
      setAudioFiles(prev => prev.filter(audio => audio.id !== audioId));
      setSelectedAudio(null);
      onRefresh();
      
      showToast({
        type: 'success',
        title: 'Audio Deleted!',
        message: 'The audio file has been deleted successfully.',
        duration: 4000
      });
    } catch (err) {
      console.error('Error deleting audio:', err);
      setError('Failed to delete audio file');
      showToast({
        type: 'error',
        title: 'Error Deleting Audio',
        message: 'Failed to delete audio file. Please try again.',
        duration: 6000
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (audio: KamatahanAudio) => {
    if (!hasPermission('audio', 'update')) {
      setError('You do not have permission to update audio files');
      return;
    }

    try {
      const newStatus = audio.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'kamatahan_audio', audio.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setAudioFiles(prev => prev.map(a => 
        a.id === audio.id ? { ...a, status: newStatus } : a
      ));
      
      if (selectedAudio?.id === audio.id) {
        setSelectedAudio({ ...selectedAudio, status: newStatus });
      }
      
      showToast({
        type: 'success',
        title: 'Status Updated!',
        message: `Audio status changed to ${newStatus}.`,
        duration: 4000
      });
    } catch (err) {
      console.error('Error updating audio status:', err);
      setError('Failed to update audio status');
      showToast({
        type: 'error',
        title: 'Error Updating Status',
        message: 'Failed to update audio status. Please try again.',
        duration: 6000
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredAudioFiles = audioFiles.filter(audio => {
    const matchesCategory = filterCategory === 'all' || audio.category === filterCategory;
    const matchesSearch = audio.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         audio.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!hasPermission('audio', 'read')) {
    return (
      <div className="bg-[var(--color-status-error)]/10 border border-[var(--color-status-error)] rounded-lg p-4">
        <p className="text-[var(--color-status-error)]">You do not have permission to view audio files.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Audio Library</h3>
          <p className="text-sm text-gray-600">
            {filteredAudioFiles.length} of {audioFiles.length} audio files
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAudioFiles}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search audio files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="w-full sm:w-48">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[var(--color-status-error)]/10 border border-[var(--color-status-error)] rounded-lg p-3">
          <p className="text-[var(--color-status-error)] text-sm">{error}</p>
        </div>
      )}

      {/* Audio Files Grid */}
      {filteredAudioFiles.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No audio files found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAudioFiles.map((audio) => (
            <div
              key={audio.id}
              className={`bg-white rounded-lg border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                selectedAudio?.id === audio.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Audio Preview */}
              <div className="p-4 bg-gray-50">
                <audio
                  controls
                  className="w-full"
                  src={audio.fileUrl}
                  onLoadedMetadata={(e) => {
                    const target = e.target as HTMLAudioElement;
                    if (target.duration && !audio.duration) {
                      // Update duration if not set
                      const durationInSeconds = Math.floor(target.duration);
                      updateDoc(doc(db, 'kamatahan_audio', audio.id), {
                        duration: durationInSeconds,
                        durationFormatted: formatDuration(durationInSeconds),
                        updatedAt: serverTimestamp()
                      });
                    }
                  }}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>

              {/* Audio Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 line-clamp-2">
                    {audio.title}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    audio.status === 'active' 
                      ? 'bg-muted text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {audio.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {audio.description || 'No description'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  <div>
                    <span className="font-medium">Category:</span> {audio.category}
                  </div>
                  <div>
                    <span className="font-medium">Language:</span> {audio.language}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {audio.durationFormatted || formatDuration(audio.duration)}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {formatFileSize(audio.fileSize)}
                  </div>
                </div>

                <div className="text-xs text-gray-400 mb-3">
                  Uploaded: {audio.createdAt instanceof Date 
                    ? audio.createdAt.toLocaleDateString() 
                    : new Date(audio.createdAt).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAudio(audio)}
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  
                  {hasPermission('audio', 'update') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusToggle(audio)}
                      className="text-xs"
                    >
                      {audio.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                  
                  {hasPermission('audio', 'delete') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(audio.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700 border-red-300"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audio Details Modal */}
      {selectedAudio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Audio Details
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAudio(null)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <p className="text-gray-900">{selectedAudio.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900">
                    {selectedAudio.description || 'No description'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <p className="text-gray-900">{selectedAudio.category}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <p className="text-gray-900">{selectedAudio.language}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <p className="text-gray-900">
                      {selectedAudio.durationFormatted || formatDuration(selectedAudio.duration)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Size
                    </label>
                    <p className="text-gray-900">{formatFileSize(selectedAudio.fileSize)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File URL
                  </label>
                  <p className="text-sm text-gray-600 break-all">
                    {selectedAudio.fileUrl}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <p className="text-gray-900">{selectedAudio.status}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Public
                    </label>
                    <p className="text-gray-900">
                      {selectedAudio.isPublic ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created
                    </label>
                    <p className="text-gray-900">
                      {selectedAudio.createdAt instanceof Date 
                        ? selectedAudio.createdAt.toLocaleString() 
                        : new Date(selectedAudio.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Updated
                    </label>
                    <p className="text-gray-900">
                      {selectedAudio.updatedAt instanceof Date 
                        ? selectedAudio.updatedAt.toLocaleString() 
                        : new Date(selectedAudio.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioLibrary;

