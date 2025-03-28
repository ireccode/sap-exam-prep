#!/bin/bash

# Define the directory containing the static assets
ASSETS_DIR="dist"

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
  echo "❌ server.js file missing"
  exit 1
fi

echo "Build verification complete."
echo "Static assets are ready for deployment to DigitalOcean App Platform."

# For actual upload, DigitalOcean App Platform handles this automatically
# when using their App Platform. This script is primarily for verification.

exit 0 