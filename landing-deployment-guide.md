# Landing Page Deployment Guide for DigitalOcean

This guide provides detailed steps for deploying the marketing landing page to DigitalOcean App Platform as a Static Site.

## Prerequisites

- DigitalOcean account
- Landing page build completed using `npm run deploy-landing`
- Main domain for the landing page (e.g., `examprep.techtreasuretrove.in`)

## Deployment Steps

### Step 1: Build the Landing Page

First, build the landing page using the deployment script:

```bash
# Standard build (without installing dependencies)
npm run deploy-landing

# If you need to install dependencies first
npm run deploy-landing -- --with-dependencies
```

This creates the `landing-dist/` directory with all necessary files, including:
- HTML, CSS, and JavaScript files
- Images and other assets
- Configuration files (`_redirects`, `_headers`, etc.)

### Step 2: Create a New App on DigitalOcean

1. Log in to your DigitalOcean account
2. Go to the App Platform section
3. Click "Create App" or "Create Resource" → "Apps"
4. Select your GitHub repository or upload the `landing-dist/` directory
5. Choose the branch to deploy from (if using GitHub)

### Step 3: Configure the App

#### Source Directory Configuration
- Source Directory: `landing-dist/`
- (if self-uploading) Upload the contents of your `landing-dist/` directory

#### Important: Resource Type Selection
- Select "Static Site" (NOT "Web Service")
- This ensures the site is deployed as a simple static site without server execution

#### Environment Configuration
- Plan: Choose appropriate size (Basic is usually sufficient for static sites)
- Region: Select closest to your users

#### Domain Configuration
- Enable custom domain
- Add your main domain: `examprep.techtreasuretrove.in`
- Enable HTTPS

### Step 4: Advanced Options

#### Build Command
- This should be left blank for pre-built static sites
- No build command is needed as we've already built the site locally

#### Output Directory
- Leave as default, or set to `.` (current directory)

#### Auto-Deploy
- Enable if using GitHub integration
- No build command is needed since we're uploading pre-built files

### Step 5: Deploy

- Review all settings
- Click "Create Resources" or "Deploy to App Platform"
- Wait for the deployment to complete

## Verification Steps

1. Check deployment logs
2. Visit your domain and verify the landing page loads correctly
3. Test the links to the app subdomain
4. Verify images and assets are loading properly
5. Check responsive design on different devices

## Troubleshooting

### Landing Page Not Loading
- Verify all files were uploaded correctly
- Check if index.html is in the root of landing-dist/
- Confirm the site was deployed as a "Static Site"

### Links to App Not Working
- Check that _redirects file was included in the build
- Verify the app domain in the redirects matches your actual app domain
- Test local redirects before deploying

### Asset Loading Issues
- Check browser console for 404 errors
- Verify relative paths in HTML/CSS files
- Make sure image files were included in the build

## Redeployment

To redeploy after making changes:
1. Update the landing page links if needed: `./scripts/update-landing-links.sh`
2. Run the build script again: `npm run deploy-landing`
3. Either:
   - Push changes to GitHub (if auto-deploy is enabled)
   - Manually upload the new `landing-dist/` directory
   - Use DigitalOcean CLI to deploy

Remember that this landing page must be deployed as a **Static Site** without any server execution, as it's purely static HTML/CSS/JS content. 