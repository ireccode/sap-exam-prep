import React, { Component, ErrorInfo, ReactNode } from 'react';
import { EnvironmentError } from '@/services/aiService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.error instanceof EnvironmentError) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <h2 className="text-red-700 font-semibold">Configuration Error</h2>
            <p className="text-red-600">{this.state.error.message}</p>
          </div>
        );
      }

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-red-700 font-semibold">Something went wrong</h2>
          <p className="text-red-600">Please try again later</p>
        </div>
      );
    }

    return this.props.children;
  }
}