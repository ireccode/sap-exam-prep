#!/bin/bash
set -e

echo "Starting DigitalOcean build process..."

# Install all dependencies
echo "Installing dependencies..."
npm install
npm install --save-dev @vitejs/plugin-react

# Check if vite is installed
if ! [ -x "$(command -v vite)" ]; then
  echo "Vite not found in path, installing globally..."
  npm install -g vite
fi

# Build the project
echo "Building project..."
npm run build

# Verify the build
echo "Verifying build artifacts..."
if [ -d "dist" ]; then
  echo "✅ Build directory exists"
else
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

# Run upload verification script
echo "Running asset verification..."
./scripts/upload-static-assets.sh

echo "DigitalOcean build completed successfully"
exit 0 