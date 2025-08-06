import { useEffect, useCallback } from 'react';
import { errorMonitor } from '@/utils/errorMonitor';

// Hook لتتبع الأحداث والأخطاء
export function useMonitoring() {
  // تسجيل حدث استخدام
  const logEvent = useCallback((event: string, data?: Record<string, any>) => {
    errorMonitor.logUsage(event, data);
  }, []);

  // تسجيل خطأ مخصص
  const logError = useCallback((message: string, context?: Record<string, any>) => {
    errorMonitor.logError({
      message,
      severity: 'medium',
      context
    });
  }, []);

  // تسجيل أداء مخصص
  const logPerformance = useCallback((metric: string, value: number) => {
    errorMonitor.logPerformance(metric, value);
  }, []);

  return {
    logEvent,
    logError,
    logPerformance
  };
}

// Hook للمراقبة التلقائية للمكونات
export function useComponentMonitoring(componentName: string) {
  const { logEvent, logError } = useMonitoring();

  useEffect(() => {
    // تسجيل تحميل المكون
    logEvent('component_mounted', { component: componentName });

    // تسجيل إلغاء تحميل المكون
    return () => {
      logEvent('component_unmounted', { component: componentName });
    };
  }, [componentName, logEvent]);

  // معالج الأخطاء للمكون
  const handleError = useCallback((error: Error, errorInfo?: any) => {
    logError(`Error in ${componentName}: ${error.message}`, {
      component: componentName,
      stack: error.stack,
      errorInfo
    });
  }, [componentName, logError]);

  return {
    logEvent,
    logError,
    handleError
  };
}

// Hook لمراقبة الأداء التلقائي
export function usePerformanceMonitoring(operationName: string) {
  const { logPerformance } = useMonitoring();

  // بدء قياس الأداء
  const startMeasure = useCallback(() => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        logPerformance(operationName, duration);
        return duration;
      }
    };
  }, [operationName, logPerformance]);

  return { startMeasure };
}