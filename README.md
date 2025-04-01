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

## Application Structure

The application is structured as:

1. **Static Landing Page**: 
   - Served at the root route (`/`)
   - Marketing content, features, pricing, etc.
   - Directs users to the React application via login

2. **React Application**:
   - Served at `/app` route
   - Protected routes requiring authentication
   - Main application features (training, exams, AI chat)

### URL Structure
- `https://www.saparchitectprep.com/` - Static landing page
- `https://www.saparchitectprep.com/login` - Login page (redirects to React app)

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
- Express.js (Server)

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
npm run start  # Start the Express server
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
├── src/                # React application source
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utility functions
│   ├── pages/          # Page components
│   ├── services/       # Service integrations
│   ├── store/          # Zustand stores
│   └── types/          # TypeScript types
├── website/            # Static landing page
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   ├── images/         # Images
│   └── index.html      # Main HTML file
├── public/             # Static assets for React app
└── server.js           # Express server for both static site and React app
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
- `npm run start`: Start production server
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
2. Create a `.env.production` file with required environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   VITE_STRIPE_PREMIUM_PRICE_ID=your_premium_price_id
   VITE_BASIC_ENCRYPTION_KEY=your_basic_key
   VITE_PREMIUM_ENCRYPTION_KEY=your_premium_key
   VITE_WEBHOOK_SECRET=your_webhook_secret
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key
   ```
   You can use the provided `.env.production.template` file as a starting point.
3. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```
4. Access the application:
   - Static Landing Page: http://localhost/
   - React Application: http://localhost/app
   - Development/Stripe Testing: http://localhost:5173

### 🔧 Development Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with the same environment variables as in `.env.production`
3. Start development server:
   ```bash
   npm run dev
   ```
4. Run Stripe webhook listener:
   ```bash
   stripe listen --forward-to https://[SUPABASE_URL]/functions/v1/webhook-handler
   ```

### 📦 Build and Preview
1. Create production build:
   ```bash
   npm run build
   ```
2. Start the Express server:
   ```bash
   npm run start
   ```

## AI Model Configuration

The application uses a consolidated configuration system for AI models, ensuring consistency between frontend and backend:

- Primary configuration in `src/services/aiConfig.ts`
- Mirrored in `supabase/functions/chat/config.ts` for the backend
- Re-exported from `src/lib/aiConfig.ts` for backward compatibility

#### Setting Up AI Models

1. Configure your environment variables in `.env`:
   ```
   # Primary OpenAI API key
   VITE_OPENAI_API_KEY=your_openai_key

   # DeepSeek fallback API key
   VITE_DEFAULT_OPENAI_KEY=your_deepseek_key
   
   # Optional: Override model IDs
   VITE_LLM01=meta-llama/llama-3.2-11b-vision-instruct:free
   VITE_LLM02=mistralai/mistral-7b-instruct
   VITE_LLM03=openai/gpt-3.5-turbo
   ```

2. The system automatically handles model selection and fallback:
   - If the primary model fails, it switches to DeepSeek
   - A notification appears when fallback is activated

#### Testing the Fallback Mechanism

You can directly use the DeepSeek fallback model to test without relying on actual model failures:

1. **DeepSeek Test Option**: Select "DeepSeek (Direct Fallback Test)" from the model dropdown
2. **Direct Access Button**: Click "Use DeepSeek Directly" 
3. **Environment Variable**: Set `VITE_LLM03=fallbackllm` to make GPT-3.5 automatically use DeepSeek

This configuration ensures consistent model behavior between frontend and backend components.