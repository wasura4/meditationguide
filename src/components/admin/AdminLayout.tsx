"use client";

import React, { useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useToast } from '@/components/ui/toast';

interface AdminLayoutProps {
  children: ReactNode;
  currentPage: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPage }) => {
  const { adminUser, logout } = useAdminAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { showToast } = useToast();
  
  // Get current page from router if not provided
  const currentPagePath = currentPage || '/admin/dashboard';

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '🏠', permission: 'analytics:read' },
    { name: 'Types', href: '/admin/types', icon: '🧘', permission: 'content:read' },
    { name: 'Audio', href: '/admin/audio', icon: '🎧', permission: 'audio:read' },
    { name: 'Dhamma', href: '/admin/dhamma', icon: '📚', permission: 'dhamma:read' },
    { name: 'Users', href: '/admin/users', icon: '👤', permission: 'users:read' },
    { name: 'Analytics', href: '/admin/analytics', icon: '📈', permission: 'analytics:read' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙', permission: 'settings:read' },
    { name: 'Theme', href: '/admin/theme', icon: '🎨', permission: 'settings:read' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      showToast({
        type: 'success',
        title: 'Logged Out',
        message: 'You have been successfully logged out.',
        duration: 3000
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
      showToast({
        type: 'error',
        title: 'Logout Failed',
        message: 'Failed to log out. Please try again.',
        duration: 5000
      });
    }
  };

  const canAccess = (permission: string) => {
    const [resource, action] = permission.split(':');
    return adminUser ? adminUser.permissions.some(p => 
      p.resource === resource && p.actions.includes(action as 'create' | 'read' | 'update' | 'delete')
    ) : false;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black/50"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-lg border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">N</span>
            </div>
            <h1 className="ml-3 text-xl font-bold">
              Nirvanaya Admin
            </h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:text-foreground"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              if (!canAccess(item.permission)) return null;
              
              const isActive = currentPagePath === item.href;
              
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </a>
              );
            })}
            {canAccess('audio:read') && (
              <a
                key="nav-playlists"
                href="/admin/playlists"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPagePath === '/admin/playlists'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <span className="mr-3 text-lg">🎼</span>
                Playlists
              </a>
            )}
          </div>
        </nav>

        {/* Admin Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {adminUser?.displayName?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">
                {adminUser?.displayName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {adminUser?.role?.replace('_', ' ')}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="hover:text-destructive"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 className="ml-2 lg:ml-0 text-lg font-semibold">
                {navigation.find(item => item.href === currentPage)?.name || 'Admin Panel'}
              </h2>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">
                Welcome back, {adminUser?.displayName}
              </span>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                size="sm"
              >
                View App
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
        <nav className="grid grid-cols-5">
          {navigation
            .filter((item) => canAccess(item.permission))
            .slice(0, 5)
            .map((item) => {
              const isActive = currentPagePath === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-2 text-xs ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="mt-0.5">{item.name}</span>
                </a>
              );
            })}
        </nav>
      </div>
    </div>
  );
};
