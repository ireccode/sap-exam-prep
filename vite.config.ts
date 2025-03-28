/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import type { Plugin } from 'vite';

// Enhanced plugin to copy public files to app directory
const copyPublicFiles = (): Plugin => ({
  name: 'copy-public-files',
  enforce: 'post',
  apply: 'build',
  async writeBundle() {
    const publicDir = path.resolve(__dirname, 'public');
    const distAppDir = path.resolve(__dirname, 'dist/app');
    
    if (fs.existsSync(publicDir)) {
      console.log('Copying public files to dist/app directory...');
      
      // Create the app directory in dist
      fs.mkdirSync(distAppDir, { recursive: true });
      
      // Copy all files recursively except index.html (we'll create it separately)
      const copyDir = (src: string, dest: string) => {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.name === '.DS_Store' || entry.name === 'index.html') continue;
          
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };
      
      copyDir(publicDir, distAppDir);
      console.log('Public files copied to dist/app successfully');
    }
  }
});

// Custom plugin to copy website directory
const copyWebsiteFiles = (): Plugin => ({
  name: 'copy-website-files',
  enforce: 'post',
  apply: 'build',
  async writeBundle() {
    const websiteDir = path.resolve(__dirname, 'website');
    const distDir = path.resolve(__dirname, 'dist');
    
    if (fs.existsSync(websiteDir)) {
      console.log('Copying website directory files to dist root...');
      
      // Copy all files recursively
      const copyDir = (src: string, dest: string) => {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };
      
      // Copy website content directly to dist root
      copyDir(websiteDir, distDir);
      
      // Ensure images directory exists
      const imagesDir = path.join(distDir, 'images');
      fs.mkdirSync(imagesDir, { recursive: true });
      
      // Copy images to both locations for flexibility
      const srcImagesDir = path.join(websiteDir, 'images');
      if (fs.existsSync(srcImagesDir)) {
        copyDir(srcImagesDir, imagesDir);
      }
      
      console.log('Website directory copied to dist root successfully');
    }
  }
});

// Copy encrypted files and other resources
const copyResourceFiles = (): Plugin => ({
  name: 'copy-resource-files',
  enforce: 'post',
  apply: 'build',
  async writeBundle() {
    const distDir = path.resolve(__dirname, 'dist');
    
    // List of files to copy to the root
    const filesToCopy = [
      'basic_btp_query_bank.encrypted',
      'premium_btp_query_bank.encrypted',
      'logo.png',
      'sap_architect_logo01.jpg',
      'server.js',
      '_static.json',
      '_redirects',
      '404.html'
    ];
    
    for (const file of filesToCopy) {
      const srcPath = path.resolve(__dirname, file);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(distDir, file));
        console.log(`Copied ${file} to dist root`);
      } else {
        console.log(`Warning: Could not find ${file} to copy`);
      }
    }
  }
});

// Copy the React index.html
const copyReactIndexHtml = (): Plugin => ({
  name: 'copy-react-index-html',
  enforce: 'post',
  apply: 'build',
  async writeBundle(options, bundle) {
    const distAppDir = path.resolve(__dirname, 'dist/app');
    fs.mkdirSync(distAppDir, { recursive: true });
    
    // Get the main JS and CSS filenames from the bundle
    let mainJsPath = '';
    let mainCssPath = '';
    
    for (const fileName in bundle) {
      if (fileName.startsWith('app/assets/main-') && fileName.endsWith('.js')) {
        mainJsPath = fileName;
      } else if (fileName.startsWith('app/assets/main-') && fileName.endsWith('.css')) {
        mainCssPath = fileName;
      }
    }
    
    // Create the React app index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SAP Architect Exam Prep</title>
    ${mainCssPath ? `<link rel="stylesheet" href="/${mainCssPath}">` : ''}
    ${mainJsPath ? `<script type="module" crossorigin src="/${mainJsPath}"></script>` : ''}
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
    
    // Write the file
    fs.writeFileSync(path.join(distAppDir, 'index.html'), indexHtml);
    console.log('React app index.html created with proper asset paths');
  }
});

// Get environment variables with fallbacks
const getEnvVar = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://cwscaerzmixftirytvwo.supabase.co');
const targetDomain = getEnvVar('VITE_TARGET_DOMAIN', 'examprep.techtreasuretrove.in');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyPublicFiles(),
    copyWebsiteFiles(),
    copyResourceFiles(),
    copyReactIndexHtml()
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/functions/v1': {
        target: supabaseUrl,
        changeOrigin: true,
        secure: true,
        headers: {
          'X-Title': 'SAP Architect Exam Prep',
          'HTTP-Referer': `https://${targetDomain}`,
        },
      }
    },
  },
  build: {
    assetsDir: 'app/assets',
    assetsInlineLimit: 0, // Don't inline any assets
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name || '';
          if (info.endsWith('.encrypted') || 
              info.endsWith('.template') ||
              info.endsWith('.jpg') ||
              info.endsWith('.png') ||
              info.endsWith('.json')) {
            return `[name][extname]`;
          }
          return 'app/assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'app/assets/[name]-[hash].js',
        entryFileNames: 'app/assets/[name]-[hash].js',
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    copyPublicDir: false, // We handle copying ourselves
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js', 'crypto-browserify', 'stream-browserify', 'buffer', 'util', 'process', 'react', 'react-dom', 'react-router-dom'],
    exclude: ['crypto'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      util: 'util',
      process: 'process/browser',
    }
  },
  publicDir: false, // Disable automatic copying, we do it ourselves
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    global: 'globalThis',
  },
  assetsInclude: ['**/*.encrypted'],
});