import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { handleRouteFallback } from '@/services/routeFallback';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  fallbackPath?: string;
}

/**
 * Component wrapper to apply route error boundary with hooks
 */
export const RouteErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <ErrorBoundaryImpl 
      navigate={navigate} 
      currentPath={location.pathname}
      children={children}
    />
  );
};

/**
 * Internal implementation of the error boundary
 */
class ErrorBoundaryImpl extends Component<
  ErrorBoundaryProps & { navigate: (path: string) => void; currentPath: string },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { navigate: (path: string) => void; currentPath: string }) {
    super(props);
    this.state = { 
      hasError: false 
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('Route error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Try to handle the fallback
    const { currentPath, navigate } = this.props;
    const fallbackAttempted = handleRouteFallback(currentPath, navigate);
    
    // If no fallback was attempted, set state to show error
    if (!fallbackAttempted) {
      this.setState({ 
        hasError: true, 
        error,
        fallbackPath: '/login' // Last resort fallback
      });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // If we have a fallback path, navigate to it
      if (this.state.fallbackPath) {
        return <Navigate to={this.state.fallbackPath} replace />;
      }
      
      // Otherwise, show error UI
      return (
        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <h2 className="text-red-800 font-bold mb-2">Navigation Error</h2>
          <p className="text-red-600 mb-4">
            {this.state.error?.message || "We're having trouble loading this page."}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => window.location.href = '/'}
            >
              Go to Homepage
            </button>
            <button
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 