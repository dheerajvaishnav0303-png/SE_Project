import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-4">
          <div className="h-4 bg-[#E5E4DF] animate-pulse w-1/3" />
          <div className="h-10 bg-[#E5E4DF] animate-pulse w-full" />
          <div className="h-4 bg-[#E5E4DF] animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function RequireAdmin({ children }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const privileged = ['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_CHECKER'];
  if (!privileged.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

