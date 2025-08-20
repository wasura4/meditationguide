'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { KamatahanAudio } from '@/types/admin';
import { useToast } from '@/components/ui/toast';

interface AudioUploadFormProps {
  onUploadSuccess: () => void;
}

const AudioUploadForm: React.FC<AudioUploadFormProps> = ({ onUploadSuccess }) => {
  const { hasPermission } = useAdminAuth();
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'meditation' | 'dhamma_talk' | 'chanting' | 'guided_meditation' | 'background'>('meditation');
  const [duration, setDuration] = useState('');
  const [language, setLanguage] = useState<'en' | 'si' | 'pa'>('en');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const categories = [
    { value: 'meditation', label: 'Meditation' },
    { value: 'dhamma_talk', label: 'Dhamma Talk' },
    { value: 'chanting', label: 'Chanting' },
    { value: 'guided_meditation', label: 'Guided Meditation' },
    { value: 'background', label: 'Background Music' }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'si', label: 'Sinhala' },
    { value: 'pa', label: 'Pali' }
  ];

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        setError('Please select an audio file');
        showToast({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Please select an audio file.',
          duration: 5000
        });
        return;
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        showToast({
          type: 'error',
          title: 'File Too Large',
          message: 'File size must be less than 50MB.',
          duration: 5000
        });
        return;
      }

      setSelectedFile(file);
      setError(null);
      
      // Auto-extract duration if possible
      if (duration === '') {
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.addEventListener('loadedmetadata', () => {
          const minutes = Math.floor(audio.duration / 60);
          const seconds = Math.floor(audio.duration % 60);
          setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        });
      }
    }
  }, [duration, showToast]);

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      setError('Please select a file and enter a title');
      return;
    }

    if (!hasPermission('audio', 'create')) {
      setError('You do not have permission to upload audio');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      // Create unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${selectedFile.name}`;
      const storageRef = ref(storage, `audio/${filename}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Parse duration
      const [minutes, seconds] = duration.split(':').map(Number);
      const durationInSeconds = (minutes * 60) + seconds;

      // Save to Firestore
      const audioData: Omit<KamatahanAudio, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        description: description.trim(),
        category,
        duration: durationInSeconds,
        durationFormatted: duration,
        language,
        isPublic,
        fileUrl: downloadURL,
        fileName: filename,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        uploadedBy: 'admin', // Will be updated with actual admin ID
        status: 'active'
      };

      await addDoc(collection(db, 'kamatahan_audio'), {
        ...audioData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSuccess('Audio uploaded successfully!');
      setUploadProgress(100);
      
      showToast({
        type: 'success',
        title: 'Audio Uploaded!',
        message: 'Your audio file has been uploaded successfully.',
        duration: 4000
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('meditation');
      setDuration('');
      setLanguage('en');
      setIsPublic(true);
      setSelectedFile(null);
      
      // Clear file input
      const fileInput = document.getElementById('audio-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      onUploadSuccess();
      
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload audio';
      setError(errorMessage);
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: errorMessage,
        duration: 6000
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please drop an audio file');
      }
    }
  };

  // Debug permissions
  const { adminUser } = useAdminAuth();
  console.log('Admin user:', adminUser);
  console.log('Has audio create permission:', hasPermission('audio', 'create'));
  
  if (!hasPermission('audio', 'create')) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          You do not have permission to upload audio files. 
          <br />
          <small>Debug: Admin user exists: {adminUser ? 'Yes' : 'No'}</small>
          <br />
          <small>Debug: Permissions: {JSON.stringify(adminUser?.permissions)}</small>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Audio</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audio File *
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              selectedFile 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile ? (
              <div>
                <p className="text-green-800 font-medium">{selectedFile.name}</p>
                <p className="text-sm text-green-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="mt-2"
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-gray-600">Drag and drop audio file here, or</p>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('audio-file')?.click()}
                  className="mt-2"
                >
                  Browse Files
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter audio title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'meditation' | 'dhamma_talk' | 'chanting' | 'guided_meditation' | 'background')}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (MM:SS)
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0:00"
              pattern="[0-9]+:[0-5][0-9]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'si' | 'pa')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Public</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter audio description..."
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={isUploading || !selectedFile || !title.trim()}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : 'Upload Audio'}
        </Button>
      </div>
    </div>
  );
};

export default AudioUploadForm;
