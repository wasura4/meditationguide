'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { PreferencesSection, AppPreferences } from '@/components/settings/PreferencesSection';
import { DataPrivacySection } from '@/components/settings/DataPrivacySection';
import { EditProfileModal } from '@/components/settings/EditProfileModal';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExportData {
  user: {
    id: string;
    displayName?: string | null;
    email?: string | null;
    createdAt?: Date;
    isAnonymous?: boolean;
  };
  sessions: unknown[];
  exportDate: string;
  totalSessions: number;
  totalMinutes: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'data'>('profile');

  const handleEditProfile = () => {
    setIsEditProfileOpen(true);
  };

  const handleProfileSave = (profile: { displayName: string; email: string }) => {
    console.log('Profile updated:', profile);
    // You could show a success message here
  };

  const handlePreferencesSave = (preferences: AppPreferences) => {
    console.log('Preferences saved:', preferences);
    // You could show a success message here
  };

  const handleDataExport = (data: ExportData) => {
    console.log('Data exported:', data);
    // You could show a success message here
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'data', label: 'Data & Privacy', icon: '🔒' },
  ] as const;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Settings
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Customize your experience
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Tab Navigation */}
            <div className="mb-8">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-[var(--primary)] text-[var(--primary)] dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-8">
              {activeTab === 'profile' && (
                <ProfileSection onEditProfile={handleEditProfile} />
              )}

              {activeTab === 'preferences' && (
                <PreferencesSection onSavePreferences={handlePreferencesSave} />
              )}

              {activeTab === 'data' && (
                <DataPrivacySection onExportData={handleDataExport} />
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('dashboard.actions.quick_actions')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm">Back to Dashboard</span>
                </Button>

                <Button
                  onClick={() => router.push('/meditate')}
                  variant="meditation"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{t('dashboard.actions.start_meditating')}</span>
                </Button>

                <Button
                  onClick={() => router.push('/analytics')}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm">{t('dashboard.actions.view_analytics')}</span>
                </Button>
              </div>
            </div>

            {/* Account */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Account</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Manage your account access.</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await logout();
                      router.replace('/');
                    } catch (_) {}
                  }}
                >
                  {t('auth.sign_out')}
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={handleProfileSave}
        />
      </div>
    </ProtectedRoute>
  );
}

