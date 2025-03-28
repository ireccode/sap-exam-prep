#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

console.log('Copying required resource files to dist directory...');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist!');
  process.exit(1);
}

// Ensure images directory exists
const imagesDir = path.join(distDir, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('Created images directory');
}

// Files to copy from public directory
const publicFiles = [
  'basic_btp_query_bank.encrypted',
  'premium_btp_query_bank.encrypted',
  'logo.png',
  'sap_architect_logo01.jpg',
  '_redirects'
];

// Copy files from public directory
const publicDir = path.resolve(rootDir, 'public');
if (fs.existsSync(publicDir)) {
  for (const file of publicFiles) {
    const srcPath = path.join(publicDir, file);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(distDir, file));
      console.log(`Copied ${file} from public directory`);
    } else {
      console.warn(`Warning: Could not find ${file} in public directory`);
    }
  }
}

// Copy website images to root images directory
const websiteImagesDir = path.resolve(rootDir, 'website/images');
if (fs.existsSync(websiteImagesDir)) {
  const imageFiles = fs.readdirSync(websiteImagesDir);
  
  for (const file of imageFiles) {
    const srcPath = path.join(websiteImagesDir, file);
    
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, path.join(imagesDir, file));
      console.log(`Copied ${file} to images directory`);
    }
  }
}

// If logo.png doesn't exist in root, copy it from images directory
if (!fs.existsSync(path.join(distDir, 'logo.png'))) {
  const imagePath = path.join(imagesDir, 'logo.png');
  if (fs.existsSync(imagePath)) {
    fs.copyFileSync(imagePath, path.join(distDir, 'logo.png'));
    console.log('Copied logo.png from images directory to root');
  }
}

// Check and ensure the critical files are present
console.log('\nChecking critical files...');
const criticalFiles = [
  'index.html',
  'app/index.html',
  'server.js',
  'logo.png'
];

let allFilesPresent = true;
for (const file of criticalFiles) {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} is present`);
  } else {
    console.error(`❌ ${file} is missing!`);
    allFilesPresent = false;
  }
}

if (allFilesPresent) {
  console.log('\n✅ All required files copied successfully!');
} else {
  console.error('\n❌ Some critical files are missing!');
  process.exit(1);
} 