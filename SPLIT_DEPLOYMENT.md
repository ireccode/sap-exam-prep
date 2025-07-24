# Split Deployment Strategy

This document outlines the proper approach for deploying the SAPArchitectPrep application as two separate sites on DigitalOcean App Platform.

## Overview

We need to deploy two separate components:

1. **Marketing Landing Page (Root Domain)**  
   - Deployed to: `https://saparchitectprep.com`
   - Contains: Marketing content, feature information, signup/login links

2. **React SPA (Subdomain)**  
   - Deployed to: `https://www.saparchitectprep.com`
   - Contains: Application functionality, dashboard, exams, AI chat

## Why Split Deployment?

- **Separate Concerns**: Marketing site has different update cycles than the app
- **Performance**: Landing page can be optimized separately from the app
- **WebAssembly Support**: App needs specific CSP settings for WebAssembly
- **Routing Simplicity**: No need to manage complex routing rules between marketing and app
- **Scalability**: Each part can be scaled independently

## Prerequisites

1. DigitalOcean account with App Platform access
2. Domain name configured with DigitalOcean DNS
3. Two build outputs:
   - `landing-page-dist/` for the marketing site
   - `app-dist/` for the React SPA

## Deployment Steps

### 1. Build Both Components

Run the following command to build both components:

```bash
npm run deploy-all
```

This will:
- Build the landing page with proper links to the app subdomain
- Build the React SPA optimized for static site deployment

### 2. Deploy the Landing Page

1. Create a new **Static Site** on DigitalOcean App Platform
2. Deploy from your repository or upload the `landing-page-dist/` directory
3. Configure the domain as `saparchitectprep.com`
4. Set the build command to:
   ```
   npm run deploy-landing
   ```
5. Set the output directory to:
   ```
   landing-page-dist
   ```

### 3. Deploy the React SPA

1. Create a new **Static Site** on DigitalOcean App Platform
2. Deploy from your repository or upload the `app-dist/` directory
3. Configure the domain as `www.saparchitectprep.com`
4. Set the build command to:
   ```
   npm run deploy-app
   ```
5. Set the output directory to:
   ```
   app-dist
   ```

## Verification

1. Visit `https://www.saparchitectprep.com` - Should show the marketing landing page
2. Visit `https://www.saparchitectprep.com` - Should show the React app login page
3. Check links on landing page - They should point to `www.saparchitectprep.com`
4. Verify WebAssembly functionality on the app subdomain

## Troubleshooting

### WebAssembly Not Working
If WebAssembly isn't working, verify the CSP settings in `app-dist/index.html` include:
```
'wasm-unsafe-eval'
```

### Landing Page Links Not Redirecting to App
Run the landing page deployment script again with the correct app domain:
```
./scripts/landing-page-deploy.sh https://www.saparchitectprep.com
```

### React App Routes Not Working
Ensure you're using `<Router>` (not `<Router basename="/app">`) in `App.tsx`.

## Updating the Deployment

### Landing Page Updates
1. Make changes to the `/website` directory
2. Run `npm run deploy-landing`
3. Deploy the updated `landing-page-dist/` directory

### App Updates
1. Make changes to the React app code
2. Run `npm run deploy-app`
3. Deploy the updated `app-dist/` directory 