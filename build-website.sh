    #!/bin/bash

# Exit on error
set -e

echo "Starting website build process..."

# Create website directory structure
echo "Creating directory structure..."
mkdir -p website/{css,js,images}

# Install required tools if not present
echo "Checking and installing required tools..."
if ! command -v csso &> /dev/null; then
    echo "Installing csso-cli..."
    npm install -g csso-cli
fi

if ! command -v uglifyjs &> /dev/null; then
    echo "Installing uglify-js..."
    npm install -g uglify-js
fi

# Process CSS
echo "Processing CSS files..."
if [ -f "src/website/css/main.css" ]; then
    csso src/website/css/main.css --output website/css/main.min.css
    echo "CSS minimized successfully"
else
    echo "Warning: css/main.css not found"
fi

# Process JavaScript
echo "Processing JavaScript files..."
if [ -f "src/website/js/main.js" ]; then
    uglifyjs src/website/js/main.js --compress --mangle --output website/js/main.min.js
    echo "JavaScript minimized successfully"
else
    echo "Warning: src/website/js/main.js not found"
fi

# Copy images
echo "Copying images..."
if [ -d "src/website/images" ]; then
    cp -r src/website/images/* website/images/ 2>/dev/null || echo "No images to copy"
    echo "Images copied successfully"
else
    echo "Warning: images directory not found"
fi

# Copy and update index.html
echo "Processing index.html..."
if [ -f "src/website/index.html" ]; then
    # Create a copy with updated paths
    sed 's/css\/main.css/css\/main.min.css/g; s/js\/main.js/js\/main.min.js/g' src/website/index.html > website/index.html    
    echo "index.html processed and copied successfully"
else
    echo "Warning: index.html not found"
fi

echo "Build process completed!"
echo "Website files are available in the 'website' directory" 
