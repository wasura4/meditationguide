'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface PreferencesSectionProps {
  onSavePreferences: (preferences: AppPreferences) => void;
}

export interface AppPreferences {
  theme: 'light' | 'dark' | 'auto';
  timeFormat: '12h' | '24h';
  defaultDuration: number;
  language: 'en' | 'si';
  notifications: boolean;
  autoSave: boolean;
}

export const PreferencesSection: React.FC<PreferencesSectionProps> = ({ onSavePreferences }) => {
  const [preferences, setPreferences] = useState<AppPreferences>({
    theme: 'auto',
    timeFormat: '12h',
    defaultDuration: 15,
    language: 'en',
    notifications: true,
    autoSave: true,
  });

  const [isDirty, setIsDirty] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('nirvanaya-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
      } catch (error) {
        console.error('Failed to parse saved preferences:', error);
      }
    }
  }, []);

  // Apply theme preference
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else if (preferences.theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      // Auto mode - use system preference
      root.classList.remove('light', 'dark');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.add('light');
      }
    }
  }, [preferences.theme]);

  const handlePreferenceChange = (key: keyof AppPreferences, value: AppPreferences[keyof AppPreferences]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    localStorage.setItem('nirvanaya-preferences', JSON.stringify(preferences));
    onSavePreferences(preferences);
    setIsDirty(false);
  };

  const handleReset = () => {
    const defaultPreferences: AppPreferences = {
      theme: 'auto',
      timeFormat: '12h',
      defaultDuration: 15,
      language: 'en',
      notifications: true,
      autoSave: true,
    };
    setPreferences(defaultPreferences);
    setIsDirty(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          App Preferences
        </h3>
        <div className="flex space-x-2">
          <Button onClick={handleReset} variant="outline" size="sm">
            Reset
          </Button>
          <Button 
            onClick={handleSave} 
            variant="default" 
            size="sm"
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Theme Preference */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'auto'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => handlePreferenceChange('theme', theme)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  preferences.theme === theme
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">
                    {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🔄'}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {theme}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Format */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
            Time Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['12h', '24h'] as const).map((format) => (
              <button
                key={format}
                onClick={() => handlePreferenceChange('timeFormat', format)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  preferences.timeFormat === format
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-mono text-gray-900 dark:text-white mb-1">
                    {format === '12h' ? '1:30 PM' : '13:30'}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {format === '12h' ? '12-hour' : '24-hour'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Default Meditation Duration */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
            Default Meditation Duration
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[5, 10, 15, 20, 30].map((duration) => (
              <button
                key={duration}
                onClick={() => handlePreferenceChange('defaultDuration', duration)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  preferences.defaultDuration === duration
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {duration}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    minutes
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
            Language
          </label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { code: 'en', name: 'English', flag: '🇺🇸' },
              { code: 'si', name: 'සිංහල', flag: '🇱🇰' }
            ]).map((lang) => (
              <button
                key={lang.code}
                onClick={() => handlePreferenceChange('language', lang.code as 'en' | 'si')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  preferences.language === lang.code
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">{lang.flag}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {lang.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Preferences */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notifications
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receive meditation reminders and session completion notifications
              </p>
            </div>
            <button
              onClick={() => handlePreferenceChange('notifications', !preferences.notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-save Sessions
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically save meditation sessions to your logbook
              </p>
            </div>
            <button
              onClick={() => handlePreferenceChange('autoSave', !preferences.autoSave)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.autoSave ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.autoSave ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
