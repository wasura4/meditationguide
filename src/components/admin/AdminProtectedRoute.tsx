'use client';

import React, { ReactNode } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: {
    resource: string;
    action: string;
  };
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const { adminUser, loading, hasPermission } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !adminUser) {
      router.push('/admin/login');
    }
  }, [adminUser, loading, router]);

  useEffect(() => {
    if (adminUser && requiredPermission) {
      if (!hasPermission(requiredPermission.resource, requiredPermission.action)) {
        router.push('/admin/unauthorized');
      }
    }
  }, [adminUser, requiredPermission, hasPermission, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null; // Will redirect to login
  }

  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return null; // Will redirect to unauthorized
  }

  return <>{children}</>;
};
