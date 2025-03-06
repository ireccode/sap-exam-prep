/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import type { Plugin } from 'vite';

// Custom plugin to copy public files
const copyPublicFiles = (): Plugin => ({
  name: 'copy-public-files',
  enforce: 'post',
  async generateBundle() {
    // Try multiple possible public directory locations
    const possiblePublicDirs = [
      path.resolve(__dirname, 'public'),
      path.resolve(process.cwd(), 'public'),
      path.resolve('/app/public')
    ];

    let publicDir = null;
    for (const dir of possiblePublicDirs) {
      console.log('Checking public directory:', dir);
      if (fs.existsSync(dir)) {
        publicDir = dir;
        console.log('Found public directory at:', dir);
        break;
      }
    }

    if (!publicDir) {
      console.error('Public directory not found in any of these locations:', possiblePublicDirs);
      return;
    }

    try {
      const files = fs.readdirSync(publicDir);
      console.log('Files in public directory:', files);
      
      // Create static directory in dist
      const distDir = path.resolve(process.cwd(), 'dist');
      const staticDir = path.join(distDir, 'static');
      
      console.log('Creating directories:', {
        distDir,
        staticDir
      });

      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }
      if (!fs.existsSync(staticDir)) {
        fs.mkdirSync(staticDir, { recursive: true });
      }
      
      for (const file of files) {
        if (file === '.DS_Store') continue;
        
        const filePath = path.join(publicDir, file);
        console.log('Processing file:', filePath);

        try {
          const stats = fs.statSync(filePath);
          
          if (stats.isFile()) {
            const isStaticFile = file.match(/\.(encrypted|template|jpg|png|json)$/);
            const destination = isStaticFile ? `static/${file}` : file;
            
            console.log(`Copying ${file} to ${destination}`);
            
            try {
              const content = fs.readFileSync(filePath);
              this.emitFile({
                type: 'asset',
                fileName: destination,
                source: content
              });
              
              // Also copy directly to ensure files are there
              const destPath = path.join(distDir, destination);
              const destDir = path.dirname(destPath);
              
              console.log('Ensuring directory exists:', destDir);
              if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
              }
              
              console.log('Writing file to:', destPath);
              fs.writeFileSync(destPath, content);
              
              console.log(`Successfully copied ${file} to ${destination}`);
            } catch (error) {
              console.error(`Error copying ${file}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error processing ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Error reading public directory:', error);
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyPublicFiles()
  ],
  envPrefix: 'VITE_',
  server: {
    proxy: {
      '/api/chat': {
        target: 'https://cwscaerzmixftirytvwo.supabase.co/functions/v1/chat',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, ''),
        headers: {
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
        }
      }
    }
  },
  build: {
    // Ensure proper asset handling
    assetsDir: 'assets',
    // Copy files to output
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name || '';
          // Keep original names for specific files
          if (info.endsWith('.encrypted') || 
              info.endsWith('.template') ||
              info.endsWith('.jpg') ||
              info.endsWith('.png') ||
              info.endsWith('.json')) {
            return `static/[name][extname]`;
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Copy static files
    copyPublicDir: false, // We handle this with our custom plugin
    // Ensure all files from public are copied
    outDir: 'dist',
  },
  optimizeDeps: {
    include: [
      '@supabase/supabase-js',
      'crypto-browserify',
      'stream-browserify',
      'buffer',
      'util',
      'process',
    ],
    exclude: ['crypto'], // Exclude Node.js crypto module
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Add polyfills
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      util: 'util',
      process: 'process/browser',
    }
  },
  // Ensure static files are copied
  publicDir: 'public',
  // Define globals - only include safe environment variables
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    'process.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_STRIPE_PUBLISHABLE_KEY),
    'process.env.VITE_STRIPE_PREMIUM_PRICE_ID': JSON.stringify(process.env.VITE_STRIPE_PREMIUM_PRICE_ID),
    global: 'globalThis',
  },
});