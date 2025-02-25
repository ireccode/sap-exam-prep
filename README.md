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

### 🔐 Authentication & User Management
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
- Docker (Containerization)

### APIs & Integrations
- Supabase API
- Stripe API
- OpenRouter API (AI Chat)

## Installation

### Prerequisites
- Node.js 20 or higher
- Docker and Docker Compose
- Supabase account
- Stripe account

### Local Development Setup
1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd sap-exam-prep
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   VITE_STRIPE_PREMIUM_PRICE_ID=your_price_id
   VITE_OPENROUTER_API_KEY=your_openrouter_key
   VITE_PREMIUM_ENCRYPTION_KEY=your_encryption_key
   VITE_WEBHOOK_SECRET=your_webhook_secret
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Docker Production Deployment
1. Build and start the container:
   ```bash
   docker-compose up --build
   ```

2. Access the application at `http://localhost:5175`

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