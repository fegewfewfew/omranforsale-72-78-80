import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { performanceOptimizer } from '@/utils/performanceIntegrationOptimizer';
import { integrationCache, cacheKeys } from '@/utils/integrationCacheManager';
import { errorMonitor } from '@/utils/errorMonitor';

interface UsePerformantIntegrationOptions {
  enableCaching?: boolean;
  enableProfiling?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface PerformantIntegrationState {
  isLoading: boolean;
  isEnhancing: boolean;
  isRefreshing: boolean;
  integrationData: any;
  systemEvaluation: any[];
  integrationReport: any;
  smartLinkingResult: any;
  performanceMetrics: any;
  error: string | null;
  lastUpdated: number;
}

export function usePerformantIntegration(options: UsePerformantIntegrationOptions = {}) {
  const { toast } = useToast();
  const {
    enableCaching = true,
    enableProfiling = true,
    autoRefresh = false,
    refreshInterval = 300000 // 5 دقائق
  } = options;

  const [state, setState] = useState<PerformantIntegrationState>({
    isLoading: true,
    isEnhancing: false,
    isRefreshing: false,
    integrationData: null,
    systemEvaluation: [],
    integrationReport: null,
    smartLinkingResult: null,
    performanceMetrics: null,
    error: null,
    lastUpdated: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);

  // تحديث إعدادات المحسن
  useEffect(() => {
    performanceOptimizer.updateConfig({
      enableCaching,
      enableProfiling
    });
  }, [enableCaching, enableProfiling]);

  // تحميل البيانات مع التحسين
  const loadIntegrationData = useCallback(async (force = false) => {
    // تجنب التحميل المتكرر
    if (loadingPromiseRef.current && !force) {
      return loadingPromiseRef.current;
    }

    // إلغاء العملية السابقة
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const startTime = performance.now();

    setState(prev => ({ ...prev, isLoading: !force, isRefreshing: force, error: null }));

    const loadPromise = (async () => {
      try {
        // تحميل البيانات بالتوازي مع التحسين
        const [integrationData, performanceMetrics] = await Promise.all([
          performanceOptimizer.optimizedLoadIntegrationData(),
          performanceOptimizer.generatePerformanceReport()
        ]);

        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          integrationData,
          systemEvaluation: integrationData.systemEvaluation || [],
          integrationReport: integrationData.integrationReport,
          performanceMetrics,
          lastUpdated: Date.now(),
          error: null
        }));

        const loadTime = performance.now() - startTime;
        
        // تسجيل الأداء
        errorMonitor.logPerformance('integration_data_load', loadTime);
        
        if (loadTime > 2000) {
          console.warn(`⚠️ تحميل بطيء: ${loadTime.toFixed(2)}ms`);
        }

      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: errorMessage
        }));

        errorMonitor.logError({
          message: `فشل في تحميل بيانات التكامل: ${errorMessage}`,
          severity: 'high',
          context: { loadTime: performance.now() - startTime }
        });

        toast({
          title: "خطأ في التحميل",
          description: "فشل في تحميل بيانات التكامل",
          variant: "destructive"
        });
      }
    })();

    loadingPromiseRef.current = loadPromise;
    await loadPromise;
    loadingPromiseRef.current = null;
  }, [toast]);

  // الربط الذكي المحسن
  const performSmartLinking = useCallback(async () => {
    setState(prev => ({ ...prev, isEnhancing: true, error: null }));
    const startTime = performance.now();

    try {
      const result = await performanceOptimizer.optimizedSmartLinking();
      
      setState(prev => ({
        ...prev,
        isEnhancing: false,
        smartLinkingResult: result
      }));

      const duration = performance.now() - startTime;
      errorMonitor.logPerformance('smart_linking', duration);

      toast({
        title: "اكتمل الربط الذكي",
        description: `تم ربط ${result.successfulLinks} عنصر بنجاح في ${(duration / 1000).toFixed(1)} ثانية`,
        variant: "default"
      });

      // إعادة تحميل البيانات بعد الربط
      setTimeout(() => loadIntegrationData(true), 1000);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في الربط الذكي';
      
      setState(prev => ({
        ...prev,
        isEnhancing: false,
        error: errorMessage
      }));

      toast({
        title: "خطأ في الربط الذكي",
        description: errorMessage,
        variant: "destructive"
      });

      throw error;
    }
  }, [toast, loadIntegrationData]);

  // تحديث البيانات
  const refreshData = useCallback(async () => {
    await loadIntegrationData(true);
  }, [loadIntegrationData]);

  // مسح الكاش
  const clearCache = useCallback(() => {
    performanceOptimizer.clearCache();
    toast({
      title: "تم مسح الكاش",
      description: "تم مسح جميع البيانات المؤقتة",
      variant: "default"
    });
  }, [toast]);

  // الحصول على إحصائيات الأداء
  const getPerformanceStats = useCallback(() => {
    return performanceOptimizer.getPerformanceStats();
  }, []);

  // إعداد التحديث التلقائي
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(() => {
        loadIntegrationData(true);
      }, refreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, loadIntegrationData]);

  // تحميل البيانات الأولي
  useEffect(() => {
    loadIntegrationData();
    
    return () => {
      // تنظيف عند إلغاء التحميل
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, [loadIntegrationData]);

  // مراقبة الأداء
  useEffect(() => {
    if (enableProfiling) {
      const interval = setInterval(() => {
        const stats = getPerformanceStats();
        if (stats.memoryUsage > 100) { // أكثر من 100 MB
          console.warn('⚠️ استخدام ذاكرة مرتفع:', stats.memoryUsage.toFixed(2), 'MB');
        }
      }, 30000); // كل 30 ثانية

      return () => clearInterval(interval);
    }
  }, [enableProfiling, getPerformanceStats]);

  return {
    // حالة النظام
    isLoading: state.isLoading,
    isEnhancing: state.isEnhancing,
    isRefreshing: state.isRefreshing,
    error: state.error,
    lastUpdated: state.lastUpdated,

    // البيانات
    integrationData: state.integrationData,
    systemEvaluation: state.systemEvaluation,
    integrationReport: state.integrationReport,
    smartLinkingResult: state.smartLinkingResult,
    performanceMetrics: state.performanceMetrics,

    // العمليات
    loadIntegrationData,
    performSmartLinking,
    refreshData,
    clearCache,
    getPerformanceStats,

    // معلومات مفيدة
    cacheStats: integrationCache.getStats(),
    isDataStale: state.lastUpdated > 0 && (Date.now() - state.lastUpdated) > refreshInterval
  };
}