import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { validateServerEnv } from './lib/env';
import { ErrorBoundary } from './components/ErrorBoundary';

// Validate environment variables before starting the app
try {
  validateServerEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
  throw error;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
