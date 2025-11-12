'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { PreferencesSection, AppPreferences } from '@/components/settings/PreferencesSection';
import { DataPrivacySection } from '@/components/settings/DataPrivacySection';
import { EditProfileModal } from '@/components/settings/EditProfileModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Settings, Shield, ArrowLeft, LogOut, Info } from 'lucide-react';

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
  };

  const handlePreferencesSave = (preferences: AppPreferences) => {
    console.log('Preferences saved:', preferences);
  };

  const handleDataExport = (data: ExportData) => {
    console.log('Data exported:', data);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'data', label: 'Data & Privacy', icon: Shield },
  ] as const;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Modern Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Settings</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Customize your experience</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    await logout();
                    router.replace('/');
                  } catch {}
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('auth.sign_out')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Modern Tab Navigation */}
            <div className="mb-8">
              <div className="inline-flex items-center bg-muted/50 backdrop-blur-sm rounded-xl p-1.5 border shadow-sm w-full sm:w-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex-1 sm:flex-initial justify-center ${
                        activeTab === tab.id
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {activeTab === tab.id && (
                        <span className="hidden sm:inline ml-1 px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
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

            {/* About Us Section */}
            <div className="mt-8 bg-card rounded-2xl p-6 shadow-sm border">
              <button
                onClick={() => router.push('/about')}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground text-lg">About Us</h3>
                    <p className="text-sm text-muted-foreground">Learn more about Nirvanaya</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>
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
