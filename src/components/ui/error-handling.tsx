import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error Boundary محسن مع UI أفضل
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log error for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

/**
 * واجهة خطأ افتراضية محسنة
 */
function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [countdown, setCountdown] = useState(5);

  console.error('Error caught by ErrorBoundary:', error);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      window.location.reload();
    }
  }, [countdown]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>حدث خطأ غير متوقع</AlertTitle>
          <AlertDescription>
            نعتذر، حدث خطأ في التطبيق. سيتم تحديث الصفحة تلقائياً خلال {countdown} ثانية.
          </AlertDescription>
        </Alert>

        {isDevelopment && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>تفاصيل الخطأ (بيئة التطوير)</AlertTitle>
            <AlertDescription className="font-mono text-xs mt-2 whitespace-pre-wrap">
              {error.message}
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer">عرض Stack Trace</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 justify-center">
          <Button onClick={retry} variant="default">
            إعادة المحاولة
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            إعادة تحميل الصفحة الآن
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook لمعالجة الأخطاء في المكونات الوظيفية
 */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: Error) => {
    setError(error);
    console.error('Error caught by useErrorHandler:', error);
  }, []);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

/**
 * مكون تنبيه الأخطاء القابل للإعادة الاستخدام
 */
interface ErrorAlertProps {
  error: string | Error | null;
  onDismiss?: () => void;
  variant?: 'destructive' | 'default';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorAlert({ 
  error, 
  onDismiss, 
  variant = 'destructive', 
  action,
  className 
}: ErrorAlertProps) {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Alert variant={variant} className={cn("relative", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>خطأ</AlertTitle>
      <AlertDescription className="mt-2">
        {errorMessage}
      </AlertDescription>
      
      <div className="flex gap-2 mt-3">
        {action && (
          <Button size="sm" variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            إغلاق
          </Button>
        )}
      </div>
    </Alert>
  );
}

/**
 * مكون تنبيه النجاح
 */
interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
  className?: string;
}

export function SuccessAlert({ 
  message, 
  onDismiss, 
  autoHide = true, 
  duration = 5000,
  className 
}: SuccessAlertProps) {
  useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onDismiss, duration]);

  return (
    <Alert variant="default" className={cn("border-green-200 bg-green-50", className)}>
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">نجح</AlertTitle>
      <AlertDescription className="text-green-700">
        {message}
      </AlertDescription>
      {onDismiss && (
        <Button 
          size="sm" 
          variant="ghost" 
          className="absolute top-2 left-2 h-6 w-6 p-0 text-green-600 hover:bg-green-100"
          onClick={onDismiss}
        >
          ✕
        </Button>
      )}
    </Alert>
  );
}