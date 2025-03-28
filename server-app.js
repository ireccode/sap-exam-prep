import express from 'express';
import path from 'path';
import compression from 'compression';
import helmet from 'helmet';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

// Security headers with relaxed CSP for WebAssembly
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https://*.supabase.co", "https://openrouter.ai", "https://api.deepseek.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "https://kit.fontawesome.com", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://openrouter.ai", "https://api.deepseek.com", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      // Allow WebAssembly
      'wasm-unsafe-eval': ["'self'"]
    }
  }
}));

// Compression
app.use(compression());

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  etag: true,
  lastModified: true,
  maxAge: '1w'
}));

// Serve logo and favicon
app.use('/logo.png', express.static(path.join(__dirname, 'logo.png')));
app.use('/favicon.ico', express.static(path.join(__dirname, 'logo.png')));

// Serve encrypted question bank files
app.use('/*.encrypted', (req, res, next) => {
  const filePath = path.join(__dirname, req.path);
  try {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(filePath);
  } catch (err) {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve SPA for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`App server running on port ${PORT}`);
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