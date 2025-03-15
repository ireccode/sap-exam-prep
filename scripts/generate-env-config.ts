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
  BASIC_ENCRYPTION_KEY: env.BASIC_ENCRYPTION_KEY || process.env.BASIC_ENCRYPTION_KEY,
  PREMIUM_ENCRYPTION_KEY: env.PREMIUM_ENCRYPTION_KEY || process.env.PREMIUM_ENCRYPTION_KEY,
  OPENROUTER_API_KEY: env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY,
  WEBHOOK_SECRET: env.WEBHOOK_SECRET || process.env.WEBHOOK_SECRET
};

// Validate required variables
const missingVars = Object.entries(envConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

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