import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ERROR BOUNDARY CAUGHT AN ERROR:', error);
    console.error('Error stack:', error.stack);
    console.error('Error info:', errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="max-w-2xl w-full bg-gray-900 border-4 border-red-500 rounded-lg shadow-xl p-8 text-center">
            <div className="text-8xl mb-4">🚨 ERROR 🚨</div>
            <h2 className="text-4xl font-bold text-red-400 mb-4">
              COMPONENT CRASHED!
            </h2>
            <p className="text-red-300 mb-6 text-lg">
              The lesson page encountered an error and crashed. This is likely
              due to corrupted data in your imported lesson.
            </p>
            <p className="text-red-300 mb-6">
              Try refreshing the page or re-importing your lesson with cleaner
              content.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors text-lg font-bold"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors text-lg font-bold"
              >
                🔄 Refresh Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
