'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  fallback 
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required and user is not logged in
  if (requireAuth && !user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-md mx-auto text-center px-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Please sign in or create an account to access this page.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/auth')}
              className="w-full"
              variant="meditation"
            >
              Sign In
            </Button>
            
            <Button
              onClick={() => router.push('/auth?mode=register')}
              variant="outline"
              className="w-full"
            >
              Create Account
            </Button>
            
            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (user && !requireAuth) {
    router.push('/dashboard');
    return null;
  }

  // User is authenticated or no auth required, render children
  return <>{children}</>;
};

