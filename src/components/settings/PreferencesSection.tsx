'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Globe } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useThemeSettings } from '@/contexts/ThemeSettingsContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { theme } = useTheme();
  const { accent, radius, setAccent, setRadius, setMode } = useThemeSettings();
  const { language: currentLanguage, setLanguage } = useLanguage();
  const [preferences, setPreferences] = useState<AppPreferences>({
    theme: 'auto',
    timeFormat: '12h',
    defaultDuration: 15,
    language: currentLanguage,
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
    } else {
      // If no saved preferences, use current language from context
      setPreferences(prev => ({ ...prev, language: currentLanguage }));
    }
  }, [currentLanguage]);

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
    // Ensure language is also applied to the context
    setLanguage(preferences.language);
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
    <div className="bg-card rounded-xl p-6 shadow-lg border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
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
        {/* Appearance (live, persisted) */}
        <div>
          <label className="text-sm font-medium mb-3 block">Appearance</label>
          <div className="mb-3 flex gap-2">
            {(['light','dark','system'] as const).map(m => (
              <Button key={m} size="sm" variant={theme===m? 'default':'outline'} onClick={() => setMode(m)}>
                {m}
              </Button>
            ))}
          </div>
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Accent</p>
            <div className="grid grid-cols-6 gap-2">
              {(['green','blue','violet','amber','rose','teal'] as Array<'green'|'blue'|'violet'|'amber'|'rose'|'teal'>).map((a) => (
                <button key={a} onClick={() => setAccent(a)} className={`h-8 rounded-md border ${accent===a? 'ring-2 ring-primary':''}`} style={{ background: 'var(--primary)' }} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Radius: {radius}px</p>
            <input type="range" min={4} max={20} value={radius} onChange={(e)=> setRadius(parseInt(e.target.value))} />
          </div>
        </div>
        {/* Theme Preference */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'auto'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => handlePreferenceChange('theme', theme)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  preferences.theme === theme
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    {theme === 'light' && <Sun size={20} />}
                    {theme === 'dark' && <Moon size={20} />}
                    {theme === 'auto' && <Monitor size={20} />}
                  </div>
                  <div className="text-sm font-medium capitalize">
                    {theme}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Format */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Time Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['12h', '24h'] as const).map((format) => (
              <button
                key={format}
                onClick={() => handlePreferenceChange('timeFormat', format)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  preferences.timeFormat === format
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-mono mb-1">
                    {format === '12h' ? '1:30 PM' : '13:30'}
                  </div>
                  <div className="text-sm font-medium">
                    {format === '12h' ? '12-hour' : '24-hour'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Default Meditation Duration */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Default Meditation Duration
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[5, 10, 15, 20, 30].map((duration) => (
              <button
                key={duration}
                onClick={() => handlePreferenceChange('defaultDuration', duration)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  preferences.defaultDuration === duration
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {duration}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    minutes
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Language
          </label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { code: 'en', name: 'English' },
              { code: 'si', name: 'සිංහල' }
            ]).map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  const langCode = lang.code as 'en' | 'si';
                  handlePreferenceChange('language', langCode);
                  setLanguage(langCode);
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  preferences.language === lang.code
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Globe size={18} />
                  </div>
                  <div className="text-sm font-medium">
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
              <label className="text-sm font-medium">
                Notifications
              </label>
              <p className="text-xs text-muted-foreground">
                Receive meditation reminders and session completion notifications
              </p>
            </div>
            <button
              onClick={() => handlePreferenceChange('notifications', !preferences.notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.notifications ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-primary-foreground transition-transform ${
                  preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">
                Auto-save Sessions
              </label>
              <p className="text-xs text-muted-foreground">
                Automatically save meditation sessions to your logbook
              </p>
            </div>
            <button
              onClick={() => handlePreferenceChange('autoSave', !preferences.autoSave)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.autoSave ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-primary-foreground transition-transform ${
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



