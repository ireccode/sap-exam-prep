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
    const publicDir = path.resolve('/app/public');
    
    if (fs.existsSync(publicDir)) {
      const files = fs.readdirSync(publicDir);
      console.log('Files to be copied:', files);
      
      const distDir = path.resolve(process.cwd(), 'dist');
      fs.mkdirSync(distDir, { recursive: true });
      
      for (const file of files) {
        if (file === '.DS_Store') continue;
        
        const filePath = path.join(publicDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          const content = fs.readFileSync(filePath);
          this.emitFile({
            type: 'asset',
            fileName: file,
            source: content
          });
        }
      }
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyPublicFiles()
  ],
  server: {
    host: '0.0.0.0', // Allow external access
    port: 5173,
    proxy: {
      '/api/chat': {
        target: 'https://cwscaerzmixftirytvwo.supabase.co/functions/v1/chat',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, ''),
      }
    }
  },
  build: {
    assetsDir: 'assets',
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
          vendor: ['react', 'react-dom', '@supabase/supabase-js'],
        },
      },
    },
    copyPublicDir: true,
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for smaller build size
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js', 'crypto-browserify', 'stream-browserify', 'buffer', 'util', 'process'],
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
});