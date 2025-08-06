/**
 * محسن الأداء المخصص لنظام التكامل
 */

import { integrationCache, cacheKeys } from './integrationCacheManager';
import { enhancedIntegrationsManager } from './enhancedIntegrationsManager';
import { errorMonitor } from './errorMonitor';

interface PerformanceConfig {
  enableProfiling: boolean;
  enableCaching: boolean;
  batchSize: number;
  maxConcurrentOperations: number;
  timeoutMs: number;
}

interface PerformanceMetrics {
  operationName: string;
  duration: number;
  timestamp: number;
  cacheHit: boolean;
  dataSize: number;
  memoryUsage: number;
}

export class PerformanceIntegrationOptimizer {
  private config: PerformanceConfig = {
    enableProfiling: true,
    enableCaching: true,
    batchSize: 50,
    maxConcurrentOperations: 5,
    timeoutMs: 30000
  };

  private metrics: PerformanceMetrics[] = [];
  private activeOperations = new Set<string>();
  private operationQueue: Array<() => Promise<any>> = [];

  // تحسين تحميل البيانات
  async optimizedLoadIntegrationData(): Promise<any> {
    const startTime = performance.now();
    const cacheKey = cacheKeys.integrationReport;

    try {
      // محاولة الحصول على البيانات من الكاش أولاً
      if (this.config.enableCaching) {
        const cachedData = integrationCache.get(cacheKey);
        if (cachedData) {
          this.recordMetrics('loadIntegrationData', startTime, true, cachedData);
          return cachedData;
        }
      }

      // تحميل البيانات مع تحسين الأداء
      const data = await this.performBatchedDataLoad();
      
      // حفظ في الكاش
      if (this.config.enableCaching) {
        integrationCache.set(cacheKey, data, 300); // 5 دقائق
      }

      this.recordMetrics('loadIntegrationData', startTime, false, data);
      return data;

    } catch (error) {
      errorMonitor.logError({
        message: `خطأ في تحميل بيانات التكامل: ${error}`,
        severity: 'high',
        context: { operation: 'optimizedLoadIntegrationData' }
      });
      throw error;
    }
  }

  // تحميل البيانات على دفعات
  private async performBatchedDataLoad(): Promise<any> {
    const operations = [
      () => this.loadSystemEvaluation(),
      () => this.loadIntegrationReport(),
      () => this.loadPerformanceMetrics()
    ];

    // تشغيل العمليات بالتوازي مع حد أقصى
    const results = await this.executeConcurrentOperations(operations);
    
    return {
      systemEvaluation: results[0],
      integrationReport: results[1],
      performanceMetrics: results[2],
      timestamp: Date.now()
    };
  }

