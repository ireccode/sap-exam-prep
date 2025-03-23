import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env files
const envFiles = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development'
];

let envVars = {};
for (const file of envFiles) {
  const envPath = path.join(__dirname, '..', file);
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment variables from ${file}`);
    const fileEnv = dotenv.parse(fs.readFileSync(envPath));
    envVars = { ...envVars, ...fileEnv };
  }
}

// Required files to check in dist root
const requiredFiles = [
  'index.html',
  'logo.png',
  'basic_btp_query_bank.encrypted',
  'premium_btp_query_bank.encrypted',
  'server.js'
];

// Required file patterns in assets directory
const requiredAssetPatterns = [
  { pattern: /^main-.*\.js$/, description: 'Main JavaScript bundle' },
  { pattern: /.*\.css$/, description: 'CSS bundle' },
  { pattern: /^polyfills-.*\.js$/, description: 'Polyfills bundle', optional: true }
];

// Required environment variables
const requiredEnvVars = [
  // Client-side variables (VITE_ prefix)
  { name: 'VITE_SUPABASE_URL', description: 'Supabase URL', pattern: /^https:\/\/.*\.supabase\.co$/ },
  { name: 'VITE_SUPABASE_ANON_KEY', description: 'Supabase Anonymous Key', pattern: /^eyJ/ },
  { name: 'VITE_STRIPE_PUBLISHABLE_KEY', description: 'Stripe Publishable Key', pattern: /^pk_/, optional: true },
  { name: 'VITE_STRIPE_PREMIUM_PRICE_ID', description: 'Stripe Premium Price ID', pattern: /^price_/, optional: true },
  
  // Server-side variables
  { name: 'BASIC_ENCRYPTION_KEY', description: 'Basic Encryption Key', minLength: 16 },
  { name: 'PREMIUM_ENCRYPTION_KEY', description: 'Premium Encryption Key', minLength: 16 },
  { name: 'OPENROUTER_API_KEY', description: 'OpenRouter API Key', pattern: /^sk-or-/, optional: true },
  { name: 'WEBHOOK_SECRET', description: 'Webhook Secret', pattern: /^whsec_/, optional: true },
  
  // Build information
  { name: 'GIT_COMMIT_HASH', description: 'Git Commit Hash', optional: true }
];

// Check if dist directory exists
if (!fs.existsSync(path.join(__dirname, '../dist'))) {
  console.error('❌ dist directory not found. First Run: npm run build');
  process.exit(1);
}

// Check for required files in dist
console.log('\n📂 Checking required files in dist directory:');
let allFilesFound = true;
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '../dist', file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Required file not found in build: ${file}`);
    allFilesFound = false;
  } else {
    const stats = fs.statSync(filePath);
    const fileSizeKB = Math.round(stats.size / 1024);
    console.log(`✅ Found required file: ${file} (${fileSizeKB} KB)`);
  }
}

// Check for assets directory
const assetsDir = path.join(__dirname, '../dist/assets');
if (!fs.existsSync(assetsDir)) {
  console.error('❌ assets directory not found in build');
  allFilesFound = false;
} else {
  console.log('\n📂 Checking assets directory:');
  const assetFiles = fs.readdirSync(assetsDir);
  console.log(`Found ${assetFiles.length} files in assets directory`);
  
  // Check for required asset patterns
  for (const { pattern, description, optional } of requiredAssetPatterns) {
    const matchingFiles = assetFiles.filter(file => pattern.test(file));
    if (matchingFiles.length === 0 && !optional) {
      console.error(`❌ Required asset not found: ${description} (pattern: ${pattern})`);
      allFilesFound = false;
    } else if (matchingFiles.length === 0 && optional) {
      console.warn(`⚠️ Optional asset not found: ${description} (pattern: ${pattern})`);
    } else {
      for (const file of matchingFiles) {
        const stats = fs.statSync(path.join(assetsDir, file));
        const fileSizeKB = Math.round(stats.size / 1024);
        console.log(`✅ Found ${description}: ${file} (${fileSizeKB} KB)`);
      }
    }
  }
}

// Check for encrypted files in public directory
console.log('\n📂 Checking encrypted files in public directory:');
const publicDir = path.join(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  const encryptedFiles = fs.readdirSync(publicDir).filter(file => file.endsWith('.encrypted'));
  console.log(`Found ${encryptedFiles.length} encrypted files in public directory:`);
  encryptedFiles.forEach(file => {
    const stats = fs.statSync(path.join(publicDir, file));
    const fileSizeKB = Math.round(stats.size / 1024);
    console.log(`  - ${file} (${fileSizeKB} KB)`);
  });
} else {
  console.warn('⚠️ public directory not found');
}

// Check if encrypted files were copied to dist
console.log('\n📂 Checking if encrypted files were copied to dist:');
const encryptedInDist = fs.readdirSync(path.join(__dirname, '../dist')).filter(file => file.endsWith('.encrypted'));
if (encryptedInDist.length === 0) {
  console.warn('⚠️ No encrypted files found in dist root. Check copy-files script.');
} else {
  console.log(`Found ${encryptedInDist.length} encrypted files in dist root:`);
  encryptedInDist.forEach(file => {
    const stats = fs.statSync(path.join(__dirname, '../dist', file));
    const fileSizeKB = Math.round(stats.size / 1024);
    console.log(`  - ${file} (${fileSizeKB} KB)`);
  });
}

