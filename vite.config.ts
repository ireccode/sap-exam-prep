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

// Custom plugin for SPA fallbacks in development
const spaFallbackPlugin = (): Plugin => ({
  name: 'spa-fallback-plugin',
  configureServer(server) {
    return () => {
      server.middlewares.use((req, res, next) => {
        if (!req.url) {
          return next();
        }
        
        console.log(`[SPA Plugin] Processing request: ${req.url}`);
        
        // Skip API requests and static assets
        if (req.url.startsWith('/api/') || 
            req.url.startsWith('/assets/') ||
            req.url.includes('.') ||
            req.url.includes('__vite')
        ) {
          return next();
        }
        
        // App routes to intercept - be more specific with /ai-chat
        const appRoutes: Record<string, boolean> = {
          '/login': true,
          '/dashboard': true,
          '/training': true,
          '/mini-exam': true,
          '/miniexam': true,
          '/ai-chat': true, // <-- Make sure this is exactly matched
          '/aichat': true,
          '/profile': true,
          '/roadmap': true,
          '/subscription': true,
          '/terms': true,
          '/contact': true,
        };
        
        // Special handling for known problematic routes
        if (req.url === '/ai-chat') {
          console.log(`[SPA Fallback] Special handling for /ai-chat route`);
          req.url = '/index.html';
          return next();
        }
        
        // Check if this is a registered app route
        const route = req.url.split('?')[0]; // Remove query params
        if (appRoutes[route] || req.url.startsWith('/app/')) {
          console.log(`[SPA Fallback] Handling app route: ${req.url}`);
          req.url = '/index.html';
          return next();
        }
        
        next();
      });
    };
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
    spaFallbackPlugin(),
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
    },
    fs: {
      strict: false,
      allow: ['..']
    },
  },
  preview: {
    port: 8080,
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