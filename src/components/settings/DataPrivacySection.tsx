'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MeditationService } from '@/lib/meditationService';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface DataPrivacySectionProps {
  onExportData: (data: ExportData) => void;
}

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

export const DataPrivacySection: React.FC<DataPrivacySectionProps> = ({ onExportData }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    if (!user?.id) return;

    setIsExporting(true);
    try {
      // Get user sessions
      const sessions = await MeditationService.getUserSessions(user.id, 10000);
      
      // Prepare export data
      const exportData = {
        user: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          createdAt: user.createdAt,
          isAnonymous: user.isAnonymous,
        },
        sessions: sessions.map(session => ({
          ...session,
          startTime: session.startTime.toISOString(),
          endTime: session.endTime?.toISOString(),
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
        })),
        exportDate: new Date().toISOString(),
        totalSessions: sessions.length,
        totalMinutes: sessions.reduce((sum, s) => sum + s.duration, 0),
      };

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nirvanaya-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onExportData(exportData);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!user?.id) return;

    setIsExporting(true);
    try {
      const sessions = await MeditationService.getUserSessions(user.id, 10000);
      
      // Create CSV content
      const headers = [
        'Date',
        'Type',
        'Duration (minutes)',
        'Status',
        'Rating',
        'Mood',
        'Notes',
        'Distractions',
        'Insights',
        'Start Time',
        'End Time'
      ];

      const csvRows = [headers.join(',')];
      
      sessions.forEach(session => {
        const row = [
          new Date(session.createdAt).toLocaleDateString(),
          session.typeName,
          session.duration,
          session.status,
          session.rating || '',
          session.mood || '',
          `"${(session.notes || '').replace(/"/g, '""')}"`,
          `"${(session.distractions || []).join('; ').replace(/"/g, '""')}"`,
          `"${(session.insights || []).join('; ').replace(/"/g, '""')}"`,
          session.startTime.toLocaleTimeString(),
          session.endTime?.toLocaleTimeString() || ''
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nirvanaya-sessions-${user.id}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including:\n\n' +
      '• All meditation sessions\n' +
      '• Progress and statistics\n' +
      '• Personal preferences\n' +
      '• Account information\n\n' +
      'Type "DELETE" to confirm:'
    );

    if (!confirmed) return;

    const deleteConfirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (deleteConfirmation !== 'DELETE') {
      alert('Account deletion cancelled.');
      return;
    }

    setIsDeleting(true);
    try {
      // Import Firebase auth and user
      const { auth } = await import('@/lib/firebase');
      const { deleteUser } = await import('firebase/auth');
      const { doc, deleteDoc, collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert('No authenticated user found. Please log in again.');
        return;
      }

      // Delete user data from Firestore
      // 1. Delete meditation sessions
      const sessionsQuery = query(collection(db, 'meditation_sessions'), where('userId', '==', user.id));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      await Promise.all(sessionsSnapshot.docs.map(doc => deleteDoc(doc.ref)));

      // 2. Delete user document
      await deleteDoc(doc(db, 'users', user.id));

      // 3. Delete Firebase Authentication account (this also logs out the user)
      await deleteUser(currentUser);

      alert('Your account has been successfully deleted.');
      router.push('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as { code: string };
        if (authError.code === 'auth/requires-recent-login') {
          alert('For security reasons, you need to log in again before deleting your account. Please log out and log back in, then try again.');
        } else {
          alert(`Failed to delete account: ${authError.code}. Please try again or contact support.`);
        }
      } else {
        alert('Failed to delete account. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Data & Privacy
      </h3>

      <div className="space-y-6">
        {/* Data Export */}
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Export Your Data
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download your meditation data in JSON or CSV format for backup or analysis.
          </p>
          <div className="flex space-x-3">
            <Button
              onClick={handleExportData}
              variant="outline"
              size="sm"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export JSON
                </>
              )}
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Account Deletion */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-md font-medium text-red-600 dark:text-red-400 mb-3">
            Danger Zone
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button
            onClick={handleDeleteAccount}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-300 hover:bg-[var(--color-status-error)]/10 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Account
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

