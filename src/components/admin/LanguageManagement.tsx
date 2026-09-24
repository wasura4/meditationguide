'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LanguageService, Translation } from '@/lib/languageService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import enTranslations from '@/i18n/locales/en/common.json';
import siTranslations from '@/i18n/locales/si/common.json';


export const LanguageManagement: React.FC = () => {
  const { adminUser, hasPermission } = useAdminAuth();
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
  const [syncing, setSyncing] = useState(false);

  const loadTranslations = useCallback(async () => {
    setLoading(true);
    try {
      // Always start from English keys so UI never shows 0
      const allKeys = getAllKeys(enTranslations);
      const baseRows: Translation[] = allKeys.map(key => ({
        id: '',
        key,
        english: getNestedValue(enTranslations as Record<string, unknown>, key) || key,
        sinhala: getNestedValue(siTranslations as Record<string, unknown>, key) || '',
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
      const merged = baseRows.map(row => {
        const remote = dbMap.get(row.key);
        return remote ? { ...remote, sinhala: remote.sinhala?.trim() ? remote.sinhala : row.sinhala } : row;
      });
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

  const handleSaveTranslation = async (key: string, sinhala: string) => {
    if (!hasPermission('settings','update') || !hasPermission('settings','create')) return;
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
    if (!hasPermission('settings','update') || !hasPermission('settings','create')) return;
    setEditingKey(key);
    setEditValue(currentValue);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleSyncAllKeys = async () => {
    if (!adminUser?.id || !hasPermission('settings','update') || !hasPermission('settings','create')) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'You must be logged in to sync translations',
        duration: 5000,
      });
      return;
    }

    const confirmed = window.confirm(
      'This will sync all English keys from the codebase to Firestore. ' +
      'Existing Sinhala translations will be preserved. ' +
      'This may take a few moments. Continue?'
    );

    if (!confirmed) return;

    try {
      setSyncing(true);
      const result = await LanguageService.syncAllEnglishKeys(
        enTranslations as Record<string, unknown>,
        adminUser.id
      );

      showToast({
        type: 'success',
        title: 'Sync Complete',
        message: `Synced ${result.synced} keys to Firestore${result.errors > 0 ? ` (${result.errors} errors)` : ''}`,
        duration: 5000,
      });

      await loadTranslations();
    } catch (error) {
      console.error('Error syncing keys:', error);
      showToast({
        type: 'error',
        title: 'Sync Failed',
        message: (error as { message?: string })?.message || 'Failed to sync keys',
        duration: 5000,
      });
    } finally {
      setSyncing(false);
    }
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
        <p className="mt-4 text-muted-foreground">Loading translations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(!hasPermission('settings','update') || !hasPermission('settings','create')) && <p className="text-sm text-muted-foreground">Read-only access. Translation editing requires create and update permissions.</p>}
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Language Management</h2>
          <p className="text-muted-foreground mt-1">Manage Sinhala translations for all application text</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSyncAllKeys}
            variant="default"
            size="sm"
            disabled={syncing || !hasPermission('settings','update') || !hasPermission('settings','create')}
          >
            {syncing ? 'Syncing...' : 'Sync All Keys'}
          </Button>
          <Button
            onClick={loadTranslations}
            variant="outline"
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-card border border-border rounded-xl p-3">
        <div className="flex flex-wrap gap-4 items-center">
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={showMissingOnly} onChange={(e) => setShowMissingOnly(e.target.checked)} />
            Missing Sinhala ({stats.missing})
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={showChangedEnglishOnly} onChange={(e) => setShowChangedEnglishOnly(e.target.checked)} />
            English updated ({stats.changed})
          </label>
          <div className="text-xs text-muted-foreground">Total keys: {stats.total}</div>

        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-4 shadow-lg border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by key, English, or Sinhala..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
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
      <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  English
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sinhala (සිංහල)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {filteredTranslations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No translations found
                  </td>
                </tr>
              ) : (
                filteredTranslations.map((translation) => (
                  <tr key={translation.key} className="hover:bg-muted">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-foreground">
                        {translation.key}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">
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
                            className="flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
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
                        <div className="flex items-center gap-2">
                          {translation.sinhala ? (
                            <span className="text-sm text-foreground">{translation.sinhala}</span>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Missing
                              </span>
                              <span className="text-muted-foreground italic text-sm">Not translated</span>
                            </>
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
                          disabled={!hasPermission('settings','update') || !hasPermission('settings','create')}
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
        <div className="px-6 py-4 border-t border-border bg-muted">
          <div className="text-sm text-muted-foreground">
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

