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
      // Add MIME type handling for JavaScript files
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        
        // Explicit MIME type for JavaScript utility files
        const jsUtilFiles = ['/refresh.js', '/debug-routes.js'];
        if (jsUtilFiles.includes(req.url)) {
          console.log(`[SPA Plugin] Setting MIME type for utility script: ${req.url}`);
          res.setHeader('Content-Type', 'application/javascript');
        }
        
        next();
      });
      
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
          '/miniexam': true,
          '/aichat': true,
          '/profile': true,
          '/roadmap': true,
          '/subscription': true,
          '/terms': true,
          '/contact': true,
        };
        
        // Special handling for known problematic routes
        if (req.url === '/aichat') {
          console.log(`[SPA Fallback] Special handling for /aichat route`);
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

// Custom plugin to modify Content Security Policy
const cspHeadersPlugin = (): Plugin => ({
  name: 'csp-headers-plugin',
  configureServer(server) {
    return () => {
      server.middlewares.use((req, res, next) => {
        // Add CSP header to all responses
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self' https://*.supabase.co https://openrouter.ai; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes' https://js.stripe.com https://cdnjs.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://web.cmp.usercentrics.eu; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https: https://www.google-analytics.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://*.usercentrics.eu https://v1.api.service.cmp.usercentrics.eu https://web.cmp.usercentrics.eu https://consent-api.service.consent.usercentrics.eu https://consent-rt-ret.service.consent.usercentrics.eu https://email-worker.narkanie00.workers.dev; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; script-src-attr 'unsafe-inline'; form-action 'self'; font-src 'self' data: https://cdnjs.cloudflare.com"
        );
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
    cspHeadersPlugin(),
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