/**
 * نظام مراقبة ومعالجة الأخطاء المحسن
 */

interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  type: 'javascript' | 'promise' | 'resource' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorMonitoringService {
  private errors: ErrorLog[] = [];
  private readonly maxErrors = 50; // الحد الأقصى للأخطاء المحفوظة
  
  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // مراقبة أخطاء JavaScript
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: event.filename || window.location.href,
        userAgent: navigator.userAgent,
        type: 'javascript',
        severity: this.determineSeverity(event.message)
      });
    });

    // مراقبة Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        type: 'promise',
        severity: 'medium'
      });
    });

    // مراقبة أخطاء الموارد
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        this.logError({
          message: `Resource loading error: ${(event.target as any).src || 'Unknown resource'}`,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          type: 'resource',
          severity: 'low'
        });
      }
    }, true);
  }

  private determineSeverity(message: string): ErrorLog['severity'] {
    const criticalKeywords = ['authentication', 'payment', 'security', 'database'];
    const highKeywords = ['network', 'api', 'server', 'timeout'];
    const mediumKeywords = ['validation', 'form', 'input'];
    
    const lowerMessage = message.toLowerCase();
    
    if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'critical';
    } else if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    } else if (mediumKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  private logError(error: ErrorLog) {
    console.error('خطأ تم رصده:', error);
    
    this.errors.push(error);
    
    // الحفاظ على الحد الأقصى للأخطاء
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
    
    // حفظ الأخطاء المهمة في localStorage
    if (error.severity === 'critical' || error.severity === 'high') {
      this.persistCriticalError(error);
    }
    
    // محاولة الإصلاح التلقائي للأخطاء الشائعة
    this.attemptAutoRecovery(error);
  }

  private persistCriticalError(error: ErrorLog) {
    try {
      const criticalErrors = JSON.parse(localStorage.getItem('critical_errors') || '[]');
      criticalErrors.push(error);
      
      // الاحتفاظ بآخر 10 أخطاء مهمة فقط
      const recentErrors = criticalErrors.slice(-10);
      localStorage.setItem('critical_errors', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('فشل في حفظ الخطأ المهم:', e);
    }
  }

  private attemptAutoRecovery(error: ErrorLog) {
    // إصلاح تلقائي لأخطاء الشبكة
    if (error.type === 'network' || error.message.includes('fetch')) {
      setTimeout(() => {
        if (!navigator.onLine) {
          console.log('محاولة إعادة الاتصال...');
          // يمكن إضافة منطق إعادة المحاولة هنا
        }
      }, 5000);
    }
    
    // إصلاح تلقائي لأخطاء الذاكرة
    if (error.message.includes('memory') || error.message.includes('heap')) {
      this.performMemoryCleanup();
    }
    
    // إصلاح تلقائي لأخطاء DOM
    if (error.message.includes('DOM') || error.message.includes('element')) {
      setTimeout(() => {
        // إعادة تحميل المكونات المعطلة
        window.dispatchEvent(new Event('force-rerender'));
      }, 1000);
    }
  }

  private performMemoryCleanup() {
    console.log('تنفيذ تنظيف الذاكرة...');
    
    // تنظيف cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('old') || name.includes('temp')) {
            caches.delete(name);
          }
        });
      });
    }
    
    // تنظيف localStorage
    this.cleanupLocalStorage();
    
    // إجباري garbage collection إذا كان متاحاً
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  private cleanupLocalStorage() {
    const keysToRemove: string[] = [];
    const maxAge = 24 * 60 * 60 * 1000; // 24 ساعة
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.timestamp && (now - item.timestamp) > maxAge) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // إزالة البيانات المعطوبة
          if (!key.includes('admin_authenticated') && !key.includes('remember_login')) {
            keysToRemove.push(key);
          }
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // واجهة للحصول على تقرير الأخطاء
  public getErrorReport() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(error => error.timestamp > last24Hours);
    const errorsByType = this.groupErrorsByType(recentErrors);
    const errorsBySeverity = this.groupErrorsBySeverity(recentErrors);
    
    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsBySeverity,
      criticalErrors: recentErrors.filter(e => e.severity === 'critical'),
      recommendations: this.generateRecommendations(recentErrors)
    };
  }

  private groupErrorsByType(errors: ErrorLog[]) {
    return errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupErrorsBySeverity(errors: ErrorLog[]) {
    return errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private generateRecommendations(errors: ErrorLog[]) {
    const recommendations: string[] = [];
    
    const networkErrors = errors.filter(e => e.type === 'network').length;
    const memoryErrors = errors.filter(e => e.message.includes('memory')).length;
    const domErrors = errors.filter(e => e.message.includes('DOM')).length;
    
    if (networkErrors > 5) {
      recommendations.push('تحسين معالجة أخطاء الشبكة وإضافة retry mechanism');
    }
    
    if (memoryErrors > 3) {
      recommendations.push('تحسين إدارة الذاكرة وتقليل memory leaks');
    }
    
    if (domErrors > 3) {
      recommendations.push('مراجعة تفاعل المكونات مع DOM وتحسين rendering');
    }
    
    return recommendations;
  }

  // تنظيف دوري
  public performScheduledCleanup() {
    this.cleanupLocalStorage();
    this.performMemoryCleanup();
    
    // إزالة الأخطاء القديمة
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // أسبوع
    this.errors = this.errors.filter(error => (now - error.timestamp) < maxAge);
  }
}

// إنشاء مثيل واحد للخدمة
export const errorMonitor = new ErrorMonitoringService();

// تنظيف دوري كل ساعة
setInterval(() => {
  errorMonitor.performScheduledCleanup();
}, 60 * 60 * 1000);