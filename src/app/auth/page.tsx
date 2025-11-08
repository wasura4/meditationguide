'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { AnonymousLogin } from '@/components/auth/AnonymousLogin';
import { APP_CONFIG } from '@/constants';

type AuthMode = 'login' | 'register' | 'anonymous';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const renderForm = () => {
    switch (authMode) {
      case 'login':
        return (
          <LoginForm
            onSwitchToRegister={() => setAuthMode('register')}
            onSwitchToAnonymous={() => setAuthMode('anonymous')}
          />
        );
      case 'register':
        return (
          <RegisterForm
            onSwitchToLogin={() => setAuthMode('login')}
          />
        );
      case 'anonymous':
        return (
          <AnonymousLogin
            onSwitchToLogin={() => setAuthMode('login')}
            onSwitchToRegister={() => setAuthMode('register')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex">
      {/* Left Side - Meditation Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/90 via-purple-600/80 to-blue-600/90" />

        {/* Abstract Meditation Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 border-2 border-white rounded-full" />
          <div className="absolute top-1/3 left-1/3 w-48 h-48 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-full" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-white/90 hover:text-white transition-colors mb-6">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>

          <div className="max-w-md">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Begin Your Journey to Inner Peace
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              සත්ත විශුද්ධිය - The Seven Purifications
            </p>
            <p className="text-lg text-white/80 leading-relaxed">
              Track your meditation practice, follow the path to enlightenment, and discover peace within.
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-12 right-12 opacity-20">
            <svg className="w-48 h-48" viewBox="0 0 200 200" fill="none">
              <path d="M100 20 L100 180 M20 100 L180 100" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="100" cy="100" r="40" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="100" cy="100" r="20" stroke="white" strokeWidth="2" fill="none"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Back Button */}
          <div className="lg:hidden mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>

          {/* Logo - Mobile Only */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {APP_CONFIG.name}
            </h1>
          </div>

          {/* Form Container */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 lg:p-10">
            {renderForm()}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Animated Background Elements - Desktop */}
      <div className="hidden lg:block absolute top-20 right-20 w-72 h-72 bg-violet-200 dark:bg-violet-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob" />
      <div className="hidden lg:block absolute bottom-20 right-40 w-72 h-72 bg-purple-200 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
    </div>
  );
}
