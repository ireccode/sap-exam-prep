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

// Custom plugin to copy website directory
const copyWebsiteFiles = (): Plugin => ({
  name: 'copy-website-files',
  enforce: 'post',
  apply: 'build',
  async writeBundle() {
    const websiteDir = path.resolve(__dirname, 'website');
    const distDir = path.resolve(__dirname, 'dist');
    
    if (fs.existsSync(websiteDir)) {
      console.log('Copying website directory files to dist...');
      
      // Create the website directory in dist
      const distWebsiteDir = path.join(distDir, 'website');
      fs.mkdirSync(distWebsiteDir, { recursive: true });
      
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
      
      copyDir(websiteDir, distWebsiteDir);
      
      // Copy specific images to the root dist directory
      const imagesToCopy = ['logo.png', 'arch-exam-prep-part03.png'];
      for (const image of imagesToCopy) {
        const imagePath = path.join(websiteDir, 'images', image);
        if (fs.existsSync(imagePath)) {
          fs.copyFileSync(imagePath, path.join(distDir, image));
          console.log(`Copied ${image} to dist root`);
        }
      }
      
      console.log('Website directory copied successfully');
    }
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
    copyWebsiteFiles()
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
      },
      fs: {
        allow: ['..'],
      },
    },
  },
  build: {
    assetsDir: 'assets',
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