import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env files
const env = {
  ...dotenv.config().parsed, // Load from .env
  ...dotenv.config({ path: '.env.production' }).parsed // Override with .env.production
};

// Create env-config.js content
const envConfig = {
  // Only include client-side variables
  VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
  VITE_STRIPE_PUBLISHABLE_KEY: env.VITE_STRIPE_PUBLISHABLE_KEY,
  VITE_STRIPE_PREMIUM_PRICE_ID: env.VITE_STRIPE_PREMIUM_PRICE_ID
};

// Create the output
const output = `window.env = ${JSON.stringify(envConfig, null, 2)};`;

// Write to public directory
fs.writeFileSync(path.join(process.cwd(), 'public', 'env-config.js'), output);
console.log('Generated env-config.js with values:', {
  VITE_SUPABASE_URL: envConfig.VITE_SUPABASE_URL ? '✓' : '✗',
  VITE_SUPABASE_ANON_KEY: envConfig.VITE_SUPABASE_ANON_KEY ? '✓' : '✗',
  VITE_STRIPE_PUBLISHABLE_KEY: envConfig.VITE_STRIPE_PUBLISHABLE_KEY ? '✓' : '✗',
  VITE_STRIPE_PREMIUM_PRICE_ID: envConfig.VITE_STRIPE_PREMIUM_PRICE_ID ? '✓' : '✗'
}); 