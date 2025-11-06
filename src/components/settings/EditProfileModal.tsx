'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: { displayName: string; email: string }) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const { user, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setError('');
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      // Update display name if changed
      if (displayName !== user.displayName) {
        await updateUserProfile({ displayName });
      }

      // Note: Email update would require re-authentication in Firebase
      // For now, we'll just show a message
      if (email !== user.email) {
        setError('Email updates require re-authentication. Please sign out and sign in again to change your email.');
        setIsLoading(false);
        return;
      }

      onSave({ displayName, email });
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(user?.displayName || '');
    setEmail(user?.email || '');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Profile
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your display name"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This name will be displayed throughout the app
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                disabled={user?.isAnonymous}
              />
              {user?.isAnonymous && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Email cannot be changed for guest accounts
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Used for account recovery and notifications
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-[var(--color-status-error)]/10 dark:bg-[var(--color-status-error)]/20 border border-[var(--color-status-error)] dark:border-[var(--color-status-error)] rounded-lg">
                <p className="text-sm text-[var(--color-status-error)] dark:text-[var(--color-status-error)]">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="default"
                className="flex-1"
                disabled={isLoading || (!displayName.trim() && !user?.displayName)}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

