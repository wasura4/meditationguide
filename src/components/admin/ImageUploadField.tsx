'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useToast } from '@/components/ui/toast';

interface ImageUploadFieldProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  onRemove: () => void;
  label?: string;
  placeholder?: string;
}

export default function ImageUploadField({ 
  value, 
  onChange, 
  onRemove, 
  label = "Featured Image",
  placeholder = "Upload a featured image for your post"
}: ImageUploadFieldProps) {
  const { adminUser } = useAdminAuth();
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!adminUser) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'You must be logged in as an admin to upload images.',
        duration: 5000
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please select an image file (JPEG, PNG, GIF, etc.).',
        duration: 5000
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'File Too Large',
        message: 'Image file size must be less than 5MB.',
        duration: 5000
      });
      return;
    }

    try {
      setUploading(true);
      
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `dhamma_posts/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update form
      onChange(downloadURL);
      
      showToast({
        type: 'success',
        title: 'Image Uploaded!',
        message: 'Your featured image has been uploaded successfully.',
        duration: 4000
      });
      
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload image. Please try again.',
        duration: 6000
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    if (confirm('Are you sure you want to remove this image?')) {
      onRemove();
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      
      {value ? (
        // Image Preview
        <div className="space-y-3">
          <div className="relative group">
            <img
              src={value}
              alt="Featured image preview"
              className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
              <Button
                onClick={handleRemove}
                variant="outline"
                size="sm"
                className="opacity-0 group-hover:opacity-100 bg-white text-red-600 hover:bg-[var(--color-status-error)]/10 border-[var(--color-status-error)]"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove Image
              </Button>
            </div>
          </div>
          <Button
            onClick={handleClick}
            variant="outline"
            size="sm"
            disabled={uploading}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Change Image
          </Button>
        </div>
      ) : (
        // Upload Area
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-[var(--primary)] bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="text-gray-400 dark:text-gray-500 text-4xl">
              📷
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {placeholder}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Drag and drop an image here, or click to browse
              </p>
            </div>
            <Button
              onClick={handleClick}
              variant="outline"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Choose Image
                </>
              )}
            </Button>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>Supported formats: JPEG, PNG, GIF</p>
              <p>Max file size: 5MB</p>
            </div>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

