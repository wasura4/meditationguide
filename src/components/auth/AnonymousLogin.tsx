'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface AnonymousLoginProps {
  onSwitchToLogin: () => void;
  onSwitchToRegister: () => void;
}

export const AnonymousLogin: React.FC<AnonymousLoginProps> = ({ 
  onSwitchToLogin, 
  onSwitchToRegister 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const { loginAnonymously } = useAuth();

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await loginAnonymously();
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Anonymous login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to login anonymously');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Try as Guest
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Experience the app without creating an account
        </p>
      </div>

      <div className="space-y-6">
        {/* Benefits */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            What you can do as a guest:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Use the meditation timer</li>
            <li>• Explore meditation types</li>
            <li>• Listen to sample audio</li>
            <li>• Read Dhamma content</li>
            <li>• Upgrade to full account anytime</li>
          </ul>
        </div>

        {/* Limitations */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            Guest limitations:
          </h3>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
            <li>• No progress tracking</li>
            <li>• No session history</li>
            <li>• No personalized settings</li>
            <li>• Data may be lost</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Anonymous Login Button */}
        <Button
          onClick={handleAnonymousLogin}
          className="w-full"
          variant="meditation"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Starting...' : 'Start as Guest'}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or create an account</span>
          </div>
        </div>

        {/* Alternative Options */}
        <div className="space-y-3">
          <Button
            onClick={onSwitchToRegister}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            Create Full Account
          </Button>
          
          <Button
            onClick={onSwitchToLogin}
            variant="ghost"
            className="w-full"
            disabled={isLoading}
          >
            Sign In to Existing Account
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          You can upgrade your guest account to a full account at any time from the settings menu.
        </p>
      </div>
    </div>
  );
};
