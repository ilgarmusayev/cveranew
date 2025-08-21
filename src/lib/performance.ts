// Performance measurement utilities
'use client';

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  type: 'navigation' | 'login' | 'api' | 'render';
}

class PerformanceTracker {
  private entries: Map<string, { startTime: number; type: string }> = new Map();

  // Start measuring performance
  startMeasurement(name: string, type: 'navigation' | 'login' | 'api' | 'render' = 'api') {
    if (typeof window === 'undefined') return;

    const startTime = performance.now();
    this.entries.set(name, { startTime, type });

    console.log(`🚀 Performance: ${name} başladı`);
  }

  // End measuring and return duration
  endMeasurement(name: string): number {
    if (typeof window === 'undefined') return 0;

    const entry = this.entries.get(name);
    if (!entry) {
      console.warn(`⚠️ Performance: ${name} ölçümü tapılmadı`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - entry.startTime;

    console.log(`✅ Performance: ${name} tamamlandı - ${duration.toFixed(2)}ms`);

    // Remove entry after measurement
    this.entries.delete(name);

    return duration;
  }

  // Get network connection speed
  getConnectionSpeed(): string {
    if (typeof window === 'undefined') return 'unknown';

    try {
      // Check if navigator.connection is available
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection;

      if (connection) {
        const downlink = connection.downlink; // Mbps
        const effectiveType = connection.effectiveType; // slow-2g, 2g, 3g, 4g

        if (downlink) {
          if (downlink >= 10) return 'fast';
          if (downlink >= 1.5) return 'medium';
          return 'slow';
        }

        if (effectiveType) {
          switch (effectiveType) {
            case '4g': return 'fast';
            case '3g': return 'medium';
            case '2g':
            case 'slow-2g': return 'slow';
            default: return 'medium';
          }
        }
      }

      // Fallback: measure actual performance
      return this.measureActualSpeed();
    } catch (error) {
      console.warn('Connection speed ölçülə bilmir:', error);
      return 'medium'; // Default fallback
    }
  }

  // Measure actual speed based on recent API calls
  private measureActualSpeed(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    try {
      // Get navigation timing for page load speed
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        // Fix: Use startTime instead of navigationStart for PerformanceNavigationTiming
        const totalTime = navigation.loadEventEnd - navigation.startTime;
        
        // Classify based on total load time
        if (totalTime < 1000) return 'fast';    // Under 1 second
        if (totalTime < 3000) return 'medium';  // 1-3 seconds
        return 'slow';                          // Over 3 seconds
      }
      
      return 'medium';
    } catch (error) {
      console.warn('Actual speed ölçülə bilmir:', error);
      return 'medium';
    }
  }

  // Get detailed performance metrics
  getPerformanceMetrics() {
    if (typeof window === 'undefined') return null;

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (!navigation) return null;

      return {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        total: navigation.loadEventEnd - navigation.startTime, // Fix: Use startTime instead of navigationStart
        speed: this.getConnectionSpeed()
      };
    } catch (error) {
      console.warn('Performance metrics alına bilmir:', error);
      return null;
    }
  }
}

// Create global instance
export const performanceTracker = new PerformanceTracker();

// Helper functions
export const startLoginMeasurement = () => {
  performanceTracker.startMeasurement('login-process', 'login');
};

export const endLoginMeasurement = () => {
  return performanceTracker.endMeasurement('login-process');
};

export const getConnectionSpeed = () => {
  return performanceTracker.getConnectionSpeed();
};

export const getPerformanceMetrics = () => {
  return performanceTracker.getPerformanceMetrics();
};
