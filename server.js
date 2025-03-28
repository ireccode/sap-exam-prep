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
      defaultSrc: ["'self'", "https://*.supabase.co", "https://openrouter.ai", "https://api.deepseek.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "https://kit.fontawesome.com", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://openrouter.ai", "https://api.deepseek.com", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      scriptSrcAttr: ["'unsafe-inline'"]
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle React app login route directly for landing page links
app.get('/login', (req, res) => {
  // Simply redirect to the app login path
  res.redirect('/app/login');
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
app.get('/app*', (req, res) => {
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

// Catch-all route for the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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