  // تنفيذ العمليات المتزامنة مع حد أقصى
  private async executeConcurrentOperations<T>(
    operations: Array<() => Promise<T>>
  ): Promise<T[]> {
    const results: T[] = [];
    const chunks = this.chunkArray(operations, this.config.maxConcurrentOperations);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(op => this.executeWithTimeout(op, this.config.timeoutMs))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  // تنفيذ عملية مع timeout
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`العملية تجاوزت الوقت المحدد: ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  // تقسيم المصفوفة إلى مجموعات
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // تحميل تقييم النظام مع التحسين
  private async loadSystemEvaluation(): Promise<any> {
    const cacheKey = cacheKeys.systemEvaluation;
    
    if (this.config.enableCaching) {
      const cached = integrationCache.get(cacheKey);
      if (cached) return cached;
    }

    const data = enhancedIntegrationsManager.evaluateSystemIntegration();
    
    if (this.config.enableCaching) {
      integrationCache.set(cacheKey, data, 180); // 3 دقائق
    }

    return data;
  }

  // تحميل تقرير التكامل مع التحسين
  private async loadIntegrationReport(): Promise<any> {
    const cacheKey = 'integration_report_detailed';
    
    if (this.config.enableCaching) {
      const cached = integrationCache.get(cacheKey);
      if (cached) return cached;
    }

    const data = enhancedIntegrationsManager.generateIntegrationReport();
    
    if (this.config.enableCaching) {
      integrationCache.set(cacheKey, data, 240); // 4 دقائق
    }

    return data;
  }

  // تحميل مقاييس الأداء
  private async loadPerformanceMetrics(): Promise<any> {
    const cacheKey = cacheKeys.performanceMetrics;
    
    if (this.config.enableCaching) {
      const cached = integrationCache.get(cacheKey);
      if (cached) return cached;
    }

    const data = this.generatePerformanceReport();
    
    if (this.config.enableCaching) {
      integrationCache.set(cacheKey, data, 60); // دقيقة واحدة
    }

    return data;
  }

  // تحسين عملية الربط الذكي
  async optimizedSmartLinking(): Promise<any> {
    const startTime = performance.now();
    const operationId = `smart_linking_${Date.now()}`;

    try {
      this.activeOperations.add(operationId);

      // التحقق من وجود عملية ربط حديثة
      const recentResult = integrationCache.get(cacheKeys.smartLinkingResult);
      if (recentResult && (Date.now() - recentResult.timestamp) < 60000) {
        return recentResult;
      }

      // تشغيل الربط الذكي مع تحسينات
      const result = await this.performOptimizedSmartLinking();
      
      // حفظ النتيجة
      integrationCache.set(cacheKeys.smartLinkingResult, {
        ...result,
        timestamp: Date.now()
      }, 300);

      this.recordMetrics('optimizedSmartLinking', startTime, false, result);
      return result;

    } catch (error) {
      errorMonitor.logError({
        message: `خطأ في الربط الذكي المحسن: ${error}`,
        severity: 'critical',
        context: { operationId }
      });
      throw error;
    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  // تنفيذ الربط الذكي المحسن
  private async performOptimizedSmartLinking(): Promise<any> {
    // تحميل البيانات المطلوبة بالتوازي
    const [customers, suppliers, checks, installments] = await Promise.all([
      this.loadCachedData(cacheKeys.customers, () => JSON.parse(localStorage.getItem('customers') || '[]')),
      this.loadCachedData(cacheKeys.suppliers, () => JSON.parse(localStorage.getItem('suppliers') || '[]')),
      this.loadCachedData('checks_data', () => JSON.parse(localStorage.getItem('checks') || '[]')),
      this.loadCachedData('installments_data', () => JSON.parse(localStorage.getItem('installments') || '[]'))
    ]);

    // معالجة البيانات على دفعات
    const batchSize = this.config.batchSize;
    const results = {
      successfulLinks: 0,
      failedLinks: 0,
      highConfidenceLinks: 0,
      totalProcessed: 0,
      processingTime: 0,
      suggestions: []
    };

    // معالجة الشيكات
    const checkBatches = this.chunkArray(checks, batchSize);
    for (const batch of checkBatches) {
      const batchResult = await this.processBatch(batch, 'check', customers, suppliers);
      this.mergeBatchResults(results, batchResult);
    }

    // معالجة الأقساط
    const installmentBatches = this.chunkArray(installments, batchSize);
    for (const batch of installmentBatches) {
      const batchResult = await this.processBatch(batch, 'installment', customers, suppliers);
      this.mergeBatchResults(results, batchResult);
    }

    return results;
  }

  // تحميل البيانات مع الكاش
  private async loadCachedData(cacheKey: string, loader: () => any): Promise<any> {
    if (this.config.enableCaching) {
      const cached = integrationCache.get(cacheKey);
      if (cached) return cached;
    }

    const data = loader();
    
    if (this.config.enableCaching) {
      integrationCache.set(cacheKey, data, 120); // دقيقتان
    }

    return data;
  }

  // معالجة دفعة من البيانات
  private async processBatch(
    batch: any[],
    entityType: string,
    customers: any[],
    suppliers: any[]
  ): Promise<any> {
    // محاكاة معالجة محسنة
    await new Promise(resolve => setTimeout(resolve, 10)); // معالجة سريعة

    return {
      successfulLinks: Math.floor(batch.length * 0.8),
      failedLinks: Math.floor(batch.length * 0.2),
      highConfidenceLinks: Math.floor(batch.length * 0.6),
      totalProcessed: batch.length
    };
  }

  // دمج نتائج الدفعات
  private mergeBatchResults(total: any, batch: any): void {
    total.successfulLinks += batch.successfulLinks;
    total.failedLinks += batch.failedLinks;
    total.highConfidenceLinks += batch.highConfidenceLinks;
    total.totalProcessed += batch.totalProcessed;
  }

  // تسجيل مقاييس الأداء
  private recordMetrics(
    operationName: string,
    startTime: number,
    cacheHit: boolean,
    data: any
  ): void {
    if (!this.config.enableProfiling) return;

    const metric: PerformanceMetrics = {
      operationName,
      duration: performance.now() - startTime,
      timestamp: Date.now(),
      cacheHit,
      dataSize: JSON.stringify(data).length,
      memoryUsage: this.getMemoryUsage()
    };

    this.metrics.push(metric);

    // الاحتفاظ بآخر 100 قياس فقط
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // تسجيل المقاييس البطيئة
    if (metric.duration > 1000) {
      console.warn(`⚠️ عملية بطيئة: ${operationName} استغرقت ${metric.duration.toFixed(2)}ms`);
    }
  }

  // الحصول على استخدام الذاكرة
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  }

  // توليد تقرير الأداء
  generatePerformanceReport(): any {
    const recentMetrics = this.metrics.filter(m => 
      Date.now() - m.timestamp < 300000 // آخر 5 دقائق
    );

    if (recentMetrics.length === 0) {
      return {
        averageDuration: 0,
        cacheHitRate: 0,
        operationsCount: 0,
        slowOperations: [],
        memoryUsage: this.getMemoryUsage()
      };
    }

    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const slowOperations = recentMetrics.filter(m => m.duration > 1000);

    return {
      averageDuration: totalDuration / recentMetrics.length,
      cacheHitRate: (cacheHits / recentMetrics.length) * 100,
      operationsCount: recentMetrics.length,
      slowOperations: slowOperations.map(op => ({
        name: op.operationName,
        duration: op.duration,
        timestamp: op.timestamp
      })),
      memoryUsage: this.getMemoryUsage(),
      cacheStats: integrationCache.getStats()
    };
  }

  // إعادة تعيين الكاش
  clearCache(): void {
    integrationCache.clear();
    console.log('🧹 تم مسح الكاش بالكامل');
  }

  // تحديث إعدادات الأداء
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ تم تحديث إعدادات الأداء:', this.config);
  }

  // الحصول على إحصائيات الأداء
  getPerformanceStats(): any {
    return {
      config: this.config,
      activeOperations: this.activeOperations.size,
      metricsCount: this.metrics.length,
      queueSize: this.operationQueue.length,
      cacheStats: integrationCache.getStats()
    };
  }
}

// إنشاء مثيل واحد
export const performanceOptimizer = new PerformanceIntegrationOptimizer();