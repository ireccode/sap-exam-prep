#!/bin/bash
set -e

echo "====================================================="
echo "Landing Page Deployment Script"
echo "====================================================="

# Parse command line arguments
APP_DOMAIN="${1:-https://shark-app-22fqj.ondigitalocean.app}"
PRODUCTION=false

# Check for production flag
for arg in "$@"
do
  case $arg in
    --production)
    APP_DOMAIN="https://www.saparchitectprep.com"
    PRODUCTION=true
    shift
    ;;
    --domain=*)
    APP_DOMAIN="${arg#*=}"
    shift
    ;;
    *)
    # Unknown option
    ;;
  esac
done

echo "Using app domain: $APP_DOMAIN"
if [ "$PRODUCTION" = true ]; then
  echo "Running in PRODUCTION mode"
else
  echo "Running in TESTING mode"
fi

# Create landing-page-dist directory
echo "Creating landing page distribution directory..."
mkdir -p landing-page-dist

# Copy website files to landing-page-dist
echo "Copying website files..."
cp -r website/* landing-page-dist/

# Fix paths in index.html
echo "Fixing paths in index.html..."
sed -i.bak 's|href="/website/images/logo.png"|href="/images/logo.png"|g' landing-page-dist/index.html
sed -i.bak 's|href="css/|href="/css/|g' landing-page-dist/index.html
sed -i.bak 's|href="js/|href="/js/|g' landing-page-dist/index.html
sed -i.bak 's|href="/sitemap.xml"|href="/sitemap.xml"|g' landing-page-dist/index.html
rm -f landing-page-dist/index.html.bak

# Copy essential assets
echo "Copying essential assets..."
cp -r public/images landing-page-dist/ 2>/dev/null || mkdir -p landing-page-dist/images
cp website/images/logo.png landing-page-dist/favicon.ico 2>/dev/null || echo "No favicon found, skipping..."
cp website/images/logo.png landing-page-dist/ 2>/dev/null || echo "No logo found, skipping..."

# Update image paths in HTML files from website/images to images
echo "Updating image paths in HTML files..."
for html_file in landing-page-dist/*.html; do
  if [ -f "$html_file" ]; then
    echo "  Fixing image paths in $html_file..."
    sed -i.bak "s|website/images/|images/|g" "$html_file"
    # Clean up backup files
    rm -f "$html_file.bak"
  fi
done

# Create 404 page
if [ ! -f "landing-page-dist/404.html" ]; then
  echo "Creating 404.html page..."
  cat > landing-page-dist/404.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found - SAP Architect Exam Prep</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
    h1 { color: #0073e6; }
    .error-code { 
      font-size: 5rem; 
      font-weight: bold;
      color: #eaeaea;
      margin: 0;
    }
    .back-link {
      display: inline-block;
      margin-top: 2rem;
      padding: 0.7rem 1.5rem;
      background-color: #0073e6;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
    }
    .back-link:hover {
      background-color: #0058a6;
    }
  </style>
</head>
<body>
  <p class="error-code">404</p>
  <h1>Page Not Found</h1>
  <p>The page you're looking for doesn't exist or has been moved.</p>
  <a href="/" class="back-link">Go to Home Page</a>
</body>
</html>
EOF
fi

# Update landing page links to point to app subdomain
echo "Updating links to point to app domain: $APP_DOMAIN"

# Create a script to update links on the landing page
for html_file in landing-page-dist/*.html; do
  if [ -f "$html_file" ]; then
    echo "Processing $html_file..."
    
    # Replace /app/ links with the app domain
    sed -i.bak "s|href=\"/app/|href=\"$APP_DOMAIN/|g" "$html_file"
    sed -i.bak "s|action=\"/app/|action=\"$APP_DOMAIN/|g" "$html_file"
    
    # Replace /login links with app domain/login
    sed -i.bak "s|href=\"/login\"|href=\"$APP_DOMAIN/login\"|g" "$html_file"
    
    # Fix any hardcoded www.saparchitectprep.com links to use the specified domain
    sed -i.bak "s|https://app\.saparchitectprep\.com|$APP_DOMAIN|g" "$html_file"
    
    # Clean up backup files
    rm -f "$html_file.bak"
  fi
done

# Add JavaScript to fix any dynamic links that might be added via JS
echo "Adding JavaScript to handle dynamic links..."
# First, remove any existing script tags that we added before
sed -i.bak '/document.addEventListener('\''DOMContentLoaded'\'', function() {/,/});/d' landing-page-dist/index.html
sed -i.bak '/<script>/,/<\/script>/d' landing-page-dist/index.html
rm -f landing-page-dist/index.html.bak

# Now add our new script
cat >> landing-page-dist/index.html << EOF

<script>
  // Handle all app links
  document.addEventListener('DOMContentLoaded', function() {
    // For login links
    const loginLinks = document.querySelectorAll('a[href="/login"]');
    loginLinks.forEach(link => {
      link.setAttribute('href', '$APP_DOMAIN/login');
    });
    
    // For app links
    const appLinks = document.querySelectorAll('a[href^="/app/"]');
    appLinks.forEach(link => {
      const path = link.getAttribute('href').replace('/app/', '/');
      link.setAttribute('href', '$APP_DOMAIN' + path);
    });
    
    // Fix any hardcoded www.saparchitectprep.com links
    const sapLinks = document.querySelectorAll('a[href^="https://www.saparchitectprep.com/"]');
    sapLinks.forEach(link => {
      const path = link.getAttribute('href').replace('https://www.saparchitectprep.com', '');
      link.setAttribute('href', '$APP_DOMAIN' + path);
    });
  });
</script>
</body>
EOF

# Create _redirects file for Netlify-style redirects (DigitalOcean App Platform supports this)
echo "Creating _redirects file..."
cat > landing-page-dist/_redirects << EOF
# Static assets
/images/*     /images/:splat     200
/assets/*     /assets/:splat     200
/css/*        /css/:splat       200
/js/*         /js/:splat        200

# Handle SPA routing in root domain
/*            /index.html        200
EOF

# Verify deployment files
echo "Verifying deployment files..."
echo "Checking index.html..."
if [ ! -f "landing-page-dist/index.html" ]; then
  echo "ERROR: index.html not found!"
  exit 1
fi

echo "Checking required assets..."
for file in "css/styles.css" "js/main.js" "images/logo.png"; do
  if [ ! -f "landing-page-dist/$file" ]; then
    echo "WARNING: $file not found in landing-page-dist/"
  fi
done

echo "Verifying index.html paths..."
if grep -q 'href="/website/images/logo.png"' landing-page-dist/index.html; then
  echo "ERROR: Found incorrect logo path in index.html"
  exit 1
fi

if grep -q 'href="css/' landing-page-dist/index.html; then
  echo "ERROR: Found relative CSS path in index.html"
  exit 1
fi

if grep -q 'href="js/' landing-page-dist/index.html; then
  echo "ERROR: Found relative JS path in index.html"
  exit 1
fi

echo "====================================================="
echo "Landing page build complete! Files are in landing-page-dist/"
echo "App domain set to: $APP_DOMAIN"
echo ""
echo "To deploy to DigitalOcean App Platform:"
echo "1. Create a new static site"
echo "2. Point it to the landing-page-dist/ directory"
echo "3. Set the domain to your root domain (e.g., saparchitectprep.com)"
echo ""
echo "To deploy for production use:"
echo "  ./scripts/landing-page-deploy.sh --production"
echo "=====================================================" 