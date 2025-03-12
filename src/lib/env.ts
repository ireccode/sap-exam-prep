declare global {
  interface Window {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
      VITE_STRIPE_PUBLISHABLE_KEY: string;
      VITE_STRIPE_PREMIUM_PRICE_ID: string;
      VITE_BASIC_ENCRYPTION_KEY: string;
      VITE_PREMIUM_ENCRYPTION_KEY: string;
      VITE_WEBHOOK_SECRET: string;
      VITE_OPENROUTER_API_KEY: string;
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