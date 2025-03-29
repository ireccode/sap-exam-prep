import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AiChatRouteProps {
  children: React.ReactNode;
}

/**
 * Special wrapper for AI Chat to prevent refresh issues
 * This component is specifically designed to handle the problematic
 * /ai-chat route which has issues with session persistence during refresh
 */
export const AiChatRoute: React.FC<AiChatRouteProps> = ({ children }) => {
  const { user, loading, isPremium } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    // Persist authentication status for this route
    if (user) {
      console.log('AiChatRoute: Setting persistent authentication');
      localStorage.setItem('ai_chat_auth', 'true');
      localStorage.setItem('ai_chat_premium', isPremium ? 'true' : 'false');
      localStorage.setItem('ai_chat_last_auth', Date.now().toString());
    }
    
    return () => {
      // Clean up when navigating away
      if (location.pathname !== '/ai-chat') {
        console.log('AiChatRoute: Cleaning up persistent auth');
        localStorage.removeItem('ai_chat_auth');
        localStorage.removeItem('ai_chat_premium');
        localStorage.removeItem('ai_chat_last_auth');
      }
    };
  }, [user, isPremium, location.pathname]);
  
  // Check for cached authentication
  const cachedAuth = localStorage.getItem('ai_chat_auth') === 'true';
  const cachedPremium = localStorage.getItem('ai_chat_premium') === 'true';
  const lastAuth = parseInt(localStorage.getItem('ai_chat_last_auth') || '0');
  const authIsRecent = Date.now() - lastAuth < 1000 * 60 * 30; // 30 minutes
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading AI Chat...</p>
        </div>
      </div>
    );
  }
  
  // Use cached auth if we're in the window and refreshing the page
  if (!user && cachedAuth && authIsRecent) {
    console.log('AiChatRoute: Using cached authentication');
    
    // Check if premium is required and we don't have it
    if (!cachedPremium) {
      console.log('AiChatRoute: Premium required but not cached');
      return <Navigate to="/subscription" state={{ from: location }} replace />;
    }
    
    return <>{children}</>;
  }
  
  // Normal authentication check
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check subscription
  if (!isPremium) {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}; 