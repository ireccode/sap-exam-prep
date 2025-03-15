declare global {
  interface Window {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
      VITE_STRIPE_PUBLISHABLE_KEY: string;
      VITE_STRIPE_PREMIUM_PRICE_ID: string;
      BASIC_ENCRYPTION_KEY: string;
      PREMIUM_ENCRYPTION_KEY: string;
      WEBHOOK_SECRET: string;
      OPENROUTER_API_KEY: string;
    };
  }
}

// Simple validation of required environment variables
export function validateRequiredEnvVars(): boolean {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
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

// Environment variable validation utility
import { EnvironmentError } from '@/services/aiService';

// Helper to get environment variables in both dev and prod
function getEnvVar(key: string): string {
  // For client-side VITE_ variables
  if (key.startsWith('VITE_')) {
    return import.meta.env[key];
  }
  
  // For server-side variables in development
  if (process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // For server-side variables in production
  if (window.env && window.env[key]) {
    return window.env[key];
  }
  
  throw new EnvironmentError(`Environment variable ${key} is not set`);
}

export function validateServerEnv() {
  const requiredServerVars = [
    'BASIC_ENCRYPTION_KEY',
    'PREMIUM_ENCRYPTION_KEY',
    'OPENROUTER_API_KEY',
    'WEBHOOK_SECRET'
  ] as const;

  const missingVars = requiredServerVars.filter(key => {
    try {
      return !getEnvVar(key);
    } catch {
      return true;
    }
  });
  
  if (missingVars.length > 0) {
    throw new EnvironmentError(`Missing required server environment variables: ${missingVars.join(', ')}`);
  }

  // Validate encryption key lengths
  const basicKey = getEnvVar('BASIC_ENCRYPTION_KEY');
  if (basicKey.length < 16) {
    throw new EnvironmentError('BASIC_ENCRYPTION_KEY must be at least 16 characters long');
  }

  const premiumKey = getEnvVar('PREMIUM_ENCRYPTION_KEY');
  if (premiumKey.length < 16) {
    throw new EnvironmentError('PREMIUM_ENCRYPTION_KEY must be at least 16 characters long');
  }

  // Validate OpenRouter API key format
  const openRouterKey = getEnvVar('OPENROUTER_API_KEY');
  if (!openRouterKey.startsWith('sk-or-')) {
    throw new EnvironmentError('OPENROUTER_API_KEY must start with sk-or-');
  }
}

// Environment variable getters with type safety
export function getServerEnvVar(key: 'BASIC_ENCRYPTION_KEY' | 'PREMIUM_ENCRYPTION_KEY' | 'OPENROUTER_API_KEY' | 'WEBHOOK_SECRET'): string {
  return getEnvVar(key);
} 