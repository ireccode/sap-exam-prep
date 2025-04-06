# Cloudflare Email Worker Deployment Guide

This document outlines the steps to deploy the contact form Email Worker to Cloudflare Workers.

## Prerequisites

1. A Cloudflare account with the domain `saparchitectprep.com` configured
2. Email Routing enabled for `support@saparchitectprep.com`
3. Wrangler CLI installed

## Installation

1. Install Wrangler CLI if you haven't already:

```bash
npm install -g wrangler
```

2. Log in to your Cloudflare account with Wrangler:

```bash
wrangler login
```

## Configuration

The `wrangler.toml` file contains all necessary configuration:

- `name`: The name of your worker (email-worker)
- `main`: Entry point TypeScript file
- `compatibility_date`: Date for compatibility features
- `send_email`: Configuration for Email Workers
- `site`: Configuration for static assets (if needed)

## Deployment

1. Navigate to the Cloudflare directory:

```bash
cd cloudflare
```

2. Deploy the worker:

```bash
wrangler deploy
```

3. After successful deployment, you should receive a URL like:
   `https://email-worker.<your-worker-subdomain>.workers.dev`

4. Set up custom domain mapping:

   a. Go to your Cloudflare dashboard
   b. Navigate to Workers & Pages
   c. Select your "email-worker" worker
   d. Go to Triggers > Custom Domains
   e. Add custom domain: `email-worker.saparchitectprep.com`

## Email Workers Configuration

To complete the Email Workers setup in Cloudflare:

1. Navigate to your Cloudflare dashboard
2. Go to Email > Email Routing
3. Enable Email Routing if not already enabled
4. Configure your domain's MX records (Cloudflare will provide instructions)
5. Go to Email Routing > Workers
6. Click "Create a Worker"
7. Select your "email-worker" in the dropdown
8. Set the destination email address to `support@saparchitectprep.com`
9. Ensure the domain is configured to receive emails at `noreply@saparchitectprep.com`

## Testing

Send a test request to your worker:

```bash
# Check if the worker is running
curl https://email-worker.saparchitectprep.com

# Send a test message
curl -X POST https://email-worker.saparchitectprep.com \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","subject":"Test Subject","message":"This is a test message"}'
```

## Troubleshooting

If you encounter any issues with the worker:

1. Check Cloudflare Workers logs in your dashboard
2. Ensure Email Routing is properly configured
3. Verify the domain has proper DNS settings
4. Check that the `destination_address` in `wrangler.toml` is correct
5. Test the worker using the GET endpoint to verify Email binding

## Security Considerations

- The worker implements CORS to only allow requests from your domain
- Input validation is performed on all submissions
- Error handling is implemented to avoid exposing sensitive information 