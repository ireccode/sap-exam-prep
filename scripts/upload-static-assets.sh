#!/bin/bash
set -e

# Define the directory containing the static assets
ASSETS_DIR="dist"

# Create _headers file if it doesn't exist
if [ ! -f "${ASSETS_DIR}/_headers" ]; then
  echo "Creating _headers file..."
  cat > "${ASSETS_DIR}/_headers" << EOL
/*
  Content-Security-Policy: default-src 'self' https://*.supabase.co https://openrouter.ai; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes' https://js.stripe.com https://seahorse-app-q8fmn.ondigitalocean.app; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; script-src-attr 'unsafe-inline'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer-when-downgrade
EOL
fi

# Create _static.json file if it doesn't exist
if [ ! -f "${ASSETS_DIR}/_static.json" ]; then
  echo "Creating _static.json file..."
  cat > "${ASSETS_DIR}/_static.json" << EOL
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
      "Content-Security-Policy": "default-src 'self' https://*.supabase.co https://openrouter.ai; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes' https://js.stripe.com https://seahorse-app-q8fmn.ondigitalocean.app; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; script-src-attr 'unsafe-inline'"
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

# Verify that all required files are present
echo "Verifying build artifacts..."

# Check if _headers file exists
if [ -f "${ASSETS_DIR}/_headers" ]; then
  echo "✅ _headers file found"
else
  echo "❌ _headers file missing"
  exit 1
fi

# Check if _static.json file exists
if [ -f "${ASSETS_DIR}/_static.json" ]; then
  echo "✅ _static.json file found"
else
  echo "❌ _static.json file missing"
  exit 1
fi

# Check if index.html exists
if [ -f "${ASSETS_DIR}/index.html" ]; then
  echo "✅ index.html file found"
else
  echo "❌ index.html file missing"
  exit 1
fi

# Check if WebAssembly is properly allowed in CSP
if grep -q "'unsafe-eval'" "${ASSETS_DIR}/_headers"; then
  echo "✅ CSP allows WebAssembly ('unsafe-eval' found in _headers)"
else
  echo "⚠️ Warning: CSP may not allow WebAssembly ('unsafe-eval' not found in _headers)"
fi

# Verify server.js was included
if [ -f "${ASSETS_DIR}/server.js" ]; then
  echo "✅ server.js file found"
else
  echo "❌ server.js file missing - copying from source"
  cp server.js "${ASSETS_DIR}/" || exit 1
fi

# Create a 404.html file if it doesn't exist
if [ ! -f "${ASSETS_DIR}/404.html" ]; then
  echo "Creating 404.html file..."
  cat > "${ASSETS_DIR}/404.html" << EOL
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
  echo "✅ Created 404.html file"
fi

echo "Build verification complete."
echo "Static assets are ready for deployment to DigitalOcean App Platform."

# For actual upload, DigitalOcean App Platform handles this automatically
# when using their App Platform. This script is primarily for verification.

exit 0 