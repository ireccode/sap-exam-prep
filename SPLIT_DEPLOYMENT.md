# Split Deployment Guide

This guide explains how to deploy the SAP Architect Exam Prep application as two separate sites on DigitalOcean:
1. A landing page (marketing site) - deployed as a **pure static site**
2. The React SPA application - deployed as a **Web Service with server.js** for WebAssembly support

## Why Split the Deployment?

By splitting the deployment into two separate sites, we can:
1. Avoid Content Security Policy (CSP) issues with WebAssembly
2. Simplify routing and configuration for each component
3. Improve performance and reliability
4. Enable independent updates of each component

## Prerequisites

- DigitalOcean account
- Two domains or subdomains:
  - Main domain for landing page (e.g., `examprep.techtreasuretrove.in`)
  - Subdomain for the app (e.g., `app.examprep.techtreasuretrove.in`)
- Node.js 18+ and npm installed locally

## Deployment Steps

### Step 1: Prepare the Environment

1. Set up your environment variables in `.env` and `.env.production` files:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_STRIPE_PREMIUM_PRICE_ID=your_stripe_premium_price_id
VITE_TARGET_DOMAIN=app.examprep.techtreasuretrove.in
```

2. Update the landing page links to point to the app domain:

```bash
# Standard usage with default domain
./scripts/update-landing-links.sh

# Specify a custom domain
./scripts/update-landing-links.sh --domain=https://custom-app-domain.com

# Only create a backup without making changes
./scripts/update-landing-links.sh --backup-only
```

### Step 2: Build and Deploy the React App

1. Build the React app:

```bash
# Standard build - includes npm install --include=dev
npm run deploy-app

# Skip installing dependencies (if already installed)
npm run deploy-app -- --skip-dependencies
```

This will:
- Clean previous builds
- Install dependencies with `npm install --include=dev` (unless skipped)
- Compile TypeScript
- Build the app with Vite
- Copy assets and HTML with proper links to the app-dist directory
- Add WebAssembly support to the index.html CSP settings
- Create a server.js file for handling WebAssembly
- Create appropriate configuration files
- Output the build to `app-dist/`

2. Create a new App on DigitalOcean App Platform:
   - Select "Web Service" as the resource type
   - Connect your GitHub repository
   - Set the source directory to `app-dist`
   - Configure the domain as `app.examprep.techtreasuretrove.in`
   - Enable HTTPS
   - Make sure the "Run Command" is set to `node server.js`

3. Deploy the app:
   - Push your repository to GitHub, or
   - Upload the `app-dist` folder directly through the DigitalOcean console

### Step 3: Deploy the Landing Page

1. Build the landing page:

```bash
# Standard build without installing dependencies
npm run deploy-landing