// Check for other important files
console.log('\n📂 Checking for other important files:');
const otherImportantFiles = [
  { path: '_redirects', description: 'Netlify redirects configuration', optional: true },
  { path: '.htaccess', description: 'Apache configuration', optional: true }
];

for (const { path: filePath, description, optional } of otherImportantFiles) {
  const fullPath = path.join(__dirname, '../dist', filePath);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    const fileSizeKB = Math.round(stats.size / 1024);
    console.log(`✅ Found ${description}: ${filePath} (${fileSizeKB} KB)`);
  } else if (!optional) {
    console.error(`❌ Required file not found: ${filePath} (${description})`);
    allFilesFound = false;
  } else {
    console.warn(`⚠️ Optional file not found: ${filePath} (${description})`);
  }
}

// Check server.js in dist
console.log('\n📂 Checking server.js in dist:');
const serverJsPath = path.join(__dirname, '../dist/server.js');
if (fs.existsSync(serverJsPath)) {
  const stats = fs.statSync(serverJsPath);
  const fileSizeKB = Math.round(stats.size / 1024);
  console.log(`✅ Found server.js (${fileSizeKB} KB)`);
  
  // Check if server.js contains expected content
  const serverContent = fs.readFileSync(serverJsPath, 'utf8');
  if (serverContent.includes('express') && serverContent.includes('app.listen')) {
    console.log('✅ server.js contains expected Express server code');
  } else {
    console.warn('⚠️ server.js may not contain expected Express server code');
  }
} else {
  console.error('❌ server.js not found in dist directory');
  allFilesFound = false;
}

// Check package.json for dependencies
console.log('\n📦 Checking package.json for required dependencies:');
const packageJsonPath = path.join(__dirname, '../package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['express', 'compression', 'helmet'];
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ Found dependency: ${dep} (${packageJson.dependencies[dep]})`);
    } else {
      console.error(`❌ Missing required dependency: ${dep}`);
      allFilesFound = false;
    }
  }
  
  // Check if copy-files script is in package.json
  console.log('\n📦 Checking build scripts:');
  if (packageJson.scripts && packageJson.scripts['copy-files']) {
    console.log(`✅ Found copy-files script: "${packageJson.scripts['copy-files']}"`);
    
    // Check if copy-files is included in the build script
    if (packageJson.scripts.build && packageJson.scripts.build.includes('copy-files')) {
      console.log(`✅ build script includes copy-files: "${packageJson.scripts.build}"`);
    } else {
      console.warn(`⚠️ build script may not include copy-files: "${packageJson.scripts.build}"`);
    }
  } else {
    console.error('❌ copy-files script not found in package.json');
    allFilesFound = false;
  }
} else {
  console.error('❌ package.json not found');
  allFilesFound = false;
}

// Check environment variables
console.log('\n🔐 Checking environment variables:');
let allEnvVarsFound = true;

for (const { name, description, pattern, minLength, optional } of requiredEnvVars) {
  const value = envVars[name];
  
  if (!value && !optional) {
    console.error(`❌ Required environment variable not found: ${name} (${description})`);
    allEnvVarsFound = false;
    continue;
  } else if (!value && optional) {
    console.warn(`⚠️ Optional environment variable not found: ${name} (${description})`);
    continue;
  }
  
  // Check pattern if provided
  if (pattern && !pattern.test(value)) {
    console.error(`❌ Environment variable ${name} does not match expected pattern: ${pattern}`);
    allEnvVarsFound = false;
    continue;
  }
  
  // Check minimum length if provided
  if (minLength && value.length < minLength) {
    console.error(`❌ Environment variable ${name} is too short (min length: ${minLength})`);
    allEnvVarsFound = false;
    continue;
  }
  
  // Mask sensitive values in logs
  const maskedValue = value.substring(0, 4) + '...' + value.substring(value.length - 4);
  console.log(`✅ Found environment variable: ${name} (${maskedValue})`);
}

// Check if client-side environment variables are copied to dist
console.log('\n🔐 Checking client-side environment variables in build:');
const mainJsFiles = fs.readdirSync(path.join(__dirname, '../dist/assets')).filter(file => /^main-.*\.js$/.test(file));
if (mainJsFiles.length > 0) {
  const mainJsContent = fs.readFileSync(path.join(__dirname, '../dist/assets', mainJsFiles[0]), 'utf8');
  
  // Check for client-side environment variables in the main JS file
  const clientEnvVars = requiredEnvVars.filter(v => v.name.startsWith('VITE_'));
  for (const { name } of clientEnvVars) {
    if (mainJsContent.includes(name)) {
      console.log(`✅ Client-side environment variable found in build: ${name}`);
    } else {
      console.warn(`⚠️ Client-side environment variable may not be included in build: ${name}`);
    }
  }
} else {
  console.warn('⚠️ No main JS file found to check for client-side environment variables');
}

// Final result
console.log('\n📋 Verification Summary:');
if (!allFilesFound || !allEnvVarsFound) {
  console.error('❌ Build verification failed. Some required files or environment variables are missing.');
  process.exit(1);
} else {
  console.log('✅ Build verification successful. All required files and environment variables are present.');
  console.log('🚀 The application is ready for deployment!');
} 