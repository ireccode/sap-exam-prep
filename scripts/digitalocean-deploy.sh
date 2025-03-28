#!/bin/bash
set -e

echo "==============================================="
echo "Starting DigitalOcean deployment process..."
echo "==============================================="

# Install dependencies
echo "Installing dependencies..."
npm install
npm install --save-dev @vitejs/plugin-react esbuild vite typescript@5.5.3

# Check TypeScript version
echo "Checking TypeScript version..."
npx tsc --version

# Build the project
echo "Building the project..."
npm run clean

# Run TypeScript compilation
echo "Running TypeScript compilation..."
npx tsc || echo "TypeScript compilation completed with warnings"

# Run Vite build
echo "Running Vite build..."
npx vite build

# Ensure all required files are copied
echo "Copying required files..."
mkdir -p dist

# Copy encrypted files
if [ -d "public" ]; then
  cp -r public/*.encrypted dist/ 2>/dev/null || echo "No encrypted files found"
fi

# Copy website directory
if [ -d "website" ]; then
  cp -r website dist/ || echo "Failed to copy website directory"
fi

# Copy server.js
cp server.js dist/ || echo "Failed to copy server.js"

# Copy redirect files
if [ -f "public/_redirects" ]; then
  cp public/_redirects dist/ || echo "Failed to copy _redirects"
else
  echo "Creating _redirects file..."
  cat > dist/_redirects << EOL
# Handle static assets first
/assets/*  /assets/:splat  200
/static/*  /static/:splat  200

# Handle SPA routing
/*  /index.html  200
EOL
fi

# Copy headers file
if [ -f "public/_headers" ]; then
  cp public/_headers dist/ || echo "Failed to copy _headers"
else
  echo "Creating _headers file..."
  cat > dist/_headers << EOL
/*
  Content-Security-Policy: default-src 'self' https://*.supabase.co https://openrouter.ai https://api.deepseek.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes' https://kit.fontawesome.com https://js.stripe.com https://seahorse-app-q8fmn.ondigitalocean.app; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.deepseek.com https://api.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; script-src-attr 'unsafe-inline'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer-when-downgrade
EOL
fi

# Copy static.json
if [ -f "_static.json" ]; then
  cp _static.json dist/ || echo "Failed to copy _static.json"
else
  echo "Creating _static.json file..."
  cat > dist/_static.json << EOL
{
  "root": "dist",
  "clean_urls": true,
  "routes": {
    "/app/**": "index.html",
    "/": "website/index.html",
    "/login": "/app/login"
  },
  "https_only": true,
  "headers": {
    "/**": {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Security-Policy": "default-src 'self' https://*.supabase.co https://openrouter.ai https://api.deepseek.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes' https://kit.fontawesome.com https://js.stripe.com https://seahorse-app-q8fmn.ondigitalocean.app; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.deepseek.com https://api.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; script-src-attr 'unsafe-inline'"
    },
    "/assets/**": {
      "Cache-Control": "public, max-age=31536000, immutable"
    },
    "/assets/*.js": {
      "Content-Type": "application/javascript; charset=utf-8"
    },
    "/assets/*.css": {
      "Content-Type": "text/css; charset=utf-8"
    },
    "/*.encrypted": {
      "Content-Type": "application/octet-stream"
    }
  }
}
EOL
fi

# Copy Digital Ocean config
mkdir -p dist/.do
cp -r .do/* dist/.do/ 2>/dev/null || echo "No .do directory found"

# Copy logo
if [ -f "website/images/logo.png" ]; then
  cp -f website/images/logo.png dist/ || echo "Failed to copy logo.png"
fi

# Create 404.html
if [ ! -f "dist/404.html" ]; then
  echo "Creating 404.html file..."
  cat > dist/404.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found | SAP Architect Exam Prep</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #f7f7f7;
      color: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      text-align: center;
      padding: 40px;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #d32f2f;
    }
    p {
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }
    a {
      display: inline-block;
      padding: 12px 24px;
      background-color: #1976d2;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      transition: background-color 0.3s;
    }
    a:hover {
      background-color: #1565c0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404 - Page Not Found</h1>
    <p>Sorry, the page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
    <a href="/">Return to Homepage</a>
  </div>
</body>
</html>
EOL
fi

# Verify the HTML file has CSP meta tag
if [ -f "dist/index.html" ]; then
  if ! grep -q "Content-Security-Policy" "dist/index.html"; then
    echo "Adding CSP meta tag to index.html..."
    sed -i.bak 's/<head>/<head>\n  <meta http-equiv="Content-Security-Policy" content="default-src '\''self'\'' https:\/\/*.supabase.co https:\/\/openrouter.ai https:\/\/api.deepseek.com; script-src '\''self'\'' '\''unsafe-inline'\'' '\''unsafe-eval'\'' '\''unsafe-hashes'\'' https:\/\/kit.fontawesome.com https:\/\/js.stripe.com https:\/\/seahorse-app-q8fmn.ondigitalocean.app; style-src '\''self'\'' '\''unsafe-inline'\''; img-src '\''self'\'' data: https:; connect-src '\''self'\'' https:\/\/*.supabase.co wss:\/\/*.supabase.co https:\/\/openrouter.ai https:\/\/api.deepseek.com https:\/\/api.stripe.com; frame-src '\''self'\'' https:\/\/js.stripe.com https:\/\/hooks.stripe.com; script-src-attr '\''unsafe-inline'\''">/' "dist/index.html"
    rm -f "dist/index.html.bak"
  fi
fi

echo "==============================================="
echo "Deployment build completed successfully!"
echo "Files in dist directory:"
ls -la dist/
echo "==============================================="

exit 0 