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
      defaultSrc: ["'self'", "https://*.supabase.co", "https://openrouter.ai"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", 
        "'unsafe-hashes'", 
        "https://js.stripe.com", 
        "https://cdnjs.cloudflare.com",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://ssl.google-analytics.com",
        "https://web.cmp.usercentrics.eu",
        "https://*.usercentrics.eu"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "https://www.google-analytics.com"],
      connectSrc: [
        "'self'", 
        "https://*.supabase.co", 
        "wss://*.supabase.co", 
        "https://openrouter.ai", 
        "https://api.stripe.com",
        "https://www.google-analytics.com",
        "https://analytics.google.com",
        "https://email-worker.narkanie00.workers.dev",
        "https://*.usercentrics.eu",
        "https://v1.api.service.cmp.usercentrics.eu",
        "https://web.cmp.usercentrics.eu",
        "https://consent-api.service.consent.usercentrics.eu",
        "https://consent-rt-ret.service.consent.usercentrics.eu",
        "https://graphql.usercentrics.eu"
      ],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com", "https://www.googletagmanager.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "data:", "https://cdnjs.cloudflare.com"]
    }
  }
}));

// Compression
app.use(compression());

// Serve React app static files with higher priority for asset paths
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  etag: true,
  lastModified: true,
  maxAge: '1w'
}));

// Serve static files with proper paths and quality settings
app.use('/logo.png', express.static(path.join(__dirname, 'website/images/logo.png'), {
  etag: true,
  lastModified: true,
  maxAge: '1w',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.setHeader('Content-Type', 'image/png');
  }
}));

// Serve favicon from logo.png
app.use('/favicon.ico', express.static(path.join(__dirname, 'website/images/logo.png'), {
  etag: true,
  lastModified: true,
  maxAge: '1w',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.setHeader('Content-Type', 'image/png');
  }
}));

app.use('/vite.svg', express.static(path.join(__dirname, 'vite.svg')));

// Serve high-quality architect logo
app.use('/sap_architect_logo01.jpg', express.static(path.join(__dirname, '/sap_architect_logo01.jpg'), {
  etag: true,
  lastModified: true,
  maxAge: '1w',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.setHeader('Content-Type', 'image/png');
  }
}));

// Serve encrypted question bank files at root level
app.use('/basic_btp_query_bank.encrypted', express.static(path.join(__dirname, 'basic_btp_query_bank.encrypted')));
app.use('/premium_btp_query_bank.encrypted', express.static(path.join(__dirname, 'premium_btp_query_bank.encrypted')));

// Serve images from website/images directory
app.use('/website/images', express.static(path.join(__dirname, 'website/images')));

// Serve JavaScript utility files with proper MIME type
app.use('/refresh.js', express.static(path.join(__dirname, 'refresh.js'), {
  etag: true,
  lastModified: true,
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Type', 'application/javascript');
  }
}));

app.use('/debug-routes.js', express.static(path.join(__dirname, 'debug-routes.js'), {
  etag: true,
  lastModified: true,
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Type', 'application/javascript');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve robots.txt with proper headers
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// Special handler for all encrypted files to ensure proper MIME type
app.get('/*.encrypted', (req, res, next) => {
  const filePath = path.join(__dirname, req.path);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(filePath);
  } else {
    next(); // Pass to the next handler if file not found
  }
});

// Handle React app routes - this must come before the catch-all route
app.get([
  '/app*',
  '/login',
  '/dashboard', 
  '/training', 
  '/miniexam', 
  '/aichat',
  '/profile',
  '/roadmap',
  '/subscription',
  '/subscription/success',
  '/subscription/cancel',
  '/terms',
  '/contact',
  '/update-password'
], (req, res) => {
  // Handle path normalization (convert miniexam to mini-exam)
  const reqPath = req.path;
  const normalizedPaths = {
    // No normalization needed with the new route format
  };
  
  if (normalizedPaths[reqPath]) {
    console.log(`Normalized path from ${reqPath} to ${normalizedPaths[reqPath]}`);
    return res.redirect(normalizedPaths[reqPath]);
  }
  
  // Log this access for debugging
  console.log(`Serving app route for: ${reqPath}`);
  res.sendFile(path.join(__dirname, 'index.html'));
});

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

// Handle 404 errors properly with fallback
app.use((req, res, next) => {
  // Check if the request is for a file that should exist
  const filePath = path.join(__dirname, req.path);
  
  if (fs.existsSync(filePath)) {
    return next(); // File exists, continue to next middleware
  }
  
  // Check if this is a webpack asset or API request
  if (req.path.startsWith('/assets/') || 
      req.path.startsWith('/api/') || 
      req.path.startsWith('/static/')) {
    return next(); // Let the next middleware handle it
  }
  
  // For all other routes that don't exist, send 404.html for client-side fallback
  console.log(`404 for path: ${req.path}, serving 404.html with fallback system`);
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Catch-all route for the React app - this should rarely be reached due to the 404 handler
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Redirect non-www to www
app.use((req, res, next) => {
  if (req.headers.host === 'saparchitectprep.com') {
    return res.redirect(301, 'https://www.saparchitectprep.com' + req.originalUrl);
  }
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Landing page: http://localhost:${PORT}/`);
  console.log(`React app: http://localhost:${PORT}/app`);
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
