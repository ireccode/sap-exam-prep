import React, { useEffect, useState } from 'react';
import { AIChat } from '@/components/chat/AIChat';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * AIChatPage - Dedicated page component for AI Chat with robust error handling
 * This component specifically addresses the route refresh issue with /ai-chat
 */
export function AIChatPage() {
  const { user, isPremium, loading } = useAuth();
  const location = useLocation();
  const [errorCount, setErrorCount] = useState(0);
  const [persistedAuth, setPersistedAuth] = useState(false);
  
  // Initialize on component mount
  useEffect(() => {
    console.log('AIChatPage mounted, pathname:', location.pathname);
    
    // Create a more persistent authentication for this route
    if (user) {
      // Store auth info in localStorage for persistence across refreshes
      localStorage.setItem('ai_chat_user_id', user.id);
      localStorage.setItem('ai_chat_premium', isPremium ? 'true' : 'false');
      localStorage.setItem('ai_chat_timestamp', Date.now().toString());
      console.log('AI Chat auth info stored in localStorage');
    }
    
    // Check if we're reloading and have saved auth
    const savedUserId = localStorage.getItem('ai_chat_user_id');
    const timestamp = parseInt(localStorage.getItem('ai_chat_timestamp') || '0');
    const isRecent = Date.now() - timestamp < 1000 * 60 * 10; // 10 minutes
    
    if (savedUserId && isRecent && !user) {
      console.log('Using persisted authentication for AI Chat');
      setPersistedAuth(true);
    }
    
    // Register error handler
    const errorHandler = () => {
      console.log('Error caught in AI Chat page, incrementing count');
      setErrorCount(c => c + 1);
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
      
      // Only clear storage when navigating away from this route
      if (location.pathname !== '/ai-chat') {
        localStorage.removeItem('ai_chat_user_id');
        localStorage.removeItem('ai_chat_premium');
        localStorage.removeItem('ai_chat_timestamp');
        console.log('AI Chat auth info cleared from localStorage');
      }
    };
  }, [user, isPremium, location.pathname]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-700 text-lg">Loading AI Chat...</p>
        </div>
      </div>
    );
  }
  
  // Use persisted authentication if we have it and we're refreshing
  if (!user && persistedAuth) {
    const savedPremium = localStorage.getItem('ai_chat_premium') === 'true';
    
    // If premium is required but we don't have it
    if (!savedPremium) {
      console.log('Premium required for AI Chat but not persisted');
      return <Navigate to="/subscription" state={{ from: location }} replace />;
    }
    
    // Show AI Chat with persisted auth
    return (
      <div className="ai-chat-persisted">
        <AIChat />
        <div className="fixed top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
          Using cached session
        </div>
      </div>
    );
  }
  
  // Normal authentication checks
  if (!user) {
    console.log('No user for AI Chat, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!isPremium) {
    console.log('User not premium for AI Chat, redirecting to subscription');
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }
  
  // Too many errors? Show a helpful message
  if (errorCount > 3) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Having trouble loading AI Chat</h2>
          <p className="text-gray-700 mb-4">
            We're experiencing some technical difficulties. Please try:
          </p>
          <ul className="list-disc pl-5 mb-4 text-gray-700">
            <li>Refreshing the page</li>
            <li>Logging out and back in</li>
            <li>Clearing your browser cache</li>
          </ul>
          <div className="flex space-x-4">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
            <button 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
            >
              Logout & Login Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Everything is good, show the AI Chat component
  return <AIChat />;
} 