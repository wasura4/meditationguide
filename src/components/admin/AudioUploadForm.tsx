'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, type UploadTask } from 'firebase/storage';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { validateAudioFile, parseAudioDuration } from '@/lib/audioValidation';
import { KamatahanAudio } from '@/types/admin';
import { useToast } from '@/components/ui/toast';

interface AudioUploadFormProps {
  onUploadSuccess: () => void;
}

const AudioUploadForm: React.FC<AudioUploadFormProps> = ({ onUploadSuccess }) => {
  const { hasPermission, adminUser } = useAdminAuth();
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
  const [language, setLanguage] = useState<'en' | 'si' | 'pa'>('si');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [phase, setPhase] = useState('');
  const taskRef = useRef<UploadTask | null>(null);
  const busyRef = useRef(false);
  const attemptRef = useRef<{ id: string; filename: string; url?: string } | null>(null);
  const [awaitingSave, setAwaitingSave] = useState(false);

  useEffect(() => {
    if (!selectedFile) { setPreviewUrl(''); return; }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    const audio = new Audio();
    let active = true;
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      if (!active || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const seconds = Math.max(1, Math.round(audio.duration));
      setDuration(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
    };
    audio.src = url;
    return () => { active = false; audio.onloadedmetadata = null; audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url); };
  }, [selectedFile]);

  useEffect(() => () => { taskRef.current?.cancel(); }, []);
  useEffect(() => {
    if (!selectedFile) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [selectedFile]);

  const selectFile = (file: File) => {
    if (busyRef.current || awaitingSave) return;
    const problem = validateAudioFile(file);
    if (problem) { setError(problem); return; }
    setSelectedFile(file);
    setDuration('');
    attemptRef.current = null;
    setError(null);
    setSuccess(null);
  };

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) selectFile(file);
    event.target.value = '';
  };

  const handleUpload = async () => {
    if (busyRef.current) return;
    if (!selectedFile || !title.trim()) { setError('Choose a file and enter a title.'); return; }
    const fileProblem = validateAudioFile(selectedFile);
    const seconds = parseAudioDuration(duration);
    if (fileProblem || seconds === null) { setError(fileProblem || 'Enter a valid duration, such as 45:30.'); return; }
    if (!adminUser || !hasPermission('audio', 'create')) { setError('You do not have permission to upload audio.'); return; }
    busyRef.current = true;
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    let completed = false;
    try {
      if (!attemptRef.current) {
        const id = doc(collection(db, 'kamatahan_audio')).id;
        attemptRef.current = { id, filename: id + '_' + selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_') };
      }
      const attempt = attemptRef.current;
      if (!attempt.url) {
        setPhase('Uploading audio');
        setUploadProgress(0);
        const task = uploadBytesResumable(ref(storage, 'audio/' + attempt.filename), selectedFile);
        taskRef.current = task;
        await new Promise<void>((resolve, reject) => task.on('state_changed', snapshot => {
          setUploadProgress(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100));
        }, reject, resolve));
        taskRef.current = null;
        attempt.url = await getDownloadURL(ref(storage, 'audio/' + attempt.filename));
      }
      setAwaitingSave(true);
      setPhase('File uploaded. Saving audio details');
      const audioData: Omit<KamatahanAudio, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(), description: description.trim(), category,
        duration: seconds, durationFormatted: duration.trim(), language, isPublic,
        fileUrl: attempt.url, fileName: attempt.filename,
        fileSize: selectedFile.size, fileType: selectedFile.type,
        uploadedBy: adminUser.id, status: isPublic ? 'active' : 'draft'
      };
      // Retries use the same record and Storage path instead of creating duplicates.
      await setDoc(doc(db, 'kamatahan_audio', attempt.id), {
        ...audioData, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      completed = true;
      attemptRef.current = null;
      setAwaitingSave(false);
      setTitle(''); setDescription(''); setDuration(''); setSelectedFile(null);
      setCategory('meditation'); setLanguage('si'); setIsPublic(true);
      setSuccess('Audio and details saved successfully.');
      showToast({ type: 'success', title: 'Audio saved', message: 'Your audio and its details have been saved.', duration: 4000 });
    } catch (error) {
      const canceled = (error as { code?: string }).code === 'storage/canceled';
      setError(canceled ? 'Upload canceled. Your details are still here.' : attemptRef.current?.url
        ? 'The file is uploaded, but its details could not be saved. Keep this page open and retry saving.'
        : 'Upload failed. Your file and details are still here. Check your connection and retry.');
    } finally {
      taskRef.current = null;
      busyRef.current = false;
      setIsUploading(false);
    }
    if (completed) onUploadSuccess();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer.files[0]) selectFile(event.dataTransfer.files[0]);
  };

  if (!hasPermission('audio', 'create')) {
    return (
      <div className="bg-[var(--color-status-error)]/10 border border-[var(--color-status-error)] rounded-lg p-4">
        <p className="text-[var(--color-status-error)]">
          You do not have permission to upload audio files.
        </p>
      </div>
    );
  }

  return (
    <div className="app-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Upload New Audio</h3>

      {error && (
        <div className="bg-[var(--color-status-error)]/10 border border-[var(--color-status-error)] rounded-lg p-3 mb-4">
          <p className="text-[var(--color-status-error)] text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      <fieldset disabled={isUploading} className="space-y-4 min-w-0">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Audio File *
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              selectedFile
                ? 'border-primary bg-muted'
                : 'border-input hover:border-primary'
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
                <p className="text-sm text-[var(--primary)]">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={awaitingSave}
                  onClick={() => { setSelectedFile(null); setDuration(''); }}
                  className="mt-2"
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground">Drag and drop audio file here, or</p>
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

        {previewUrl && <audio controls preload="metadata" src={previewUrl} className="w-full" aria-label="Preview selected audio" />}
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-input min-h-11 rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter audio title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'meditation' | 'dhamma_talk' | 'chanting' | 'guided_meditation' | 'background')}
              className="w-full px-3 py-2 border border-input min-h-11 rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
            <label className="block text-sm font-medium text-foreground mb-2">
              Duration (MM:SS)
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-input min-h-11 rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0:00"
              pattern="[0-9]+:[0-5][0-9]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'si' | 'pa')}
              className="w-full px-3 py-2 border border-input min-h-11 rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              <span className="text-sm text-foreground">Public</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-input min-h-11 rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter audio description..."
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span role="status">{phase}…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
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
          {isUploading ? 'Saving…' : awaitingSave ? 'Retry saving details' : 'Upload and save audio'}
        </Button>
      </fieldset>
      {isUploading && <Button type="button" variant="outline" className="mt-3" disabled={!taskRef.current} onClick={() => taskRef.current?.cancel()}>Cancel upload</Button>}
    </div>
  );
};

export default AudioUploadForm;

