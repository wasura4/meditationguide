'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { LanguageService, Translation } from '@/lib/languageService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import enTranslations from '@/i18n/locales/en/common.json';


export const LanguageManagement: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const { showToast } = useToast();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [showChangedEnglishOnly, setShowChangedEnglishOnly] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [isAdminDoc, setIsAdminDoc] = useState<boolean | null>(null);

  const loadTranslations = useCallback(async () => {
    setLoading(true);
    try {
      // Always start from English keys so UI never shows 0
      const allKeys = getAllKeys(enTranslations);
      const baseRows: Translation[] = allKeys.map(key => ({
        id: '',
        key,
        english: getNestedValue(enTranslations as Record<string, unknown>, key) || key,
        sinhala: '',
        category: getCategoryFromKey(key),
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: adminUser?.id || '',
      }));

      // Try overlay with Firestore values (if available)
      let dbTranslations: Translation[] = [];
      try {
        dbTranslations = await LanguageService.getAllTranslations();
      } catch (err) {
        console.warn('Translations DB fetch failed, showing EN-only list.', err);
      }

      if (dbTranslations.length === 0) {
        setTranslations(baseRows);
        return;
      }

      const dbMap = new Map(dbTranslations.map(t => [t.key, t] as const));
      const merged = baseRows.map(row => dbMap.get(row.key) ?? row);
      setTranslations(merged);
    } catch (error) {
      console.error('Error building translations list:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to build translations list',
        duration: 5000,
      });
      // Fallback to empty when something unexpected happens
      setTranslations([]);
    } finally {
      setLoading(false);
    }
  }, [adminUser?.id, showToast]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  // Check admin doc exists for current user (debug aid)
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setIsAdminDoc(false);
          return;
        }
        const snap = await getDoc(doc(db, 'admin_users', uid));
        setIsAdminDoc(snap.exists());
      } catch (e) {
        console.warn('Admin check failed', e);
        setIsAdminDoc(null);
      }
    };
    checkAdmin();
  }, []);

  const handleSaveTranslation = async (key: string, sinhala: string) => {
    try {
      setSaving(true);
      const translation = translations.find(t => t.key === key);
      if (!translation) return;

      await LanguageService.saveTranslation({
        id: translation.id || undefined,
        key,
        english: translation.english,
        sinhala,
        category: translation.category,
        updatedBy: adminUser?.id || '',
      });

      showToast({
        type: 'success',
        title: 'Success',
        message: 'Translation saved successfully',
        duration: 3000,
      });

      await loadTranslations();
      setEditingKey(null);
    } catch (error) {
      console.error('Error saving translation:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: (error as { message?: string })?.message || 'Failed to save translation',
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (key: string, currentValue: string) => {
    setEditingKey(key);
    setEditValue(currentValue);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const filteredTranslations = useMemo(() => {
    return translations.filter(t => {
      const englishNow = getNestedValue(enTranslations as Record<string, unknown>, t.key) || '';
      const isMissingSi = !t.sinhala || t.sinhala.trim() === '';
      const englishChanged = (t.english || '') !== englishNow;

      const matchesSearch = (t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.english || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.sinhala || '').toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      const matchesMissing = !showMissingOnly || isMissingSi;
      const matchesChangedEn = !showChangedEnglishOnly || englishChanged;
      return matchesSearch && matchesCategory && matchesMissing && matchesChangedEn;
    });
  }, [translations, searchTerm, filterCategory, showMissingOnly, showChangedEnglishOnly]);

  const stats = useMemo(() => {
    const total = translations.length;
    const missing = translations.filter(t => !t.sinhala || t.sinhala.trim() === '').length;
    const changed = translations.filter(t => (t.english || '') !== (getNestedValue(enTranslations as Record<string, unknown>, t.key) || '')).length;
    return { total, missing, changed };
  }, [translations]);

  const categories = Array.from(new Set(translations.map(t => t.category))).sort();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b9e7a] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading translations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Language Management</h2>
          <p className="text-gray-600 mt-1">Manage Sinhala translations for all application text</p>
        </div>
        <Button
          onClick={loadTranslations}
          variant="outline"
          size="sm"
        >
          Refresh
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white border border-gray-200 rounded-xl p-3">
        <div className="flex gap-2 items-center">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search keys or text..."
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="all">All categories</option>
            {Array.from(new Set(translations.map(t => t.category))).sort().map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-4 items-center">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={showMissingOnly} onChange={(e) => setShowMissingOnly(e.target.checked)} />
            Missing Sinhala ({stats.missing})
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={showChangedEnglishOnly} onChange={(e) => setShowChangedEnglishOnly(e.target.checked)} />
            English updated ({stats.changed})
          </label>
          <div className="text-xs text-gray-500">Total keys: {stats.total}</div>
          <button
            type="button"
            onClick={() => setDebugOpen(d => !d)}
            className="ml-2 text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
            title="Show debug info"
          >
            {debugOpen ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>
      </div>

      {debugOpen && (
        <div className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg p-3">
          <div>UID: {auth.currentUser?.uid || 'not signed in'}</div>
          <div>Email: {auth.currentUser?.email || 'n/a'}</div>
          <div>Admin doc exists: {isAdminDoc === null ? 'unknown' : isAdminDoc ? 'yes' : 'no'}</div>
          <div>Project: nirvanaya-web</div>
          {!isAdminDoc && (
            <div className="mt-1 text-red-600">Missing admin_users/&#123;UID&#125; document will prevent writes to translations.</div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by key, English, or Sinhala..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Translations Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  English
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sinhala (සිංහල)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTranslations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No translations found
                  </td>
                </tr>
              ) : (
                filteredTranslations.map((translation) => (
                  <tr key={translation.key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {translation.key}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {translation.english}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingKey === translation.key ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
                            placeholder="Enter Sinhala translation..."
                            autoFocus
                          />
                          <Button
                            onClick={() => handleSaveTranslation(translation.key, editValue)}
                            size="sm"
                            disabled={saving}
                            className="bg-[#6b9e7a] hover:bg-[#5a8a68] text-white"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            size="sm"
                            variant="outline"
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">
                          {translation.sinhala || (
                            <span className="text-gray-400 italic">Not translated</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted text-blue-800">
                        {translation.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingKey === translation.key ? null : (
                        <Button
                          onClick={() => handleEdit(translation.key, translation.sinhala)}
                          size="sm"
                          variant="outline"
                        >
                          {translation.sinhala ? 'Edit' : 'Add'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Showing {filteredTranslations.length} of {translations.length} translations
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get all keys from nested object
function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...getAllKeys(obj[key] as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  return keys;
}

// Helper function to get nested value from object
function getNestedValue(obj: Record<string, unknown>, key: string): string {
  const keys = key.split('.');
  let value: unknown = obj;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return '';
    }
  }
  return typeof value === 'string' ? value : '';
}

// Helper function to get category from key
function getCategoryFromKey(key: string): string {
  const parts = key.split('.');
  return parts[0] || 'common';
}


