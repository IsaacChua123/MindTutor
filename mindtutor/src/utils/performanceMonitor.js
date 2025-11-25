/**
 * Advanced Performance Monitoring System
 * Tracks application performance, memory usage, and user experience metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      navigation: [],
      paint: [],
      memory: [],
      network: [],
      ai: [],
      user: []
    };

    this.isMonitoring = false;
    this.observers = new Set();

    this.init();
  }

  init() {
    // Navigation timing
    if (performance.timing) {
      this.trackNavigationTiming();
    }

    // Paint timing (First Contentful Paint, Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      this.trackPaintTiming();
      this.trackMemoryUsage();
      this.trackNetworkRequests();
    }

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackVisibilityChange();
    });

    // User interaction tracking
    this.trackUserInteractions();
  }

  startMonitoring() {
    this.isMonitoring = true;
    console.log('🚀 Performance monitoring started');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('⏹️ Performance monitoring stopped');
  }

  subscribe(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  notifyObservers(metric, data) {
    this.observers.forEach(callback => {
      try {
        callback(metric, data);
      } catch (error) {
        console.error('Performance monitor observer error:', error);
      }
    });
  }

  trackNavigationTiming() {
    try {
      const timing = performance.timing;
      const navigation = performance.navigation;

      // Check if timing data is available and valid
      if (!timing || timing.navigationStart === 0) {
        console.warn('Navigation timing not available');
        return;
      }

      const metrics = {
        timestamp: Date.now(),
        type: 'navigation',
        dnsLookup: Math.max(0, timing.domainLookupEnd - timing.domainLookupStart),
        tcpConnect: Math.max(0, timing.connectEnd - timing.connectStart),
        serverResponse: Math.max(0, timing.responseStart - timing.requestStart),
        pageLoad: Math.max(0, timing.loadEventEnd - timing.navigationStart),
        domReady: Math.max(0, timing.domContentLoadedEventEnd - timing.navigationStart),
        firstByte: Math.max(0, timing.responseStart - timing.requestStart),
        domInteractive: Math.max(0, timing.domInteractive - timing.navigationStart),
        domComplete: Math.max(0, timing.domContentLoadedEventEnd - timing.domInteractive),
        redirectCount: navigation?.redirectCount || 0,
        type: navigation?.type === 0 ? 'navigate' : navigation?.type === 1 ? 'reload' : 'back_forward'
      };

      // Only add valid metrics
      if (metrics.pageLoad > 0 || metrics.domReady > 0) {
        this.metrics.navigation.push(metrics);
        this.notifyObservers('navigation', metrics);

        console.log('📊 Navigation Performance:', {
          'DNS Lookup': `${metrics.dnsLookup}ms`,
          'TCP Connect': `${metrics.tcpConnect}ms`,
          'Server Response': `${metrics.serverResponse}ms`,
          'Page Load': `${metrics.pageLoad}ms`,
          'DOM Ready': `${metrics.domReady}ms`
        });
      }
    } catch (error) {
      console.warn('Navigation timing tracking failed:', error);
    }
  }

  trackPaintTiming() {
    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const metric = {
          timestamp: Date.now(),
          type: 'fcp',
          name: entry.name,
          startTime: entry.startTime,
          value: entry.startTime
        };

        this.metrics.paint.push(metric);
        this.notifyObservers('paint', metric);

        console.log('🎨 First Contentful Paint:', `${entry.startTime.toFixed(2)}ms`);
      }
    });

    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('FCP tracking not supported:', error);
    }

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      const metric = {
        timestamp: Date.now(),
        type: 'lcp',
        element: lastEntry.element?.tagName,
        size: lastEntry.size,
        startTime: lastEntry.startTime,
        value: lastEntry.startTime
      };

      this.metrics.paint.push(metric);
      this.notifyObservers('paint', metric);

      console.log('🖼️ Largest Contentful Paint:', `${lastEntry.startTime.toFixed(2)}ms`);
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP tracking not supported:', error);
    }
  }

  trackMemoryUsage() {
    const memoryObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const metric = {
          timestamp: Date.now(),
          type: 'memory',
          usedJSHeapSize: entry.usedJSHeapSize,
          totalJSHeapSize: entry.totalJSHeapSize,
          jsHeapSizeLimit: entry.jsHeapSizeLimit,
          usagePercent: (entry.usedJSHeapSize / entry.jsHeapSizeLimit * 100).toFixed(2)
        };

        this.metrics.memory.push(metric);
        this.notifyObservers('memory', metric);

        if (parseFloat(metric.usagePercent) > 80) {
          console.warn('⚠️ High memory usage:', `${metric.usagePercent}%`);
        }
      }
    });

    try {
      memoryObserver.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('Memory tracking not supported:', error);
    }

    // Fallback memory tracking
    setInterval(() => {
      if (performance.memory) {
        const metric = {
          timestamp: Date.now(),
          type: 'memory-fallback',
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          usagePercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2)
        };

        this.metrics.memory.push(metric);
        this.notifyObservers('memory', metric);
      }
    }, 30000); // Every 30 seconds
  }

  trackNetworkRequests() {
    const networkObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          const metric = {
            timestamp: Date.now(),
            type: 'network',
            name: entry.name,
            duration: entry.duration,
            transferSize: entry.transferSize,
            decodedBodySize: entry.decodedBodySize,
            initiatorType: entry.initiatorType,
            nextHopProtocol: entry.nextHopProtocol
          };

          this.metrics.network.push(metric);
          this.notifyObservers('network', metric);

          if (entry.duration > 3000) {
            console.warn('🐌 Slow network request:', entry.name, `${entry.duration}ms`);
          }
        }
      }
    });

    try {
      networkObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Network tracking not supported:', error);
    }
  }

  trackUserInteractions() {
    let interactionCount = 0;
    const interactionObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        interactionCount++;
        const metric = {
          timestamp: Date.now(),
          type: 'interaction',
          interactionId: entry.interactionId,
          startTime: entry.startTime,
          processingStart: entry.processingStart,
          processingEnd: entry.processingEnd,
          duration: entry.duration,
          totalInteractions: interactionCount
        };

        this.metrics.user.push(metric);
        this.notifyObservers('interaction', metric);
      }
    });

    try {
      interactionObserver.observe({ entryTypes: ['event'] });
    } catch (error) {
      console.warn('Interaction tracking not supported:', error);
    }
  }

  trackVisibilityChange() {
    const metric = {
      timestamp: Date.now(),
      type: 'visibility',
      state: document.visibilityState,
      hidden: document.hidden
    };

    this.metrics.user.push(metric);
    this.notifyObservers('visibility', metric);
  }

  // AI-specific performance tracking
  trackAIOperation(operation, data) {
    const metric = {
      timestamp: Date.now(),
      type: 'ai',
      operation,
      ...data
    };

    this.metrics.ai.push(metric);
    this.notifyObservers('ai', metric);

    console.log(`🤖 AI Performance [${operation}]:`, data);
  }

  // Custom performance marks
  mark(name) {
    if (performance.mark) {
      performance.mark(name);
    }
  }

  measure(name, startMark, endMark) {
    if (performance.measure) {
      try {
        performance.measure(name, startMark, endMark);

        const measures = performance.getEntriesByName(name);
        const lastMeasure = measures[measures.length - 1];

        const metric = {
          timestamp: Date.now(),
          type: 'measure',
          name,
          duration: lastMeasure.duration,
          startTime: lastMeasure.startTime
        };

        this.notifyObservers('measure', metric);
        return lastMeasure.duration;
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    }
    return null;
  }

  // Performance report generation
  generateReport() {
    const report = {
      timestamp: Date.now(),
      summary: {
        navigationCount: this.metrics.navigation.length,
        paintEvents: this.metrics.paint.length,
        memoryChecks: this.metrics.memory.length,
        networkRequests: this.metrics.network.length,
        aiOperations: this.metrics.ai.length,
        userInteractions: this.metrics.user.length
      },
      averages: this.calculateAverages(),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  calculateAverages() {
    const averages = {};

    // Navigation averages
    if (this.metrics.navigation.length > 0) {
      const nav = this.metrics.navigation[this.metrics.navigation.length - 1];
      averages.navigation = {
        pageLoad: nav.pageLoad,
        domReady: nav.domReady,
        firstByte: nav.firstByte
      };
    }

    // Memory averages
    if (this.metrics.memory.length > 0) {
      const recentMemory = this.metrics.memory.slice(-10);
      averages.memory = {
        avgUsagePercent: recentMemory.reduce((sum, m) => sum + parseFloat(m.usagePercent), 0) / recentMemory.length,
        peakUsage: Math.max(...recentMemory.map(m => parseFloat(m.usagePercent)))
      };
    }

    // Network averages
    if (this.metrics.network.length > 0) {
      const recentNetwork = this.metrics.network.slice(-20);
      averages.network = {
        avgDuration: recentNetwork.reduce((sum, n) => sum + n.duration, 0) / recentNetwork.length,
        slowRequests: recentNetwork.filter(n => n.duration > 3000).length
      };
    }

    return averages;
  }

  generateRecommendations() {
    const recommendations = [];
    const averages = this.calculateAverages();

    if (averages.navigation?.pageLoad > 3000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Page load time is slow. Consider code splitting and lazy loading.',
        metric: 'pageLoad',
        value: averages.navigation.pageLoad
      });
    }

    if (averages.memory?.avgUsagePercent > 70) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'High memory usage detected. Consider implementing memory cleanup.',
        metric: 'memoryUsage',
        value: averages.memory.avgUsagePercent
      });
    }

    if (averages.network?.slowRequests > 5) {
      recommendations.push({
        type: 'network',
        priority: 'medium',
        message: 'Multiple slow network requests detected. Consider caching or CDN optimization.',
        metric: 'slowRequests',
        value: averages.network.slowRequests
      });
    }

    return recommendations;
  }

  // Cleanup old metrics
  cleanup(maxAge = 3600000) { // 1 hour default
    const cutoff = Date.now() - maxAge;

    Object.keys(this.metrics).forEach(category => {
      this.metrics[category] = this.metrics[category].filter(
        metric => metric.timestamp > cutoff
      );
    });
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Global performance tracking functions
export const trackAIOperation = (operation, data) => {
  performanceMonitor.trackAIOperation(operation, data);
};

export const startPerformanceMonitoring = () => {
  performanceMonitor.startMonitoring();
};

export const stopPerformanceMonitoring = () => {
  performanceMonitor.stopMonitoring();
};

export const getPerformanceReport = () => {
  return performanceMonitor.generateReport();
};

// Auto-start monitoring
if (typeof window !== 'undefined') {
  startPerformanceMonitoring();
}