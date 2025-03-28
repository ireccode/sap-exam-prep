#!/bin/bash
set -e

echo "Starting app deployment build..."

# Parse command line arguments
SKIP_DEPS=false
for arg in "$@"
do
  case $arg in
    --skip-dependencies)
    SKIP_DEPS=true
    shift
    ;;
    *)
    # Unknown option
    ;;
  esac
done

# Clean up previous build
echo "Cleaning previous build artifacts"
rm -rf app-dist
npm run clean 2>/dev/null || :

# Install dependencies
if [ "$SKIP_DEPS" = false ]; then
  echo "Installing dependencies with --include=dev flag..."
  npm install --include=dev
else
  echo "Skipping dependency installation (--skip-dependencies flag used)"
fi

# Build the app
echo "Building the React app..."
NODE_ENV=production npx tsc && npx vite build

# Create app-dist directory and copy files from dist
echo "Setting up app-dist with files from the build..."
mkdir -p app-dist

# Copy all files from dist directory
echo "Copying all built files from dist/ to app-dist/..."
cp -r dist/* app-dist/

# Copy encrypted files and other necessary assets
echo "Copying additional assets and configuration files..."
cp -r public/*.encrypted app-dist/ 2>/dev/null || :
cp website/images/logo.png app-dist/ 2>/dev/null || :
cp server-app.js app-dist/server.js 2>/dev/null || :

# Create a simplified server for the app
if [ ! -f "app-dist/server.js" ]; then
  echo "Creating simplified server.js for the app..."
  cat > app-dist/server.js << 'EOF'
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
EOF
fi

# Verify index.html has proper script and CSS links and add WebAssembly support
echo "Checking and updating index.html..."

# Create a backup of the original index.html
cp app-dist/index.html app-dist/index.html.bak

# Update the CSP in index.html to include wasm-unsafe-eval
sed -i.bak 's/http-equiv="Content-Security-Policy" content="/http-equiv="Content-Security-Policy" content="script-src-attr \x27unsafe-inline\x27; default-src \x27self\x27 https:\/\/*.supabase.co https:\/\/openrouter.ai https:\/\/api.deepseek.com; script-src \x27self\x27 \x27unsafe-inline\x27 \x27unsafe-eval\x27 \x27unsafe-hashes\x27 \x27wasm-unsafe-eval\x27 https:\/\/kit.fontawesome.com https:\/\/js.stripe.com; style-src \x27self\x27 \x27unsafe-inline\x27; img-src \x27self\x27 data: https:; connect-src \x27self\x27 https:\/\/*.supabase.co wss:\/\/*.supabase.co https:\/\/openrouter.ai https:\/\/api.deepseek.com https:\/\/api.stripe.com; frame-src \x27self\x27 https:\/\/js.stripe.com https:\/\/hooks.stripe.com"/' app-dist/index.html

# Check if the sed command worked
if grep -q "wasm-unsafe-eval" app-dist/index.html; then
  echo "Successfully updated CSP in index.html to include WebAssembly support"
else
  echo "Warning: Could not update CSP in index.html automatically"
  
  # Get the actual asset file names
  MAIN_JS=$(find app-dist/assets -name "main-*.js" | head -n 1 | sed 's|app-dist/||')
  VENDOR_JS=$(find app-dist/assets -name "vendor-*.js" | head -n 1 | sed 's|app-dist/||')
  MAIN_CSS=$(find app-dist/assets -name "main-*.css" | head -n 1 | sed 's|app-dist/||')
  
  if [ -n "$MAIN_JS" ] && [ -n "$VENDOR_JS" ] && [ -n "$MAIN_CSS" ]; then
    echo "Found assets: $MAIN_JS, $VENDOR_JS, $MAIN_CSS"
    
    # Create a new index.html with the proper CSP and asset links
    cat > app-dist/index.html << EOF
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="script-src-attr 'unsafe-inline'; default-src 'self' https://*.supabase.co https://openrouter.ai https://api.deepseek.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes' 'wasm-unsafe-eval' https://kit.fontawesome.com https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.deepseek.com https://api.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com" />
    <title>SAP Architect Exam Prep</title>
    <script type="module" crossorigin src="/$MAIN_JS"></script>
    <link rel="modulepreload" crossorigin href="/$VENDOR_JS">
    <link rel="stylesheet" crossorigin href="/$MAIN_CSS">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF
    echo "Updated index.html with proper asset links and WebAssembly CSP"
  else
    echo "Error: Could not find all required assets. Maintaining the existing index.html."
  fi
fi

# Create Procfile for DigitalOcean
echo "Creating Procfile for the app..."
cat > app-dist/Procfile << 'EOF'
web: node server.js
EOF

# Create _headers file with updated CSP for WebAssembly
echo "Creating _headers file with proper CSP for WebAssembly..."
cat > app-dist/_headers << 'EOF'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: script-src-attr 'unsafe-inline'; default-src 'self' https://*.supabase.co https://openrouter.ai https://api.deepseek.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes' 'wasm-unsafe-eval' https://kit.fontawesome.com https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.deepseek.com https://api.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com
  Strict-Transport-Security: max-age=31536000; includeSubDomains
EOF

# Create _redirects file for SPA routing
echo "Creating _redirects file for SPA routing..."
cat > app-dist/_redirects << 'EOF'
# Handle SPA routing
/*  /index.html  200
EOF

# Create _static.json configuration file
echo "Creating _static.json configuration..."
cat > app-dist/_static.json << 'EOF'
{
  "root": "app-dist",
  "routes": {
    "/**": "index.html"
  },
  "https_only": true,
  "error_page": "404.html",
  "headers": {
    "/**": {
      "Cache-Control": "public, max-age=0, must-revalidate"
    },
    "/assets/**": {
      "Cache-Control": "public, max-age=31536000, immutable"
    },
    "/*.js": {
      "Cache-Control": "public, max-age=31536000, immutable"
    },
    "/*.css": {
      "Cache-Control": "public, max-age=31536000, immutable"
    },
    "/*.png": {
      "Cache-Control": "public, max-age=31536000, immutable"
    },
    "/*.encrypted": {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  }
}
EOF

# Create 404 page
if [ ! -f "app-dist/404.html" ]; then
  echo "Creating 404.html page"
  cat > app-dist/404.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found - SAP Architect Exam Prep</title>
  <link rel="icon" type="image/png" href="/logo.png"/>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fa;
      color: #333;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .container {
      max-width: 600px;
      padding: 40px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #0a58ca;
      margin-bottom: 20px;
    }
    p {
      margin-bottom: 20px;
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      background-color: #0d6efd;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      transition: background-color 0.3s;
    }
    .btn:hover {
      background-color: #0a58ca;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Page Not Found</h1>
    <p>Sorry, the page you're looking for doesn't exist or has been moved.</p>
    <a href="/" class="btn">Go to Home Page</a>
  </div>
</body>
</html>
EOF
fi

echo "====================================================="
echo "App deployment build complete! Files are ready in app-dist/ directory."
echo "This deployment will work as a WEB SERVICE running node server.js."
echo "Make sure to select 'Web Service' (not 'Static Site') when deploying"
echo "to DigitalOcean App Platform."
echo "====================================================="
ls -la app-dist/ 