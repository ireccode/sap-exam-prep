/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      generateBundle() {
        // Copy _redirects file to dist
        if (fs.existsSync('public/_redirects')) {
          this.emitFile({
            type: 'asset',
            fileName: '_redirects',
            source: fs.readFileSync('public/_redirects', 'utf-8')
          });
        }
      }
    }
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
    copyPublicDir: true,
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