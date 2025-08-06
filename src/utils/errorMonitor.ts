// نظام مراقبة الأخطاء والأداء
import { storage } from './storage';

export interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export interface PerformanceMetric {
  id: string;
  timestamp: string;
  metric: string;
  value: number;
  url: string;
  userId?: string;
}

export interface UsageEvent {
  id: string;
  timestamp: string;
  event: string;
  data?: Record<string, any>;
  userId?: string;
}

class ErrorMonitor {
  private errorLogs: ErrorLog[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private usageEvents: UsageEvent[] = [];
  private webhookUrl?: string;
  private isEnabled = true;

  constructor() {
    this.loadStoredData();
    this.setupGlobalErrorHandling();
    this.setupPerformanceMonitoring();
    this.setupUnhandledRejections();
  }

  // إعداد معالجة الأخطاء العامة
  private setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }

  // إعداد مراقبة الوعود المرفوضة
  private setupUnhandledRejections() {
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: 'critical',
        context: { type: 'unhandledrejection' }
      });
    });
  }

  // إعداد مراقبة الأداء
  private setupPerformanceMonitoring() {
    // مراقبة أداء التحميل
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.logPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
          this.logPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
          this.logPerformance('first_byte', navigation.responseStart - navigation.fetchStart);
        }

        // Core Web Vitals
        this.measureCoreWebVitals();
      }, 1000);
    });
  }

  // قياس Core Web Vitals
  private measureCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.logPerformance('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.logPerformance('fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        });
        this.logPerformance('cls', clsScore);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  // تسجيل الأخطاء مع معلومات Retry
  logError(error: Partial<ErrorLog> & { retryInfo?: { attempts: number; willRetry: boolean } }) {
    if (!this.isEnabled) return;

    const { retryInfo, ...errorData } = error;
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      severity: 'medium',
      ...errorData,
      message: error.message || 'Unknown error',
      context: {
        ...errorData.context,
        retryInfo
      }
    };

    this.errorLogs.push(errorLog);
    this.saveToStorage();
    
    // إرسال تنبيه فقط إذا لم تكن هناك محاولة إعادة أو فشلت المحاولات
    if (!retryInfo?.willRetry) {
      this.sendAlert(errorLog);
    }

    // تنظيف البيانات القديمة
    this.cleanupOldData();
  }

  // تسجيل مقاييس الأداء
  logPerformance(metric: string, value: number) {
    if (!this.isEnabled) return;

    const performanceMetric: PerformanceMetric = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      metric,
      value,
      url: window.location.href
    };

    this.performanceMetrics.push(performanceMetric);
    this.saveToStorage();
  }

  // تسجيل أحداث الاستخدام
  logUsage(event: string, data?: Record<string, any>) {
    if (!this.isEnabled) return;

    const usageEvent: UsageEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      event,
      data
    };

    this.usageEvents.push(usageEvent);
    this.saveToStorage();
  }

  // إرسال التنبيهات
  private async sendAlert(error: ErrorLog) {
    if (!this.webhookUrl || error.severity === 'low') return;

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          type: 'error_alert',
          error: {
            message: error.message,
            severity: error.severity,
            timestamp: error.timestamp,
            url: error.url
          },
          app: 'عمران للمبيعات'
        })
      });
    } catch (err) {
      console.warn('فشل في إرسال التنبيه:', err);
    }
  }

  // حفظ البيانات في التخزين المحلي
  private saveToStorage() {
    storage.setItem('error_logs', this.errorLogs.slice(-100)); // آخر 100 خطأ
    storage.setItem('performance_metrics', this.performanceMetrics.slice(-200));
    storage.setItem('usage_events', this.usageEvents.slice(-500));
  }

  // تحميل البيانات المحفوظة
  private loadStoredData() {
    this.errorLogs = storage.getItem('error_logs', []);
    this.performanceMetrics = storage.getItem('performance_metrics', []);
    this.usageEvents = storage.getItem('usage_events', []);
  }

  // تنظيف البيانات القديمة (أكثر من 7 أيام)
  private cleanupOldData() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    this.errorLogs = this.errorLogs.filter(log => log.timestamp > weekAgo);
    this.performanceMetrics = this.performanceMetrics.filter(metric => metric.timestamp > weekAgo);
    this.usageEvents = this.usageEvents.filter(event => event.timestamp > weekAgo);
  }

  // تعيين webhook للتنبيهات
  setWebhook(url: string) {
    this.webhookUrl = url;
    storage.setItem('monitor_webhook', url);
  }

  // الحصول على إحصائيات الأخطاء
  getErrorStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayErrors = this.errorLogs.filter(log => log.timestamp.startsWith(today));
    
    return {
      total: this.errorLogs.length,
      today: todayErrors.length,
      critical: this.errorLogs.filter(log => log.severity === 'critical').length,
      high: this.errorLogs.filter(log => log.severity === 'high').length,
      recentErrors: this.errorLogs.slice(-10)
    };
  }

  // الحصول على إحصائيات الأداء
  getPerformanceStats() {
    const latestMetrics = this.performanceMetrics.slice(-20);
    const avgLoadTime = latestMetrics
      .filter(m => m.metric === 'page_load_time')
      .reduce((sum, m) => sum + m.value, 0) / Math.max(1, latestMetrics.filter(m => m.metric === 'page_load_time').length);

    return {
      averageLoadTime: Math.round(avgLoadTime),
      totalMetrics: this.performanceMetrics.length,
      latestMetrics: latestMetrics
    };
  }

  // الحصول على إحصائيات الاستخدام
  getUsageStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = this.usageEvents.filter(event => event.timestamp.startsWith(today));
    
    return {
      totalEvents: this.usageEvents.length,
      todayEvents: todayEvents.length,
      popularActions: this.getMostPopularActions(),
      recentEvents: this.usageEvents.slice(-10)
    };
  }

  // الحصول على أكثر الإجراءات استخداماً
  private getMostPopularActions() {
    const actionCounts = this.usageEvents.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));
  }

  // تصدير البيانات
  exportData() {
    return {
      errors: this.errorLogs,
      performance: this.performanceMetrics,
      usage: this.usageEvents,
      exportedAt: new Date().toISOString()
    };
  }

  // تفعيل/إلغاء تفعيل المراقبة
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    storage.setItem('monitor_enabled', enabled);
  }
}

// إنشاء مثيل واحد للتطبيق
export const errorMonitor = new ErrorMonitor();