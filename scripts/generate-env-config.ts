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
  // Only include server-side variables
  BASIC_ENCRYPTION_KEY: env.BASIC_ENCRYPTION_KEY,
  PREMIUM_ENCRYPTION_KEY: env.PREMIUM_ENCRYPTION_KEY,
  OPENROUTER_API_KEY: env.OPENROUTER_API_KEY,
  WEBHOOK_SECRET: env.WEBHOOK_SECRET
};

// Create the output
const output = `window.env = ${JSON.stringify(envConfig, null, 2)};`;

// Write to public directory
fs.writeFileSync(path.join(process.cwd(), 'public', 'env-config.js'), output);
console.log('Generated env-config.js with values:', {
  BASIC_ENCRYPTION_KEY: envConfig.BASIC_ENCRYPTION_KEY ? '✓' : '✗',
  PREMIUM_ENCRYPTION_KEY: envConfig.PREMIUM_ENCRYPTION_KEY ? '✓' : '✗',
  OPENROUTER_API_KEY: envConfig.OPENROUTER_API_KEY ? '✓' : '✗',
  WEBHOOK_SECRET: envConfig.WEBHOOK_SECRET ? '✓' : '✗'
}); 