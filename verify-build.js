#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verify the build structure
console.log('Verifying build structure...');

const distDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist!');
  process.exit(1);
}

// Check for required directories
const requiredDirs = ['app', 'app/assets', 'images', 'css', 'js'];
for (const dir of requiredDirs) {
  const dirPath = path.join(distDir, dir);
  if (!fs.existsSync(dirPath)) {
    console.error(`Error: Required directory ${dir} does not exist in dist!`);
    process.exit(1);
  }
}

// Check for critical files
const criticalFiles = [
  'index.html',
  'app/index.html',
  'server.js',
  'logo.png'
];

const optionalFiles = [
  'sap_architect_logo01.jpg',
  'basic_btp_query_bank.encrypted',
  'premium_btp_query_bank.encrypted'
];

let allCriticalFilesFound = true;
for (const file of criticalFiles) {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ Found critical file: ${file}`);
  } else {
    console.error(`❌ Error: Critical file ${file} does not exist in dist!`);
    allCriticalFilesFound = false;
  }
}

// Fail if any critical files are missing
if (!allCriticalFilesFound) {
  process.exit(1);
}

// Check optional files
for (const file of optionalFiles) {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ Found optional file: ${file}`);
  } else {
    console.warn(`⚠️ Warning: Optional file ${file} not found, but continuing...`);
  }
}

// Check app/index.html for proper asset references
const appIndexPath = path.join(distDir, 'app/index.html');
const appIndexContent = fs.readFileSync(appIndexPath, 'utf8');

// Check for asset references
const jsPattern = /<script[^>]*src="\/app\/assets\/.*\.js"[^>]*>/;
const cssPattern = /<link[^>]*href="\/app\/assets\/.*\.css"[^>]*>/;

if (!jsPattern.test(appIndexContent)) {
  console.error('Error: app/index.html does not reference JavaScript assets properly!');
  console.log('Content:', appIndexContent);
  process.exit(1);
}

if (!cssPattern.test(appIndexContent)) {
  console.error('Error: app/index.html does not reference CSS assets properly!');
  console.log('Content:', appIndexContent);
  process.exit(1);
}

// All checks passed
console.log('✅ Build structure verification completed successfully!');
console.log('The following structure is verified:');
console.log(`
dist/
├── index.html               # Landing page
├── css/                     # Landing page styles
├── js/                      # Landing page scripts
├── images/                  # Shared images
├── app/                     # React app
│   ├── index.html           # SPA entry point with correct asset references
│   ├── assets/              # SPA assets with JS and CSS
├── sap_architect_logo01.jpg # Logo for app
├── logo.png                 # Favicon image
├── basic_btp_query_bank.encrypted
├── premium_btp_query_bank.encrypted
└── server.js                # Express server
`); 