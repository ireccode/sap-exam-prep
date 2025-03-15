/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Client-side variables (VITE_ prefixed)
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_STRIPE_PREMIUM_PRICE_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Server-side environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Server-side variables (no VITE_ prefix)
      BASIC_ENCRYPTION_KEY: string
      PREMIUM_ENCRYPTION_KEY: string
      OPENROUTER_API_KEY: string
      WEBHOOK_SECRET: string
      NODE_ENV: 'development' | 'production' | 'test'
    }
  }
}

export {}