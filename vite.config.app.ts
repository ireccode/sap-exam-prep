/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import type { Plugin } from 'vite';

// Get environment variables with fallbacks
const getEnvVar = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://cwscaerzmixftirytvwo.supabase.co');
const targetDomain = getEnvVar('VITE_TARGET_DOMAIN', 'app.examprep.techtreasuretrove.in');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
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
          'X-Title': 'SAPArchitectPrep',
          'HTTP-Referer': `https://${targetDomain}`,
        },
      }
    },
    fs: {
      allow: ['..']
    }
  },
  build: {
    assetsDir: 'assets',
    assetsInlineLimit: 0, // Don't inline any assets
    outDir: 'app-dist',
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
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    copyPublicDir: true,
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
  publicDir: 'public',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    global: 'globalThis',
  },
  assetsInclude: ['**/*.encrypted'],
}); 