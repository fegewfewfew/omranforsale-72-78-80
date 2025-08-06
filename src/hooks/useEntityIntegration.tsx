import { useState, useEffect, useCallback } from 'react';
import { unifiedIntegrationManager, SmartLinkingResult, EntityIntegration } from '@/utils/unifiedIntegrationManager';
import { useToast } from '@/hooks/use-toast';

export interface UseEntityIntegrationReturn {
  // حالة النظام
  isLoading: boolean;
  isSmartLinking: boolean;
  
  // بيانات الربط
  integrations: EntityIntegration[];
  integrationReport: any;
  smartLinkingResult: SmartLinkingResult | null;
  
  // إجراءات الربط
  performSmartLinking: () => Promise<SmartLinkingResult>;
  manualLink: (
    entityType: 'check' | 'installment',
    entityId: string,
    ownerId: string,
    ownerType: 'customer' | 'supplier' | 'employee'
  ) => Promise<boolean>;
  unlinkEntity: (entityType: 'check' | 'installment', entityId: string) => Promise<boolean>;
  
  // استعلامات
  getEntitiesByOwner: (ownerId: string, ownerType: 'customer' | 'supplier' | 'employee') => any;
  refreshData: () => void;
  
  // إحصائيات
  getQuickStats: () => {
    totalEntities: number;
    linkedEntities: number;
    unlinkingRate: number;
    highConfidenceLinks: number;
  };
}

export function useEntityIntegration(): UseEntityIntegrationReturn {
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSmartLinking, setIsSmartLinking] = useState(false);
  const [integrations, setIntegrations] = useState<EntityIntegration[]>([]);
  const [integrationReport, setIntegrationReport] = useState<any>(null);
  const [smartLinkingResult, setSmartLinkingResult] = useState<SmartLinkingResult | null>(null);

  // تحديث البيانات
  const refreshData = useCallback(() => {
    try {
      setIsLoading(true);
      
      // تحديث بيانات الربط
      const report = unifiedIntegrationManager.getIntegrationReport();
      setIntegrationReport(report);
      
      // تحديث قائمة الربطات
      const integrationData = localStorage.getItem('entity_integrations');
      let allIntegrations = [];
      
      if (integrationData) {
        try {
          allIntegrations = JSON.parse(integrationData);
        } catch (parseError) {
          console.warn('خطأ في تحليل بيانات الربط من localStorage:', parseError);
          // إزالة البيانات المعطوبة
          localStorage.removeItem('entity_integrations');
        }
      }
      
      setIntegrations(Array.isArray(allIntegrations) ? allIntegrations : []);
      
      setIsLoading(false);
    } catch (error) {
      console.error('خطأ في تحديث بيانات الربط:', error);
      // تأكد من أن integrations تبقى مصفوفة حتى في حالة الخطأ
      setIntegrations([]);
      toast({
        title: "خطأ",
        description: "فشل في تحديث بيانات الربط",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [toast]);

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // الربط الذكي
  const performSmartLinking = useCallback(async (): Promise<SmartLinkingResult> => {
    try {
      setIsSmartLinking(true);
      
      const result = unifiedIntegrationManager.performSmartLinking();
      setSmartLinkingResult(result);
      
      // تحديث البيانات بعد الربط
      refreshData();
      
      // إظهار نتائج الربط
      toast({
        title: "تم الربط الذكي",
        description: `تم ربط ${result.successfulLinks} من ${result.totalProcessed} عنصر بنجاح`,
        variant: result.errors.length > 0 ? "destructive" : "default"
      });
      
      setIsSmartLinking(false);
      return result;
    } catch (error) {
      console.error('خطأ في الربط الذكي:', error);
      toast({
        title: "خطأ في الربط الذكي",
        description: "حدث خطأ أثناء عملية الربط الذكي",
        variant: "destructive"
      });
      setIsSmartLinking(false);
      throw error;
    }
  }, [toast, refreshData]);

  // الربط اليدوي
  const manualLink = useCallback(async (
    entityType: 'check' | 'installment',
    entityId: string,
    ownerId: string,
    ownerType: 'customer' | 'supplier' | 'employee'
  ): Promise<boolean> => {
    try {
      const success = unifiedIntegrationManager.manualLink(
        entityType,
        entityId,
        ownerId,
        ownerType,
        'user'
      );
      
      if (success) {
        refreshData();
        toast({
          title: "تم الربط",
          description: `تم ربط ${entityType === 'check' ? 'الشيك' : 'القسط'} بنجاح`,
          variant: "default"
        });
      } else {
        toast({
          title: "فشل الربط",
          description: "لم يتم الربط بنجاح، يرجى المحاولة مرة أخرى",
          variant: "destructive"
        });
      }
      
      return success;
    } catch (error) {
      console.error('خطأ في الربط اليدوي:', error);
      toast({
        title: "خطأ في الربط",
        description: "حدث خطأ أثناء عملية الربط",
        variant: "destructive"
      });
      return false;
    }
  }, [toast, refreshData]);

  // إلغاء الربط
  const unlinkEntity = useCallback(async (
    entityType: 'check' | 'installment',
    entityId: string
  ): Promise<boolean> => {
    try {
      const success = unifiedIntegrationManager.unlinkEntity(entityType, entityId);
      
      if (success) {
        refreshData();
        toast({
          title: "تم إلغاء الربط",
          description: `تم إلغاء ربط ${entityType === 'check' ? 'الشيك' : 'القسط'} بنجاح`,
          variant: "default"
        });
      } else {
        toast({
          title: "فشل إلغاء الربط",
          description: "لم يتم إلغاء الربط بنجاح",
          variant: "destructive"
        });
      }
      
      return success;
    } catch (error) {
      console.error('خطأ في إلغاء الربط:', error);
      toast({
        title: "خطأ في إلغاء الربط",
        description: "حدث خطأ أثناء إلغاء الربط",
        variant: "destructive"
      });
      return false;
    }
  }, [toast, refreshData]);

  // الحصول على الكيانات المرتبطة بمالك معين
  const getEntitiesByOwner = useCallback((
    ownerId: string,
    ownerType: 'customer' | 'supplier' | 'employee'
  ) => {
    return unifiedIntegrationManager.getEntitiesByOwner(ownerId, ownerType);
  }, []);

  // الحصول على إحصائيات سريعة
  const getQuickStats = useCallback(() => {
    if (!integrationReport) {
      return {
        totalEntities: 0,
        linkedEntities: 0,
        unlinkingRate: 0,
        highConfidenceLinks: 0
      };
    }

    const totalEntities = integrationReport.summary.totalEntities;
    const linkedEntities = integrationReport.summary.totalLinked;
    const unlinkingRate = integrationReport.summary.linkingRate;
    const highConfidenceLinks = integrationReport.byConfidence.high;

    return {
      totalEntities,
      linkedEntities,
      unlinkingRate,
      highConfidenceLinks
    };
  }, [integrationReport]);

  return {
    // حالة النظام
    isLoading,
    isSmartLinking,
    
    // بيانات الربط
    integrations,
    integrationReport,
    smartLinkingResult,
    
    // إجراءات الربط
    performSmartLinking,
    manualLink,
    unlinkEntity,
    
    // استعلامات
    getEntitiesByOwner,
    refreshData,
    
    // إحصائيات
    getQuickStats
  };
}