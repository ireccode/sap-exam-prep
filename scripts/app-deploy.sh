#!/bin/bash
set -e

echo "====================================================="
echo "React SPA Deployment Script"
echo "====================================================="

# Create app-dist directory
echo "Creating app distribution directory..."
mkdir -p app-dist

# Build the React app using Vite
echo "Building React SPA..."
npm run build

# Copy build files from dist to app-dist
echo "Copying built files to app-dist..."
cp -r dist/* app-dist/

# Make sure we have an index.html
if [ ! -f "app-dist/index.html" ]; then
  echo "ERROR: index.html not found in the build output!"
  exit 1
fi

# Check if the index.html contains the proper asset references
if ! grep -q "src=\"/assets/" app-dist/index.html; then
  echo "Warning: index.html may not have proper asset references."
  echo "Attempting to fix asset references..."
  
  # Create backup of original index.html
  cp app-dist/index.html app-dist/index.html.original
  
  # Look for JS and CSS files in the assets directory
  MAIN_JS=$(find app-dist/assets -name "main-*.js" | head -n 1)
  VENDOR_JS=$(find app-dist/assets -name "vendor-*.js" | head -n 1)
  MAIN_CSS=$(find app-dist/assets -name "*.css" | head -n 1)
  
  if [ -n "$MAIN_JS" ] && [ -n "$MAIN_CSS" ]; then
    # Extract filenames
    MAIN_JS_FILE=$(basename "$MAIN_JS")
    VENDOR_JS_FILE=$(basename "$VENDOR_JS")
    MAIN_CSS_FILE=$(basename "$MAIN_CSS")
    
    echo "Found assets:"
    echo "  JS: $MAIN_JS_FILE"
    echo "  Vendor JS: $VENDOR_JS_FILE"
    echo "  CSS: $MAIN_CSS_FILE"
    
    # Generate new index.html with correct references
    cat > app-dist/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SAP Architect Exam Prep</title>
  <link rel="stylesheet" href="/assets/$MAIN_CSS_FILE">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://*.supabase.co https://openrouter.ai; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; script-src-attr 'unsafe-inline';">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/$MAIN_JS_FILE"></script>
  <script type="module" src="/assets/$VENDOR_JS_FILE"></script>
</body>
</html>
EOF
    echo "Generated new index.html with proper asset references"
  else
    echo "Couldn't find necessary assets, using original index.html"
  fi
fi

# Create 404.html that redirects to index.html for client-side routing
echo "Creating 404.html for SPA routing..."
cat > app-dist/404.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=/">
  <title>Redirecting...</title>
  <script>
    window.location.href = '/' + window.location.pathname.slice(1);
  </script>
</head>
<body>
  <p>Redirecting to the application...</p>
</body>
</html>
EOF

# Create _redirects file specific for the app
echo "Creating _redirects file for SPA routing..."
cat > app-dist/_redirects << EOF
# SPA fallback
/*    /index.html   200
EOF

echo "====================================================="
echo "React SPA build complete! Files are in app-dist/"
echo "To deploy to DigitalOcean App Platform:"
echo "1. Create a new static site"
echo "2. Point it to the app-dist/ directory" 
echo "3. Set the domain to your app subdomain (e.g., www.saparchitectprep.com)"
echo "=====================================================" 