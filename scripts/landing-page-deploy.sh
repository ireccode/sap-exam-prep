#!/bin/bash
set -e

echo "Starting landing page deployment build..."

# Parse command line arguments
WITH_DEPS=false
for arg in "$@"
do
  case $arg in
    --with-dependencies)
    WITH_DEPS=true
    shift
    ;;
    *)
    # Unknown option
    ;;
  esac
done

# Clean previous builds
echo "Cleaning previous build artifacts"
rm -rf landing-dist
npm run clean-landing 2>/dev/null || :

# Install dependencies if needed
if [ "$WITH_DEPS" = true ]; then
  echo "Installing dependencies with --include=dev flag..."
  npm install --include=dev
fi

# Create output directory
mkdir -p landing-dist
mkdir -p landing-dist/js
mkdir -p landing-dist/css
mkdir -p landing-dist/images

# Copy website files
echo "Copying website files to landing-dist/"
cp -r website/index.html landing-dist/
cp -r website/js/* landing-dist/js/
cp -r website/css/* landing-dist/css/
cp -r website/images/* landing-dist/images/
cp -r website/sitemap.xml landing-dist/ 2>/dev/null || :

# Copy basic assets
cp website/images/logo.png landing-dist/
cp website/images/favicon.ico landing-dist/ 2>/dev/null || :

# Create 404 page
if [ ! -f "landing-dist/404.html" ]; then
  echo "Creating 404.html page"
  cat > landing-dist/404.html << 'EOF'
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

# Create _headers file for security headers
echo "Creating _headers file with security configuration"
cat > landing-dist/_headers << 'EOF'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://kit.fontawesome.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'
  Strict-Transport-Security: max-age=31536000; includeSubDomains
EOF

# Create _redirects file to handle app routing and redirects
echo "Creating _redirects file for routing"
cat > landing-dist/_redirects << 'EOF'
# Redirect /login to the app login page
/login  https://shark-app-22fqj.ondigitalocean.app/login  301
/app/*  https://shark-app-22fqj.ondigitalocean.app/:splat  301
/app    https://shark-app-22fqj.ondigitalocean.app  301

# Handle 404s
/*  /index.html  200
EOF

# Create a static.json file for static site configuration
echo "Creating static site configuration file..."
cat > landing-dist/static.json << 'EOF'
{
  "root": "./",
  "clean_urls": true,
  "routes": {
    "/**": "index.html"
  },
  "https_only": true,
  "headers": {
    "/**": {
      "Cache-Control": "public, max-age=0, must-revalidate"
    },
    "/js/**": {
      "Cache-Control": "public, max-age=31536000, immutable"
    },
    "/css/**": {
      "Cache-Control": "public, max-age=31536000, immutable"
    },
    "/images/**": {
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  }
}
EOF

echo "====================================================="
echo "Landing page build complete! Files are ready in landing-dist/ directory."
echo "This is a STATIC SITE deployment - no server.js is needed!"
echo "Just deploy the landing-dist/ directory to DigitalOcean App Platform"
echo "as a Static Site (not a Web Service)."
echo "====================================================="
ls -la landing-dist/ 