# Include dependency installation
npm run deploy-landing -- --with-dependencies
```

This will:
- Create the landing page build
- Copy all necessary assets
- Generate appropriate configuration files
- Output the build to `landing-dist/`

2. Create another App on DigitalOcean App Platform:
   - Select "Static Site" as the resource type (not Web Service!)
   - Connect your GitHub repository
   - Set the source directory to `landing-dist`
   - Configure the domain as `examprep.techtreasuretrove.in` (your main domain)
   - Enable HTTPS

3. Deploy the landing page:
   - Push your repository to GitHub, or
   - Upload the `landing-dist` folder directly through the DigitalOcean console

### Step 4: Verify the Deployment

1. Test the landing page at your main domain (`examprep.techtreasuretrove.in`)
2. Test the app at your subdomain (`app.examprep.techtreasuretrove.in`)
3. Verify that links from the landing page to the app work correctly
4. Test WebAssembly functionality in the app
5. Confirm that login and authentication flows work properly

## Deployment Type Comparison

### App Deployment (app-dist/)
- **Type**: Web Service with Node.js
- **Key Files**: 
  - `server.js` - Express server for handling WebAssembly and routes
  - `Procfile` - Tells DigitalOcean to run `node server.js`
  - `index.html` - Main SPA entry point with proper asset links
  - `assets/` - JavaScript and CSS bundles (built by Vite)
- **CSP**: Includes `wasm-unsafe-eval` for WebAssembly support in both index.html and _headers

### Landing Page Deployment (landing-dist/)
- **Type**: Pure Static Site (no server)
- **Key Files**:
  - `index.html` - Main landing page
  - `js/`, `css/`, `images/` - Static assets
  - `_redirects` - For redirecting to the app domain
  - `_headers` - Security headers including CSP
- **No server.js required** - This is a completely static deployment

## Original Deployment Method

If you prefer to use the original deployment method that worked before the split, you can continue to use:

```bash
npm run do-build    # Builds the combined site with npm install --include=dev
npm run do-deploy   # Deploys the combined site
```

These commands preserve the previously working build process for DigitalOcean.

## Script Options and Flags

### Update Landing Links Script

```
./scripts/update-landing-links.sh [options]
```

Options:
- `--domain=URL`: Specify a custom app domain (default: https://app.examprep.techtreasuretrove.in)
- `--backup-only`: Only create a backup of the landing page HTML without making changes

### App Deployment Script

```
./scripts/app-deploy.sh [options]
```

Options:
- `--skip-dependencies`: Skips the npm install step, useful when dependencies are already installed

### Landing Page Deployment Script

```
./scripts/landing-page-deploy.sh [options]
```

Options:
- `--with-dependencies`: Installs dependencies using npm install --include=dev before building

## Configuration Details

### Content Security Policy

The app has a specific CSP configuration with WebAssembly support:

```
Content-Security-Policy: script-src-attr 'unsafe-inline'; default-src 'self' https://*.supabase.co https://openrouter.ai https://api.deepseek.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes' 'wasm-unsafe-eval' https://kit.fontawesome.com https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.deepseek.com https://api.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com
```

The landing page has a simpler CSP:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://kit.fontawesome.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'
```

### Redirects

The landing page includes the following redirects:

```
/login  https://app.examprep.techtreasuretrove.in/login  301
/app/*  https://app.examprep.techtreasuretrove.in/:splat  301
/app    https://app.examprep.techtreasuretrove.in  301
```

## Troubleshooting

### Empty Page / CSP Issues

If you see an empty page, check the browser console for CSP errors:

1. For WebAssembly issues, ensure the app's CSP includes `'wasm-unsafe-eval'` in both:
   - The CSP meta tag in index.html
   - The _headers file
2. For inline script issues, ensure appropriate `unsafe-inline` directives
3. For external resource issues, add the domains to the CSP directives

### Missing CSS/JS

If your app loads but appears unstyled or non-functional:

1. Check if the index.html includes proper links to CSS and JS files
2. Verify assets were successfully copied to app-dist/assets directory
3. Check browser console for 404 errors on asset loading
4. Make sure server.js is properly serving static assets from the assets directory

### Dependency Issues on DigitalOcean

If you encounter dependency-related errors during deployment on DigitalOcean:

1. Make sure the build script includes `npm install --include=dev`
2. Try deploying with the `--with-dependencies` flag for the landing page script
3. Verify that all necessary dependencies are in package.json

### Routing Problems

If routes aren't working correctly:

1. Verify the `_redirects` file is properly deployed
2. Check that SPA routing is configured with the fallback rule: `/* /index.html 200`
3. Ensure domain configuration is correct in both DigitalOcean apps

### Wrong Deployment Type

If you're having issues with deployment:

1. Double-check that the app is deployed as a **Web Service** with `node server.js` as the run command
2. Make sure the landing page is deployed as a **Static Site** (no run command needed)
3. Verify the Procfile exists in the app-dist/ directory and contains `web: node server.js`

### Asset Loading Issues

If assets aren't loading:

1. Check network requests in the browser console
2. Verify paths are correct in the HTML
3. Ensure CORS headers are properly set

## Maintenance and Updates

### Updating the App Only

```bash
npm run deploy-app
# Deploy app-dist/ to DigitalOcean as a Web Service
```

### Updating the Landing Page Only

```bash
npm run deploy-landing
# Deploy landing-dist/ to DigitalOcean as a Static Site
```

### Updating Both Components

```bash
npm run deploy-app
npm run deploy-landing
# Deploy both directories to their respective DigitalOcean apps
``` 