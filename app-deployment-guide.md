# App Deployment Guide for DigitalOcean

This guide provides detailed steps for deploying the React SPA (app component) to DigitalOcean App Platform as a Web Service.

## Prerequisites

- DigitalOcean account
- App build completed using `npm run deploy-app`
- Domain/subdomain for the app (e.g., `app.examprep.techtreasuretrove.in`)

## Deployment Steps

### Step 1: Build the App

First, build the app using the deployment script:

```bash
# Standard build
npm run deploy-app

# If dependencies are already installed
npm run deploy-app -- --skip-dependencies
```

This creates the `app-dist/` directory with all necessary files, including:
- `server.js` - Node.js/Express server with WebAssembly support
- `Procfile` - Tells DigitalOcean to run `node server.js`
- `index.html` - With proper CSS and JS links and WebAssembly CSP support
- Assets, HTML, and configuration files

The `app-deploy.sh` script now ensures that:
1. All files from the Vite build are properly copied to app-dist/
2. The index.html file includes all necessary CSS and JS links
3. WebAssembly support is added to the CSP settings in index.html
4. The server.js file is configured to serve all assets correctly

### Step 2: Create a New App on DigitalOcean

1. Log in to your DigitalOcean account
2. Go to the App Platform section
3. Click "Create App" or "Create Resource" → "Apps"
4. Select your GitHub repository or upload the `app-dist/` directory
5. Choose the branch to deploy from (if using GitHub)

### Step 3: Configure the App

#### Source Directory Configuration
- Source Directory: `app-dist/`
- (if self-uploading) Upload the contents of your `app-dist/` directory

#### Important: Resource Type Selection
- Select "Web Service" (NOT "Static Site")
- This ensures that `server.js` will be executed

#### Environment Configuration
- Plan: Choose appropriate size (Basic or Pro)
- Region: Select closest to your users
- Environment Variables: Add any required environment variables

#### Run Command Configuration
- Make sure the Run Command is set to: `node server.js`
- Check that HTTP Port is set to: `8080` (or matches your server.js PORT)

#### Domain Configuration
- Enable custom domain
- Add your subdomain: `app.examprep.techtreasuretrove.in`
- Enable HTTPS

### Step 4: Advanced Options

#### Health Checks
- HTTP Path: `/health`
- Configure as needed for your application

#### Auto-Deploy
- Enable if using GitHub integration
- Configure build command if needed

### Step 5: Deploy

- Review all settings
- Click "Create Resources" or "Deploy to App Platform"
- Wait for the deployment to complete

## Verification Steps

1. Check deployment logs for any errors
2. Visit your app URL and verify it loads correctly
3. Test WebAssembly functionality
4. Check if redirects and routing work correctly
5. Verify API connections

## Troubleshooting

### App Shows "Not Found" or 404
- Check if `server.js` is in the correct location
- Verify the Procfile contains `web: node server.js`
- Make sure you selected "Web Service" not "Static Site"

### WebAssembly Not Working
- Check browser console for CSP errors
- Verify the CSP headers include `'wasm-unsafe-eval'` in both:
  - The CSP meta tag in index.html
  - The _headers file
- Test locally with the same configuration

### CSS/JS Not Loading
- Inspect the index.html file to ensure it has the correct asset links
- Check if assets were copied to the app-dist/assets directory
- Verify server.js has the correct static file serving configuration:
  ```javascript
  app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    etag: true,
    lastModified: true,
    maxAge: '1w'
  }));
  ```

### Server Not Starting
- Check the deployment logs for errors
- Verify the run command is set to `node server.js`
- Make sure all dependencies are included in package.json

## Redeployment

To redeploy after making changes:
1. Run the build script again: `npm run deploy-app`
2. Either:
   - Push changes to GitHub (if auto-deploy is enabled)
   - Manually upload the new `app-dist/` directory
   - Use DigitalOcean CLI to deploy

Remember that this app must be deployed as a **Web Service** that runs `server.js`, not as a static site, to ensure proper WebAssembly support. 