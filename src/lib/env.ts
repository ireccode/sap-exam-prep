import { EnvironmentError } from '@/services/aiService';

declare global {
  interface Window {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
      VITE_STRIPE_PUBLISHABLE_KEY: string;
      VITE_STRIPE_PREMIUM_PRICE_ID: string;
      // Removed sensitive keys
    };
  }
}

// Simple validation of required environment variables
export function validateRequiredEnvVars(): boolean {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_STRIPE_PREMIUM_PRICE_ID'
  ] as const;
  
  for (const key of requiredVars) {
    const value = import.meta.env[key];
    if (!value) {
      console.error(`Required environment variable ${key} is not defined`);
      return false;
    }
  }
  
  return true;
}

// Helper to get environment variables in both dev and prod
function getEnvVar(key: string): string {
  // Only allow access to VITE_ prefixed variables
  if (key.startsWith('VITE_')) {
    // For client-side VITE_ variables in development
    if (import.meta.env[key]) {
      return import.meta.env[key];
    }
    
    // For client-side variables in production
    if (window.env && window.env[key]) {
      return window.env[key];
    }
  }
  
  throw new EnvironmentError(`Environment variable ${key} is not accessible`);
}

// Environment variable getters with type safety
export function getClientEnvVar(key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY' | 'VITE_STRIPE_PUBLISHABLE_KEY' | 'VITE_STRIPE_PREMIUM_PRICE_ID'): string {
  return getEnvVar(key);
}

// For backward compatibility
export function getServerEnvVar(key: string): string {
  console.warn('getServerEnvVar is deprecated. Server environment variables should be accessed via Edge Functions.');
  return getEnvVar(key);
} 