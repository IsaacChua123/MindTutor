import React from 'react';

/**
 * Enhanced Error Boundary with AI-powered error analysis and recovery
 */
class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isAnalyzing: false,
      analysis: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('🚨 Enhanced Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
      isAnalyzing: true
    });

    // Analyze error with AI
    this.analyzeError(error, errorInfo);

    // Report error to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  analyzeError = async (error, errorInfo) => {
    try {
      // Simulate AI-powered error analysis
      const analysis = await this.performErrorAnalysis(error, errorInfo);

      this.setState({
        isAnalyzing: false,
        analysis
      });

      // Track error in performance monitoring
      if (window.performanceMonitor) {
        window.performanceMonitor.trackAIOperation('errorAnalysis', {
          errorId: this.state.errorId,
          errorType: error.name,
          componentStack: errorInfo.componentStack,
          analysis: analysis.category
        });
      }
    } catch (analysisError) {
      console.error('Error analysis failed:', analysisError);
      this.setState({
        isAnalyzing: false,
        analysis: {
          category: 'unknown',
          severity: 'high',
          suggestion: 'Please refresh the page and try again.'
        }
      });
    }
  };

  performErrorAnalysis = async (error, errorInfo) => {
    // AI-powered error categorization and suggestions
    const errorMessage = error.message.toLowerCase();
    const stackTrace = errorInfo.componentStack.toLowerCase();

    // Categorize error type
    let category = 'unknown';
    let severity = 'medium';
    let suggestion = 'Please try refreshing the page.';

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      category = 'network';
      severity = 'medium';
      suggestion = 'Check your internet connection and try again.';
    } else if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      category = 'memory';
      severity = 'high';
      suggestion = 'Try closing other tabs and refresh the page.';
    } else if (errorMessage.includes('chunk') || errorMessage.includes('loading')) {
      category = 'loading';
      severity = 'medium';
      suggestion = 'The app is updating. Please wait or refresh the page.';
    } else if (stackTrace.includes('tesseract') || stackTrace.includes('ocr')) {
      category = 'ocr_processing';
      severity = 'low';
      suggestion = 'OCR processing failed. Try uploading a clearer image.';
    } else if (stackTrace.includes('pdf') || stackTrace.includes('document')) {
      category = 'document_processing';
      severity = 'low';
      suggestion = 'Document processing failed. Try uploading a different file.';
    } else if (error.name === 'TypeError') {
      category = 'type_error';
      severity = 'high';
      suggestion = 'A programming error occurred. Please refresh the page.';
    } else if (error.name === 'ReferenceError') {
      category = 'reference_error';
      severity = 'high';
      suggestion = 'A critical component failed to load. Please refresh the page.';
    }

    // Add recovery actions based on error type
    const recoveryActions = this.getRecoveryActions(category);

    return {
      category,
      severity,
      suggestion,
      recoveryActions,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  };

  getRecoveryActions = (category) => {
    const actions = {
      network: [
        { label: 'Retry Connection', action: 'retry' },
        { label: 'Check Network', action: 'checkNetwork' },
        { label: 'Go Offline', action: 'offlineMode' }
      ],
      memory: [
        { label: 'Clear Cache', action: 'clearCache' },
        { label: 'Refresh Page', action: 'refresh' },
        { label: 'Close Other Tabs', action: 'closeTabs' }
      ],
      loading: [
        { label: 'Wait & Retry', action: 'waitRetry' },
        { label: 'Refresh Page', action: 'refresh' },
        { label: 'Clear Cache', action: 'clearCache' }
      ],
      ocr_processing: [
        { label: 'Try Different Image', action: 'retryUpload' },
        { label: 'Use Text File', action: 'useTextFile' },
        { label: 'Skip OCR', action: 'skipOCR' }
      ],
      document_processing: [
        { label: 'Try Different File', action: 'retryUpload' },
        { label: 'Convert to PDF', action: 'convertPDF' },
        { label: 'Use Text Input', action: 'useTextInput' }
      ],
      default: [
        { label: 'Refresh Page', action: 'refresh' },
        { label: 'Clear Cache', action: 'clearCache' },
        { label: 'Report Issue', action: 'report' }
      ]
    };

    return actions[category] || actions.default;
  };

  reportError = async (error, errorInfo) => {
    // In a real application, this would send to an error reporting service
    const errorReport = {
      id: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      performance: this.getPerformanceSnapshot()
    };

    // Store in localStorage for debugging (in production, send to server)
    try {
      const existingReports = JSON.parse(localStorage.getItem('errorReports') || '[]');
      existingReports.push(errorReport);
      // Keep only last 10 reports
      if (existingReports.length > 10) {
        existingReports.shift();
      }
      localStorage.setItem('errorReports', JSON.stringify(existingReports));
    } catch (storageError) {
      console.warn('Could not store error report:', storageError);
    }

    console.log('📊 Error report generated:', errorReport);
  };

  getPerformanceSnapshot = () => {
    if (!window.performance || !window.performance.memory) {
      return null;
    }

    return {
      memory: {
        used: window.performance.memory.usedJSHeapSize,
        total: window.performance.memory.totalJSHeapSize,
        limit: window.performance.memory.jsHeapSizeLimit,
        usagePercent: (window.performance.memory.usedJSHeapSize / window.performance.memory.jsHeapSizeLimit * 100).toFixed(2)
      },
      timing: window.performance.timing ? {
        loadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
        domReady: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart
      } : null
    };
  };

  handleRecoveryAction = (action) => {
    switch (action) {
      case 'refresh':
        window.location.reload();
        break;
      case 'clearCache':
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        localStorage.clear();
        sessionStorage.clear();
        setTimeout(() => window.location.reload(), 1000);
        break;
      case 'retry':
        this.setState(prevState => ({
          retryCount: prevState.retryCount + 1,
          hasError: false,
          error: null,
          errorInfo: null
        }));
        break;
      case 'checkNetwork':
        window.open('https://www.google.com', '_blank');
        break;
      case 'offlineMode':
        // Enable offline mode if available
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          // Service worker will handle offline mode
          console.log('Offline mode activated');
        }
        break;
      case 'closeTabs':
        alert('Please close other browser tabs to free up memory, then refresh this page.');
        break;
      case 'waitRetry':
        setTimeout(() => {
          this.setState({
            hasError: false,
            error: null,
            errorInfo: null
          });
        }, 5000);
        break;
      case 'retryUpload':
      case 'useTextFile':
      case 'skipOCR':
      case 'convertPDF':
      case 'useTextInput':
        // These would be handled by the parent component
        if (this.props.onRecoveryAction) {
          this.props.onRecoveryAction(action);
        }
        break;
      case 'report':
        const errorReport = {
          errorId: this.state.errorId,
          analysis: this.state.analysis,
          timestamp: new Date().toISOString()
        };
        console.log('Error report for user:', errorReport);
        alert('Error details have been logged. Please contact support with the error ID: ' + this.state.errorId);
        break;
      default:
        console.warn('Unknown recovery action:', action);
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, analysis, isAnalyzing, retryCount } = this.state;
      const { fallback: Fallback } = this.props;

      // Use custom fallback if provided
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorInfo={errorInfo}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            retryCount={retryCount}
            onRecoveryAction={this.handleRecoveryAction}
          />
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mx-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🚨</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                We encountered an unexpected error. Our AI is analyzing the issue...
              </p>
            </div>

            {isAnalyzing ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing error...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${
                  analysis.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  analysis.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  <h3 className="font-semibold mb-1">
                    {analysis.category.replace('_', ' ').toUpperCase()} Error
                  </h3>
                  <p className="text-sm">{analysis.suggestion}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Recovery Options:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {analysis.recoveryActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => this.handleRecoveryAction(action.action)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-3">
                  <p>Error ID: {this.state.errorId}</p>
                  <p>Retry attempts: {retryCount}</p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  Technical Details
                </summary>
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                  <p className="text-red-600 dark:text-red-400 mb-1">{error?.name}: {error?.message}</p>
                  <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {error?.stack?.substring(0, 500)}...
                  </pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;