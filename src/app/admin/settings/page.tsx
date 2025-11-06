'use client';

import React, { useState, useEffect } from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { LanguageManagement } from '@/components/admin/LanguageManagement';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

export default function AdminSettingsPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'languages'>('system');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    systemMaintenance: false,
    autoBackup: true,
    sessionTimeout: 30,
    maxUploadSize: 100,
    enableAnalytics: true,
    maintenanceMessage: '',
  });
  const { showToast } = useToast();

  useEffect(() => {
    // Load settings from localStorage or Firebase
    const savedSettings = localStorage.getItem('admin_settings');
    if (savedSettings) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      localStorage.setItem('admin_settings', JSON.stringify(settings));
      
      showToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Your settings have been saved successfully',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save settings',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        emailNotifications: true,
        systemMaintenance: false,
        autoBackup: true,
        sessionTimeout: 30,
        maxUploadSize: 100,
        enableAnalytics: true,
        maintenanceMessage: '',
      });
      localStorage.removeItem('admin_settings');
      showToast({
        type: 'success',
        title: 'Settings Reset',
        message: 'Settings have been reset to default values',
        duration: 3000,
      });
    }
  };

  if (!hasPermission('settings', 'read')) {
    return (
      <AdminProtectedRoute>
        <AdminLayout currentPage="/admin/settings">
          <div className="text-center py-12">
            <p className="text-gray-600">You don&apos;t have permission to view settings.</p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/settings">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
              <p className="text-gray-600 mt-1">Configure system settings and preferences</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => (window.location.href = '/admin/theme')}
                variant="outline"
                size="sm"
              >
                🎨 Theme
              </Button>
              {activeTab === 'system' && (
              <>
                <Button
                  onClick={handleResetSettings}
                  variant="outline"
                  size="sm"
                >
                  Reset to Default
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="bg-[#6b9e7a] hover:bg-[#5a8a68] text-white"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </>
            )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200 inline-flex">
            <button
              onClick={() => setActiveTab('system')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'system'
                  ? 'bg-[#6b9e7a] text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              System Settings
            </button>
            <button
              onClick={() => setActiveTab('languages')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'languages'
                  ? 'bg-[#6b9e7a] text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Languages
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'languages' ? (
            <LanguageManagement />
          ) : (
            <>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Notification Settings */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                      <p className="text-xs text-gray-500">Receive email alerts for important events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6b9e7a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6b9e7a]"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* System Settings */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">System Maintenance Mode</p>
                      <p className="text-xs text-gray-500">Enable maintenance mode to restrict access</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.systemMaintenance}
                        onChange={(e) => setSettings({ ...settings, systemMaintenance: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6b9e7a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6b9e7a]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Auto Backup</p>
                      <p className="text-xs text-gray-500">Automatically backup data daily</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoBackup}
                        onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6b9e7a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6b9e7a]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enable Analytics</p>
                      <p className="text-xs text-gray-500">Track user behavior and platform metrics</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableAnalytics}
                        onChange={(e) => setSettings({ ...settings, enableAnalytics: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6b9e7a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6b9e7a]"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-logout after inactivity</p>
                  </div>
                </div>
              </div>

              {/* Upload Settings */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Maximum Upload Size (MB)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="500"
                      value={settings.maxUploadSize}
                      onChange={(e) => setSettings({ ...settings, maxUploadSize: parseInt(e.target.value) || 100 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum file size for uploads</p>
                  </div>
                </div>
              </div>

              {/* Maintenance Message */}
              {settings.systemMaintenance && (
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Message</h2>
                  <div>
                    <textarea
                      value={settings.maintenanceMessage}
                      onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                      placeholder="Enter maintenance message for users..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">This message will be displayed to users during maintenance</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Admin Info */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Admin Name</p>
                    <p className="text-sm font-medium text-gray-900">{adminUser?.displayName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{adminUser?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {adminUser?.role?.replace('_', ' ') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Login</p>
                    <p className="text-sm font-medium text-gray-900">
                      {adminUser?.lastLogin 
                        ? new Date(adminUser.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Storage</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Maintenance Mode</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      settings.systemMaintenance 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {settings.systemMaintenance ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      showToast({
                        type: 'info',
                        title: 'Export Data',
                        message: 'Data export feature coming soon',
                        duration: 3000,
                      });
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      showToast({
                        type: 'info',
                        title: 'Backup Database',
                        message: 'Database backup feature coming soon',
                        duration: 3000,
                      });
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Backup Database
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      showToast({
                        type: 'info',
                        title: 'Clear Cache',
                        message: 'Cache cleared successfully',
                        duration: 3000,
                      });
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Clear Cache
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
        )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
