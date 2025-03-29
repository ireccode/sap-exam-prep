import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from '@/components/profile/Profile';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

export function ProtectedRoute({ children, requireSubscription = false }: ProtectedRouteProps) {
  const { user, isPremium, loading } = useAuth();
  const location = useLocation();
  
  // Special handling for known problematic routes like /ai-chat
  useEffect(() => {
    // Check if we're on AI chat route
    if (location.pathname === '/ai-chat') {
      console.log('ProtectedRoute component detected AI chat route');
      
      // Store that we're authenticated for this route to prevent redirect loops
      if (user) {
        console.log('User is authenticated for AI chat route');
        sessionStorage.setItem('ai_chat_authenticated', 'true');
      }
    }
  }, [location.pathname, user]);
  
  // Check for the special case where we're returning to AI chat after a refresh
  const isAiChatAuthenticated = sessionStorage.getItem('ai_chat_authenticated') === 'true';
  const isAiChatRoute = location.pathname === '/ai-chat';
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Special case for /ai-chat route
  if (!user && isAiChatRoute && isAiChatAuthenticated) {
    console.log('Using cached authentication for AI chat route');
    // Clear the flag after use
    sessionStorage.removeItem('ai_chat_authenticated');
    return <>{children}</>;
  }

  if (!user) {
    // Remove the cached auth when navigating away
    if (isAiChatAuthenticated) {
      sessionStorage.removeItem('ai_chat_authenticated');
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSubscription && !isPremium) {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return <>{children}</>;
} 