import { Component } from 'react';

/**
 * ErrorBoundary — catches JavaScript errors in child components
 * and displays them instead of a white screen.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-red-100 border border-red-300 rounded-xl p-6 max-w-2xl shadow-lg">
            <h2 className="text-red-800 font-bold text-lg mb-2">Application Error</h2>
            <p className="text-red-700 text-sm mb-3">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.errorInfo?.componentStack && (
              <div className="mt-4">
                <pre className="text-xs text-red-600 bg-red-200 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
