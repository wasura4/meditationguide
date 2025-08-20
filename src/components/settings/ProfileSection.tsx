'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface ProfileSectionProps {
  onEditProfile: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ onEditProfile }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Profile Information
        </h3>
        <Button onClick={onEditProfile} variant="outline" size="sm">
          Edit Profile
        </Button>
      </div>

      <div className="space-y-4">
        {/* Avatar & Basic Info */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              {user.displayName || 'Anonymous User'}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {user.isAnonymous ? 'Guest Account' : 'Full Account'}
            </p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Display Name
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {user.displayName || 'Not set'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Email
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {user.email || 'Anonymous'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Account Type
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {user.isAnonymous ? 'Guest' : 'Full Account'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Member Since
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'Recently'}
            </p>
          </div>
        </div>

        {/* Account Status */}
        {user.isAnonymous && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Guest Account
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  You&apos;re using a guest account. Upgrade to a full account to save your progress and access all features.
                </p>
                <div className="mt-3">
                  <Button size="sm" variant="outline" className="text-yellow-700 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-300 dark:border-yellow-600 dark:hover:bg-yellow-900/30">
                    Upgrade Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
