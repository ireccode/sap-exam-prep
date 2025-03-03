# SAP Architect Exam Prep Application

A modern web application designed to help users prepare for SAP Architect certification exams. Built with React, Vite, and Supabase, featuring premium content and subscription-based access.

## Features

### 🎯 Core Features
- **Question Bank**: Comprehensive collection of practice questions
- **Training Mode**: Practice questions by category with detailed explanations
- **Mini Exam**: Timed exam simulations
- **Progress Tracking**: Monitor your learning progress
- **AI Chat Support**: Get help from AI-powered assistant

### 💎 Premium Features
- Advanced practice questions
- Detailed analytics
- Priority support
- Custom study plans
- Mock exams
- Encrypted premium content

### 🔐 Security Features
- AES-256-GCM encryption for both basic and premium content
- Secure key derivation using PBKDF2
- Environment-based encryption key management
- Separate encryption keys for basic and premium content
- Web Crypto API for client-side encryption/decryption

### 🔑 Authentication & User Management
- Secure user authentication via Supabase
- User profile management
- Subscription management through Stripe
- Premium content access control

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand (State Management)

### Backend & Services
- Supabase (Database & Authentication)
- Stripe (Payment Processing)
- Nginx (Production Server)

## Development

### Prerequisites
```bash
# Required environment variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_STRIPE_PREMIUM_PRICE_ID=your_price_id
VITE_BASIC_ENCRYPTION_KEY=your_basic_key
VITE_PREMIUM_ENCRYPTION_KEY=your_premium_key
```

### Setup
```bash
# Install dependencies
npm install

# Encrypt content
npm run encrypt-basic    # Encrypt basic content
npm run encrypt-premium  # Encrypt premium content

# Development
npm run dev

# Production build
npm run build
npm run preview  # Preview production build locally
```

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up --build
```

## Testing
```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Project Structure
```
sap-exam-prep/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utility functions
│   ├── pages/         # Page components
│   ├── services/      # Service integrations
│   ├── store/         # Zustand stores
│   └── types/         # TypeScript types
├── public/            # Static assets
├── supabase/         # Supabase migrations
└── docker/           # Docker configuration
```

## Database Schema

### Core Tables
- `profiles`: User profiles and preferences
- `customer_subscriptions`: Subscription information
- `customers`: Stripe customer mapping
- `billing_history`: Payment records

## Security Features
- Encrypted premium content
- Secure authentication
- Row Level Security (RLS) in Supabase
- HTTPS enforcement
- XSS protection
- Content Security Policy

## Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run test`: Run tests
- `npm run encrypt-premium`: Encrypt premium content

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is released under a dual license:

### Application Code License (MIT License)

The application source code (excluding question bank content) is licensed under the MIT License:

```
MIT License

Copyright (c) 2024 SAP Architect Exam Prep

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), excluding
the question bank content, to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom
the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Question Bank Content License (Proprietary)

The question bank content, including but not limited to:
- All questions and answers
- Explanations and solutions
- Premium content
- Study materials and guides

is proprietary and confidential. All rights reserved. No part of the question bank content may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the copyright holder.

## Support
For support, please contact ireknie00@gmail.com

## Deployment

### 🐳 Docker Deployment
- Built with Docker for easy deployment and testing
- Supports both production and development environments
- Available ports:
  - Port 80: Production environment
  - Port 5173: Development environment (for Stripe testing)

### 🚀 Quick Start with Docker
1. Clone the repository
2. Create a `.env` file with required environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   VITE_STRIPE_PREMIUM_PRICE_ID=your_premium_price_id
   VITE_BASIC_ENCRYPTION_KEY=your_basic_key
   VITE_PREMIUM_ENCRYPTION_KEY=your_premium_key
   VITE_WEBHOOK_SECRET=your_webhook_secret
   ```
3. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```
4. Access the application:
   - Production: http://localhost:80
   - Development/Stripe Testing: http://localhost:5173

### 🔧 Development Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Run Stripe webhook listener:
   ```bash
   stripe listen --forward-to https://[SUPABASE_URL]/functions/v1/webhook-handler
   ```

### 📦 Build and Preview
1. Create production build:
   ```bash
   npm run build
   ```
2. Preview production build:
   ```bash
   npm run preview
   ```

### 🧪 Testing
```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```