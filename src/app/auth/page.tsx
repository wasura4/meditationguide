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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6">
        <Link
          href="/"
          className="inline-flex items-center text-[14px] text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px]">
          {/* Logo and Title */}
          <div className="text-center mb-8 fade-in">
            <Link href="/" className="inline-block">
              <div className="w-16 h-16 bg-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </Link>
            <h1 className="text-[28px] font-semibold text-[var(--foreground)] tracking-tight">
              {APP_CONFIG.name}
            </h1>
          </div>

          {/* Form Container */}
          <div className="card-elevated p-8 fade-in fade-in-delay-1">
            {renderForm()}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center fade-in fade-in-delay-2">
            <p className="text-[12px] text-[var(--muted-foreground)]">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-[var(--primary)] hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[var(--primary)] hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
