'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-3">
                Oops! Something went wrong
              </h1>

              <p className="text-gray-400 mb-6">
                We encountered an unexpected error. Don't worry, your work is safe.
              </p>

              {this.state.error && (
                <details className="w-full mb-6 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400 mb-2">
                    Error details
                  </summary>
                  <pre className="text-xs text-red-400 bg-gray-900 p-4 rounded-lg overflow-x-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 py-3 px-6 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 py-3 px-6 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline error message component
export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-400 text-sm">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
