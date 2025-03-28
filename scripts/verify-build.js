#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

console.log('\n🔍 Verifying build structure...');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ Error: dist directory does not exist!');
  process.exit(1);
}

// Critical files that must exist
const criticalFiles = [
  'index.html',                    // Landing page
  'app/index.html',                // React app
  'server.js',                     // Express server
  'logo.png',                      // Favicon
  'images'                         // Images directory
];

// Optional files
const optionalFiles = [
  'basic_btp_query_bank.encrypted',
  'premium_btp_query_bank.encrypted',
  'sap_architect_logo01.jpg',
  '_redirects',
  '404.html'
];

// Check critical files
let hasErrors = false;
for (const file of criticalFiles) {
  const filePath = path.join(distDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Critical file missing: ${file}`);
    hasErrors = true;
  } else {
    console.log(`✅ Found critical file: ${file}`);
  }
}

// Check optional files
for (const file of optionalFiles) {
  const filePath = path.join(distDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Optional file missing: ${file}`);
  } else {
    console.log(`✅ Found optional file: ${file}`);
  }
}

// Verify React app assets
const assetsDir = path.join(distDir, 'app', 'assets');
if (!fs.existsSync(assetsDir)) {
  console.error('❌ app/assets directory missing!');
  hasErrors = true;
} else {
  const files = fs.readdirSync(assetsDir);
  const hasJs = files.some(file => file.match(/main-.*\.js$/));
  const hasCss = files.some(file => file.match(/main-.*\.css$/));
  
  if (!hasJs) {
    console.error('❌ No main JavaScript file found in app/assets');
    hasErrors = true;
  } else {
    console.log('✅ Found JavaScript assets');
  }
  
  if (!hasCss) {
    console.error('❌ No main CSS file found in app/assets');
    hasErrors = true;
  } else {
    console.log('✅ Found CSS assets');
  }
}

// Verify landing page assets
console.log('\n🔍 Verifying landing page assets...');
const cssDir = path.join(distDir, 'css');
const jsDir = path.join(distDir, 'js');

if (!fs.existsSync(cssDir)) {
  console.warn('⚠️ css directory missing for landing page');
} else {
  console.log('✅ Found css directory for landing page');
}

if (!fs.existsSync(jsDir)) {
  console.warn('⚠️ js directory missing for landing page');
} else {
  console.log('✅ Found js directory for landing page');
}

// Check images directory
const imagesDir = path.join(distDir, 'images');
if (fs.existsSync(imagesDir)) {
  const imageFiles = fs.readdirSync(imagesDir);
  if (imageFiles.length === 0) {
    console.warn('⚠️ images directory is empty');
  } else {
    console.log(`✅ Found ${imageFiles.length} images in images directory`);
  }
}

// Verify asset references in app/index.html
console.log('\n🔍 Verifying asset references in app/index.html...');
const appIndexPath = path.join(distDir, 'app', 'index.html');
if (fs.existsSync(appIndexPath)) {
  const appHtml = fs.readFileSync(appIndexPath, 'utf8');
  const hasJsRef = appHtml.includes('src="/app/assets/main-');
  const hasCssRef = appHtml.includes('href="/app/assets/main-');
  
  if (!hasJsRef) {
    console.error('❌ React app does not reference JavaScript assets correctly');
    hasErrors = true;
  } else {
    console.log('✅ React app references JavaScript assets correctly');
  }
  
  if (!hasCssRef) {
    console.error('❌ React app does not reference CSS assets correctly');
    hasErrors = true;
  } else {
    console.log('✅ React app references CSS assets correctly');
  }
}

// Verify image references in index.html (landing page)
console.log('\n🔍 Verifying image references in landing page...');
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  
  // Check for website/images paths (should be changed to /images/)
  const hasIncorrectPaths = indexHtml.includes('/website/images/');
  
  if (hasIncorrectPaths) {
    console.error('❌ Landing page has incorrect image paths (/website/images/)');
    hasErrors = true;
  } else {
    console.log('✅ Landing page uses correct image paths (/images/)');
  }
}

if (hasErrors) {
  console.error('\n❌ Build verification failed! Please fix the above errors.');
  process.exit(1);
} else {
  console.log('\n✅ Build verification passed!');
} 