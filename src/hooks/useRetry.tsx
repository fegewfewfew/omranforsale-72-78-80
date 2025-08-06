import { useState, useCallback } from 'react';
import { retrySystem, RetryOptions, RetryResult } from '@/utils/retrySystem';
import { useMonitoring } from './useMonitoring';

/**
 * Hook لاستخدام نظام Retry في المكونات
 */
export function useRetry() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { logEvent, logError } = useMonitoring();

  const executeWithRetry = useCallback(async function<T>(
    operation: () => Promise<T>,
    options: RetryOptions & { operationName?: string } = {}
  ): Promise<RetryResult<T>> {
    const { operationName, ...retryOptions } = options;
    
    setIsRetrying(true);
    setRetryCount(0);

    try {
      const result = await retrySystem.execute(operation, {
        ...retryOptions,
        onRetry: (error, attempt, delay) => {
          setRetryCount(attempt);
          logEvent('operation_retry', {
            operationName,
            attempt,
            delay,
            error: error.message
          });
          options.onRetry?.(error, attempt, delay);
        }
      });

      // تسجيل النتيجة
      if (result.success) {
        logEvent('operation_success_after_retry', {
          operationName,
          attempts: result.attempts,
          totalTime: result.totalTime
        });
      } else {
        logError(`Operation failed after retries: ${operationName}`, {
          attempts: result.attempts,
          totalTime: result.totalTime,
          finalError: result.error
        });
      }

      return result;
    } finally {
      setIsRetrying(false);
      setRetryCount(0);
    }
  }, [logEvent, logError]);

  return {
    executeWithRetry,
    isRetrying,
    retryCount
  };
}

/**
 * Hook محسن للعمليات الحساسة
 */
export function useCriticalOperation() {
  const { executeWithRetry, isRetrying, retryCount } = useRetry();
  const { logError } = useMonitoring();

  const executeCritical = useCallback(async function<T>(
    operation: () => Promise<T>,
    operationName: string,
    customOptions: Partial<RetryOptions> = {}
  ): Promise<T> {
    const result = await executeWithRetry(operation, {
      operationName,
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 10000,
      jitter: true,
      ...customOptions
    });

    if (!result.success) {
      logError(`Critical operation failed: ${operationName}`, {
        attempts: result.attempts,
        totalTime: result.totalTime,
        error: result.error
      });
      throw result.error;
    }

    return result.data!;
  }, [executeWithRetry, logError]);

  return {
    executeCritical,
    isRetrying,
    retryCount
  };
}

/**
 * Hook للعمليات المالية
 */
export function useFinancialOperation() {
  const { executeCritical, isRetrying, retryCount } = useCriticalOperation();

  const executeFinancial = useCallback(async function<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    return executeCritical(operation, `financial_${operationName}`, {
      retryCondition: (error, attempt) => {
        // شروط صارمة لإعادة المحاولة للعمليات المالية
        const errorMessage = (error.message || '').toLowerCase();
        
        // عدم إعادة المحاولة للأخطاء المالية الحرجة
        if (errorMessage.includes('insufficient funds') ||
            errorMessage.includes('account locked') ||
            errorMessage.includes('payment declined')) {
          return false;
        }

        // إعادة المحاولة فقط لأخطاء الشبكة والخادم
        return error.status >= 500 || 
               errorMessage.includes('network') ||
               errorMessage.includes('timeout');
      }
    });
  }, [executeCritical]);

  return {
    executeFinancial,
    isRetrying,
    retryCount
  };
}

/**
 * Hook للعمليات المخزونية
 */
export function useInventoryOperation() {
  const { executeWithRetry, isRetrying, retryCount } = useRetry();

  const executeInventory = useCallback(async function<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const result = await executeWithRetry(operation, {
      operationName: `inventory_${operationName}`,
      maxAttempts: 3,
      baseDelay: 1000,
      retryCondition: (error) => {
        const errorMessage = (error.message || '').toLowerCase();
        
        // إعادة المحاولة لأخطاء التزامن والشبكة
        return errorMessage.includes('concurrent') ||
               errorMessage.includes('lock') ||
               errorMessage.includes('network') ||
               error.status >= 500;
      }
    });

    if (!result.success) {
      throw result.error;
    }

    return result.data!;
  }, [executeWithRetry]);

  return {
    executeInventory,
    isRetrying,
    retryCount
  };
}