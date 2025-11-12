'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast';
import { ERROR_MESSAGES } from '@/constants';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToAnonymous: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onSwitchToAnonymous
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const router = useRouter();
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      await login(data.email, data.password);
      
      showToast({
        type: 'success',
        title: 'Login Successful',
        message: 'Welcome back! Redirecting to dashboard...',
        duration: 3000
      });
      
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      // Handle specific Firebase auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as { code: string; message?: string };
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
          setError(ERROR_MESSAGES.auth.invalidCredentials);
        } else if (authError.code === 'auth/too-many-requests') {
          setError('Too many failed attempts. Please try again later.');
        } else if (authError.code === 'auth/network-request-failed') {
          setError(ERROR_MESSAGES.auth.networkError);
        } else {
          setError(authError.message || ERROR_MESSAGES.general.somethingWentWrong);
        }
      } else {
        setError(ERROR_MESSAGES.general.somethingWentWrong);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await loginWithGoogle();

      showToast({
        type: 'success',
        title: 'Google Login Successful',
        message: 'Welcome! Redirecting to dashboard...',
        duration: 3000
      });

      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (error: unknown) {
      console.error('Google login error:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as { code: string; message?: string };
        if (authError.code === 'auth/popup-closed-by-user') {
          setError('Login popup was closed. Please try again.');
        } else {
          setError(authError.message || 'Failed to login with Google');
        }
      } else {
        setError('Failed to login with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      showToast({
        type: 'error',
        title: 'Email Required',
        message: 'Please enter your email address.',
        duration: 3000
      });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await resetPassword(resetEmail);
      setResetEmailSent(true);

      showToast({
        type: 'success',
        title: 'Email Sent',
        message: 'Password reset link has been sent to your email.',
        duration: 5000
      });
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as { code: string; message?: string };
        if (authError.code === 'auth/user-not-found') {
          setError('No account found with this email address.');
        } else if (authError.code === 'auth/invalid-email') {
          setError('Please enter a valid email address.');
        } else {
          setError(authError.message || 'Failed to send reset email.');
        }
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show forgot password modal
  if (showForgotPassword) {
    return (
      <div className="w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Reset Password
          </h2>
          <p className="text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </div>

        {resetEmailSent ? (
          <div className="space-y-6">
            <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
              <svg className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">Email Sent!</h3>
              <p className="text-sm text-green-600 dark:text-green-300">
                We&apos;ve sent a password reset link to <strong>{resetEmail}</strong>. Please check your inbox and follow the instructions.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmailSent(false);
                setResetEmail('');
                setError('');
              }}
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="reset-email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-foreground placeholder:text-muted-foreground transition-all"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="button"
              className="w-full"
              onClick={handleResetPassword}
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setError('');
              }}
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Welcome Back
        </h2>
        <p className="text-muted-foreground">
          Sign in to continue your meditation journey
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
            Email Address
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-foreground placeholder:text-muted-foreground transition-all"
            placeholder="Enter your email"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors"
            >
              Forgot Password?
            </button>
          </div>
          <input
            {...register('password')}
            type="password"
            id="password"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-foreground placeholder:text-muted-foreground transition-all"
            placeholder="Enter your password"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        {/* TEMPORARILY HIDDEN - Google Login */}
        {/* Change {false && to {true && to re-enable Google login */}
        {false && (
          <>
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-gray-800 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </>
        )}

        {/* TEMPORARILY HIDDEN - Guest Login */}
        {/* Change {false && to {true && to re-enable guest login */}
        {false && (
          <>
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-gray-800 text-muted-foreground">Or try as guest</span>
              </div>
            </div>

            {/* Anonymous Login Button */}
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onSwitchToAnonymous}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Try as Guest
            </Button>
          </>
        )}
      </form>

      {/* Switch to Register */}
      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-sm">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors"
          >
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
};

