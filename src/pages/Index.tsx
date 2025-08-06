import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { autoIntegrationSystem } from "@/utils/autoIntegrationSystem";
import { ErrorBoundary } from "@/components/ui/error-handling";

const Index = () => {
  useEffect(() => {
    try {
      console.log('Index component loaded successfully');
      
      // تطبيق الترابط التلقائي عند تحميل النظام
      const initializeSystem = async () => {
        try {
          if (!autoIntegrationSystem.isSystemInitialized()) {
            console.log('تطبيق الترابط التلقائي للمرة الأولى...');
            await autoIntegrationSystem.initializeSystemIntegration();
            console.log('✅ تم تطبيق الترابط التلقائي بنجاح!');
          } else {
            console.log('✅ النظام مُفعَّل بالفعل - الترابط كامل!');
          }
        } catch (error) {
          console.error('خطأ في تهيئة النظام:', error);
        }
      };

      initializeSystem();
    } catch (error) {
      console.error('خطأ في تحميل الصفحة الرئيسية:', error);
    }
  }, []);

  return (
    <ErrorBoundary>
      <AppLayout>
        <ErrorBoundary>
          <Dashboard />
        </ErrorBoundary>
      </AppLayout>
    </ErrorBoundary>
  );
};

export default Index;
