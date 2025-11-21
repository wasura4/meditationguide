'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Clock, Bell, Save, RotateCcw, Palette } from 'lucide-react';
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
  const { theme, setTheme } = useTheme();
  const { accent, radius, setAccent, setRadius } = useThemeSettings();
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
      // Sync current theme from next-themes
      const currentTheme = (theme === 'system' ? 'auto' : theme) as 'light' | 'dark' | 'auto';
      setPreferences(prev => ({ ...prev, language: currentLanguage, theme: currentTheme || 'auto' }));
    }
  }, [currentLanguage, theme]);

  const handlePreferenceChange = (key: keyof AppPreferences, value: AppPreferences[keyof AppPreferences]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    localStorage.setItem('nirvanaya-preferences', JSON.stringify(preferences));
    setLanguage(preferences.language);
    // Apply theme directly via next-themes
    setTheme(preferences.theme === 'auto' ? 'system' : preferences.theme);
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
    setAccent('blue');
    setRadius(12);
    setTheme('system');
    setIsDirty(true);
  };

  const accentColors = [
    { name: 'green', color: 'hsl(142, 76%, 36%)' },
    { name: 'blue', color: 'hsl(221, 83%, 53%)' },
    { name: 'violet', color: 'hsl(263, 70%, 50%)' },
    { name: 'amber', color: 'hsl(38, 92%, 50%)' },
    { name: 'rose', color: 'hsl(346, 77%, 50%)' },
    { name: 'teal', color: 'hsl(173, 58%, 39%)' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Preferences</h2>
          <p className="text-sm text-muted-foreground mt-1">Customize your app experience</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button onClick={handleSave} variant="default" size="sm" disabled={!isDirty} className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Meditation Settings Card */}
      <div className="bg-card rounded-xl p-6 shadow-sm border space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Meditation Settings</h3>
            <p className="text-sm text-muted-foreground">Configure your practice defaults</p>
          </div>
        </div>

        {/* Default Duration */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Default Session Duration</label>
          <div className="grid grid-cols-5 gap-2">
            {[5, 10, 15, 20, 30].map((duration) => (
              <button
                key={duration}
                onClick={() => handlePreferenceChange('defaultDuration', duration)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  preferences.defaultDuration === duration
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{duration}</div>
                  <div className="text-xs text-muted-foreground">min</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Format */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Time Format</label>
          <div className="grid grid-cols-2 gap-3">
            {(['12h', '24h'] as const).map((format) => (
              <button
                key={format}
                onClick={() => handlePreferenceChange('timeFormat', format)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  preferences.timeFormat === format
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-mono font-semibold text-foreground mb-1">
                    {format === '12h' ? '1:30 PM' : '13:30'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format === '12h' ? '12-hour' : '24-hour'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* General Settings Card */}
      <div className="bg-card rounded-xl p-6 shadow-sm border space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">General Settings</h3>
            <p className="text-sm text-muted-foreground">Theme, language and notifications</p>
          </div>
        </div>

        {/* Theme Mode */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Theme Mode</label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { mode: 'light', label: 'Light', icon: '☀️' },
              { mode: 'dark', label: 'Dark', icon: '🌙' },
              { mode: 'auto', label: 'Auto', icon: '💫' }
            ] as const).map((themeOption) => (
              <button
                key={themeOption.mode}
                onClick={() => handlePreferenceChange('theme', themeOption.mode)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  preferences.theme === themeOption.mode
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{themeOption.icon}</div>
                  <div className="text-sm font-medium text-foreground">{themeOption.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Language</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { code: 'en', name: 'English', flag: '🇬🇧' },
              { code: 'si', name: 'සිංහල', flag: '🇱🇰' }
            ]).map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  const langCode = lang.code as 'en' | 'si';
                  handlePreferenceChange('language', langCode);
                  setLanguage(langCode);
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  preferences.language === lang.code
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{lang.flag}</div>
                  <div className="text-sm font-medium text-foreground">{lang.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium text-foreground">Notifications</div>
                <div className="text-xs text-muted-foreground">Meditation reminders and updates</div>
              </div>
            </div>
            <button
              onClick={() => handlePreferenceChange('notifications', !preferences.notifications)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                preferences.notifications ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-background shadow-lg transition-transform ${
                  preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
            <div className="flex items-center gap-3">
              <Save className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium text-foreground">Auto-save Sessions</div>
                <div className="text-xs text-muted-foreground">Save sessions to logbook automatically</div>
              </div>
            </div>
            <button
              onClick={() => handlePreferenceChange('autoSave', !preferences.autoSave)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                preferences.autoSave ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-background shadow-lg transition-transform ${
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
