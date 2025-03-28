#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

console.log('Preparing production build...');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist!');
  process.exit(1);
}

// Ensure required directories exist
const requiredDirs = ['app', 'app/assets', 'images'];
for (const dir of requiredDirs) {
  const dirPath = path.join(distDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created ${dir} directory`);
  }
}

// Copy routing config files
const routingFiles = {
  '_redirects': '_redirects',
  'app/.htaccess': 'app/.htaccess'
};

console.log('Copying routing configuration files...');
for (const [destPath, srcPath] of Object.entries(routingFiles)) {
  const srcFilePath = path.join(rootDir, 'public', srcPath);
  if (fs.existsSync(srcFilePath)) {
    const destFilePath = path.join(distDir, destPath);
    // Ensure parent directory exists
    const destDir = path.dirname(destFilePath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(srcFilePath, destFilePath);
    console.log(`Copied ${srcPath} to ${destPath}`);
  } else {
    console.warn(`Warning: Could not find ${srcPath} to copy`);
  }
}

// 1. Copy critical files from public directory
const publicFiles = [
  'basic_btp_query_bank.encrypted',
  'premium_btp_query_bank.encrypted',
  'logo.png',
  'sap_architect_logo01.jpg',
  'server.js'
];

console.log('Copying files from public directory...');
const publicDir = path.resolve(rootDir, 'public');
if (fs.existsSync(publicDir)) {
  for (const file of publicFiles) {
    const srcPath = path.join(publicDir, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(distDir, file));
      console.log(`Copied ${file} from public directory`);
    }
  }
}

// 2. Copy images from website directory to images directory
console.log('Copying images from website directory...');
const websiteImagesDir = path.resolve(rootDir, 'website/images');
if (fs.existsSync(websiteImagesDir)) {
  const imageFiles = fs.readdirSync(websiteImagesDir);
  
  for (const file of imageFiles) {
    const srcPath = path.join(websiteImagesDir, file);
    
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, path.join(distDir, 'images', file));
      console.log(`Copied ${file} to images directory`);
    }
  }
}

// 3. Create app/index.html from public/index.html with proper assets
console.log('Creating app/index.html with correct asset paths...');
const distAppDir = path.resolve(distDir, 'app');

// Find asset files
const assetsDir = path.resolve(distDir, 'app/assets');
if (!fs.existsSync(assetsDir)) {
  console.error('Error: app/assets directory does not exist!');
  process.exit(1);
}

// Get the main asset filenames
const assetFiles = fs.readdirSync(assetsDir);
const jsFiles = assetFiles.filter(file => file.match(/main-.*\.js$/));
const cssFiles = assetFiles.filter(file => file.match(/main-.*\.css$/));

if (jsFiles.length === 0) {
  console.error('Error: No main JavaScript file found in app/assets!');
  process.exit(1);
}

if (cssFiles.length === 0) {
  console.error('Error: No main CSS file found in app/assets!');
  process.exit(1);
}

const mainJsFile = jsFiles[0];
const mainCssFile = cssFiles[0];

// Use public/index.html as template if it exists, otherwise create from scratch
const publicIndexPath = path.join(publicDir, 'index.html');
const appIndexHtml = fs.existsSync(publicIndexPath) 
  ? fs.readFileSync(publicIndexPath, 'utf8')
  : `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SAP Architect Exam Prep</title>
    <base href="/app/" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

// Insert asset links - make sure they're absolute paths
const processedHtml = appIndexHtml
  // Add base tag if it doesn't exist
  .replace('<head>', '<head>\n    <base href="/app/" />')
  // Remove any existing base tag to avoid duplicates
  .replace(/<base href="\/app\/" \/>\n    <base href="\/app\/" \/>/, '<base href="/app/" />')
  // Add assets with absolute paths
  .replace('</head>', `  <link rel="stylesheet" href="/app/assets/${mainCssFile}">\n  <script type="module" crossorigin src="/app/assets/${mainJsFile}"></script>\n</head>`)
  // Remove any reference to /src/main.tsx which is development only
  .replace(/<script type="module" src="\/src\/main\.tsx"><\/script>/g, '');

// Save the final HTML
fs.writeFileSync(path.join(distAppDir, 'index.html'), processedHtml);
console.log(`App index.html created with assets:
- JS: /app/assets/${mainJsFile}
- CSS: /app/assets/${mainCssFile}`);

// 4. Copy landing page website files
console.log('Copying landing page files...');
const websiteDir = path.resolve(rootDir, 'website');
if (fs.existsSync(websiteDir)) {
  // Copy website HTML to dist root
  const websiteIndexPath = path.join(websiteDir, 'index.html');
  if (fs.existsSync(websiteIndexPath)) {
    const landingHtml = fs.readFileSync(websiteIndexPath, 'utf8')
      // Update image paths to use /images/ instead of /website/images/
      .replace(/\/website\/images\//g, '/images/');
    
    fs.writeFileSync(path.join(distDir, 'index.html'), landingHtml);
    console.log('Copied and updated landing page index.html');
  }
  
  // Copy CSS and JS directories
  const dirsToProcess = ['css', 'js'];
  dirsToProcess.forEach(dir => {
    const srcDir = path.join(websiteDir, dir);
    const destDir = path.join(distDir, dir);
    
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      const files = fs.readdirSync(srcDir);
      files.forEach(file => {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        
        if (fs.statSync(srcPath).isFile()) {
          fs.copyFileSync(srcPath, destPath);
          console.log(`Copied ${dir}/${file}`);
        }
      });
    }
  });
}

// 5. Copy server.js to root if not already copied
const serverJsSrc = path.join(rootDir, 'server.js');
const serverJsDest = path.join(distDir, 'server.js');
if (fs.existsSync(serverJsSrc) && !fs.existsSync(serverJsDest)) {
  fs.copyFileSync(serverJsSrc, serverJsDest);
  console.log('Copied server.js to dist root');
}

// 6. Check if 404.html exists, create if needed
const fileNotFoundPath = path.join(distDir, '404.html');
if (!fs.existsSync(fileNotFoundPath)) {
  const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - SAP Architect Exam Prep</title>
    <style>
      body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; }
      h1 { color: #2c3e50; }
      a { color: #3CFF8F; text-decoration: none; margin: 0 10px; }
    </style>
  </head>
  <body>
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <div>
      <a href="/">Go to Home</a>
      <a href="/app">Go to App</a>
    </div>
  </body>
</html>`;
  
  fs.writeFileSync(fileNotFoundPath, notFoundHtml);
  console.log('Created 404.html page');
}

console.log('✅ Production build resources copied successfully!'); 