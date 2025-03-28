
import express from 'express';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import helmet from 'helmet';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https://cwscaerzmixftirytvwo.supabase.co", "https://openrouter.ai"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cwscaerzmixftirytvwo.supabase.co", "wss://cwscaerzmixftirytvwo.supabase.co", "https://openrouter.ai"]
    }
  }
}));

// Compression
app.use(compression());

// Serve static files from the website directory for the landing page
app.use(express.static(path.join(__dirname, 'website'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set caching headers based on file type
    if (filePath.endsWith('.html')) {
      // HTML files - no cache
      res.setHeader('Cache-Control', 'no-cache');
    } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
      // Static assets - cache for 1 week
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  }
}));

// Root path specifically serves the landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'website/index.html'));
});

// Serve static files with caching
app.use(express.static(path.join(__dirname, 'dist'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set caching headers based on file type
    if (filePath.endsWith('.html')) {
      // HTML files - no cache
      res.setHeader('Cache-Control', 'no-cache');
    } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
      // Static assets - cache for 1 week
      res.setHeader('Cache-Control', 'public, max-age=604800');
    } else if (filePath.endsWith('.encrypted')) {
      // Encrypted files - set correct MIME type
      res.setHeader('Content-Type', 'application/octet-stream');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle SPA routing
app.get('*', (req, res) => {
  // Exclude API routes and static files
  if (req.url.startsWith('/api/') || req.url.includes('.')) {
    return res.status(404).send('Not found');
  }
  
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
}); 