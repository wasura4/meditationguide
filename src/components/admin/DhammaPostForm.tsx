'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { DhammaPost, DhammaPostFormData } from '@/types/admin';
import ImageUploadField from './ImageUploadField';
import { useToast } from '@/components/ui/toast';
import TiptapEditor from './TiptapEditor';

interface DhammaPostFormProps {
  post?: DhammaPost;
  onSave: (post: DhammaPostFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function DhammaPostForm({ post, onSave, onCancel, isEditing = false }: DhammaPostFormProps) {
  const { adminUser } = useAdminAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<DhammaPostFormData>({
    title: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    category: 'meditation',
    tags: [],
    language: 'si',
    status: 'draft',
    featured: false,
    seoTitle: '',
    seoDescription: '',
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [recovery, setRecovery] = useState<DhammaPostFormData | null>(null);
  const [draftStatus, setDraftStatus] = useState('');
  const [preview, setPreview] = useState(false);
  const savingRef = useRef(false);
  const draftKey = `nirvanaya-dhamma-draft-v1:${adminUser?.id || 'guest'}:${post?.id || 'new'}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || 'null');
      if (saved?.version === 1 && typeof saved.data?.title === 'string' && typeof saved.data?.content === 'string' && Array.isArray(saved.data?.tags)) setRecovery(saved.data);
    } catch { setDraftStatus('Draft recovery is unavailable in this browser.'); }
  }, [draftKey]);

  useEffect(() => {
    if (!dirty || recovery || !adminUser) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ version: 1, data: formData }));
      setDraftStatus('Recovery copy saved on this device. Use Save to store it in your account.');
    } catch { setDraftStatus('Recovery copy could not be saved. Keep this page open until you save.'); }
  }, [formData, dirty, recovery, draftKey, adminUser]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || '',
        featuredImage: post.featuredImage || '',
        category: post.category,
        tags: post.tags,
        language: post.language,
        status: post.status,
        featured: post.featured,
        seoTitle: post.seoTitle || '',
        seoDescription: post.seoDescription || '',
      });
    }
  }, [post]);

  const handleInputChange = (field: keyof DhammaPostFormData, value: DhammaPostFormData[keyof DhammaPostFormData]) => {
    setDirty(true);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    setDirty(true);
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setDirty(true);
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = (submitter?.value || formData.status) as DhammaPostFormData['status'];
    const text = new DOMParser().parseFromString(formData.content, 'text/html').body.textContent?.replace(/\u00a0/g, ' ').trim();
    if (!formData.title.trim() || (status === 'published' && !text)) {
      setError('Add a title and article text before publishing. Drafts only need a title.');
      return;
    }
    savingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      await onSave({ ...formData, title: formData.title.trim(), status });
      setDirty(false);
      try { localStorage.removeItem(draftKey); } catch { /* Save already succeeded. */ }
      showToast({
        type: 'success',
        title: isEditing ? 'Post Updated!' : 'Post Created!',
        message: isEditing ? 'Your Dhamma post has been successfully updated.' : 'Your new Dhamma post has been created successfully.',
        duration: 4000
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save post';
      setError(errorMessage);
      showToast({
        type: 'error',
        title: 'Error Saving Post',
        message: errorMessage,
        duration: 6000
      });
    } finally {
      savingRef.current = false;
      setLoading(false);
    }
  };

  const calculateReadTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const categories = [
    { value: 'meditation', label: 'Meditation' },
    { value: 'buddhism', label: 'Buddhism' },
    { value: 'philosophy', label: 'Philosophy' },
    { value: 'practice', label: 'Practice' },
    { value: 'teachings', label: 'Teachings' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'si', label: 'Sinhala' },
    { value: 'pa', label: 'Pali' },
  ];

  const statuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  if (!adminUser) {
    return (
      <div className="bg-[var(--color-status-error)]/10 border border-[var(--color-status-error)] rounded-lg p-4">
        <p className="text-[var(--color-status-error)]">You must be logged in as an admin to manage Dhamma posts.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset disabled={loading} className="space-y-6 min-w-0">
      <div className="rounded-xl border bg-white dark:bg-gray-800 p-5 space-y-3">
        <h2 className="text-xl font-semibold">{isEditing ? 'Edit Dhamma article' : 'Write a Dhamma article'}</h2>
        <p className="text-sm text-gray-500">Write, review the phone preview, then publish when your article is ready.</p>
        <p role="status" className="text-sm">{loading ? 'Saving to your account…' : draftStatus}</p>
        {recovery && <div className="flex flex-wrap gap-3 items-center">
          <span>An unfinished draft is available on this device.</span>
          <Button type="button" onClick={() => { setFormData(recovery); setRecovery(null); setDirty(true); }}>Restore draft</Button>
          <Button type="button" variant="outline" onClick={() => { try { localStorage.removeItem(draftKey); } catch {} setRecovery(null); }}>Discard recovery copy</Button>
        </div>}
        <Button type="button" variant="outline" onClick={() => setPreview(value => !value)}>{preview ? 'Hide preview' : 'Preview on phone'}</Button>
        {preview && <iframe title="Article phone preview" sandbox="" className="mx-auto w-full max-w-[390px] h-[600px] border rounded-2xl bg-white" srcDoc={`<!doctype html><html lang="${formData.language}"><head><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:;"><style>body{font-family:Arial,sans-serif;line-height:1.9;padding:20px;color:#24332b;overflow-wrap:anywhere}img,iframe,table{max-width:100%}h1{font-size:24px;line-height:1.5}blockquote{border-left:3px solid #789b82;margin:16px 0;padding-left:16px}</style></head><body><h1>${formData.title.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!))}</h1>${formData.content}</body></html>`} />}
      </div>
      {error && (
        <div role="alert" className="bg-[var(--color-status-error)]/10 border border-[var(--color-status-error)] rounded-lg p-4">
          <p className="text-[var(--color-status-error)]">{error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter post title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Excerpt
          </label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => handleInputChange('excerpt', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief summary of the post (optional)"
          />
        </div>
      </div>

      {/* Featured Image */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <ImageUploadField
          value={formData.featuredImage}
          onChange={(imageUrl) => handleInputChange('featuredImage', imageUrl)}
          onRemove={() => handleInputChange('featuredImage', '')}
          label="Featured Image"
          placeholder="Upload a beautiful image that represents your Dhamma post"
        />
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content *
            </label>
            <TiptapEditor
              value={formData.content}
              onChange={(content) => handleInputChange('content', content)}
              placeholder="Write your Dhamma post content here... You can format text, add images, and embed YouTube videos directly!"
            />
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Estimated reading time: {calculateReadTime(formData.content.replace(/<[^>]*>/g, ''))} minutes
            </div>
          </div>

          {/* YouTube Video Embed Helper */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              🎥 YouTube Video Embed Guide
            </h4>
            <div className="space-y-2">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                To embed a YouTube video:
              </p>
              <ol className="text-xs text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-1">
                <li>Click the &quot;Video&quot; button in the toolbar</li>
                <li>Paste your YouTube video URL</li>
                <li>Or use the video embed code directly</li>
              </ol>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                The video will automatically appear in your post when published.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language *
            </label>
            <select
              required
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status *
            </label>
            <select
              required
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => handleInputChange('featured', e.target.checked)}
              className="mr-2 rounded border-gray-300 text-[var(--primary)] focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Feature this post
            </span>
          </label>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tags</h3>
        
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add a tag"
          />
          <Button
            type="button"
            onClick={addTag}
            variant="outline"
            size="sm"
          >
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-muted dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 text-[var(--primary)] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* SEO */}
      <details className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <summary className="text-lg font-semibold text-gray-900 dark:text-white mb-4 cursor-pointer">Advanced: search engine metadata</summary>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SEO Title
            </label>
            <input
              type="text"
              value={formData.seoTitle}
              onChange={(e) => handleInputChange('seoTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="SEO-optimized title (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SEO Description
            </label>
            <textarea
              value={formData.seoDescription}
              onChange={(e) => handleInputChange('seoDescription', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="SEO description for search engines (optional)"
            />
          </div>
        </div>
      </details>

      {/* Actions */}
      <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 bg-white dark:bg-gray-800 border-t p-4">
        <Button
          type="button"
          onClick={() => { if (!dirty || window.confirm('Leave this article? Your recovery copy will remain on this device.')) onCancel(); }}
          variant="outline"
          disabled={loading}
        >
          Cancel
        </Button>
        {formData.status !== 'published' && <Button type="submit" value="draft" variant="outline">Save draft</Button>}
        <Button
          type="submit"
          value={formData.status === 'archived' ? 'archived' : 'published'}
          variant="meditation"
          disabled={loading}
        >
          {loading ? 'Saving…' : formData.status === 'published' ? 'Save changes' : formData.status === 'archived' ? 'Save as archived' : 'Publish article'}
        </Button>
      </div>
      </fieldset>
    </form>
  );
}

