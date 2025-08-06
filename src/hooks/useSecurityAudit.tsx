import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { securityAuditLogger } from '@/utils/securityAuditLogger';
import { toast } from 'sonner';

export function useSecurityAudit() {
  const { user } = useAuth();

  // تسجيل عملية تحسين
  const logOptimization = useCallback((
    operation: string,
    beforeState: any,
    afterState: any,
    requiresApproval: boolean = false
  ) => {
    if (!user) return;
    
    securityAuditLogger.logOptimizationOperation(
      user.id,
      user.email,
      operation,
      beforeState,
      afterState,
      requiresApproval
    );

    if (requiresApproval) {
      toast.warning('العملية تتطلب موافقة المدير', {
        description: 'سيتم مراجعة العملية قبل التنفيذ'
      });
    }
  }, [user]);

  // تسجيل الوصول للإعدادات الحساسة
  const logSensitiveAccess = useCallback((
    settingName: string,
    action: 'view' | 'modify',
    oldValue?: any,
    newValue?: any
  ) => {
    if (!user) return;
    
    securityAuditLogger.logSensitiveSettingsAccess(
      user.id,
      user.email,
      settingName,
      action,
      oldValue,
      newValue
    );
  }, [user]);

  // تسجيل تصدير البيانات
  const logDataExport = useCallback((
    dataType: string,
    recordCount: number,
    filters?: any
  ) => {
    if (!user) return;
    
    securityAuditLogger.logDataExport(
      user.id,
      user.email,
      dataType,
      recordCount,
      filters
    );

    toast.success('تم تسجيل عملية التصدير', {
      description: `تم تصدير ${recordCount} سجل من ${dataType}`
    });
  }, [user]);

  // تسجيل العمليات الإدارية
  const logAdminAction = useCallback((
    action: string,
    targetUserId?: string,
    details?: any
  ) => {
    if (!user) return;
    
    securityAuditLogger.logAdminAction(
      user.id,
      user.email,
      action,
      targetUserId,
      details
    );
  }, [user]);

  // تسجيل مسار التدقيق
  const logAuditTrail = useCallback((
    entityType: string,
    entityId: string,
    field: string,
    oldValue: any,
    newValue: any
  ) => {
    if (!user) return;
    
    securityAuditLogger.logAuditTrail({
      entityType,
      entityId,
      changes: [{
        field,
        oldValue,
        newValue,
        timestamp: new Date().toISOString(),
        changedBy: user.email
      }]
    });
  }, [user]);

  // الحصول على الأحداث الأمنية
  const getSecurityEvents = useCallback((filter?: any) => {
    return securityAuditLogger.getSecurityEvents(filter);
  }, []);

  // الحصول على مسارات التدقيق
  const getAuditTrails = useCallback((entityType?: string, entityId?: string) => {
    return securityAuditLogger.getAuditTrails(entityType, entityId);
  }, []);

  // الموافقة على العمليات المعلقة
  const approveSecurityEvent = useCallback((eventId: string) => {
    if (!user) return false;
    
    const approved = securityAuditLogger.approveSecurityEvent(eventId, user.email);
    if (approved) {
      toast.success('تم الموافقة على العملية بنجاح');
    } else {
      toast.error('فشل في الموافقة على العملية');
    }
    return approved;
  }, [user]);

  // الحصول على إحصائيات الأمان
  const getSecurityStatistics = useCallback((days: number = 30) => {
    return securityAuditLogger.getSecurityStatistics(days);
  }, []);

  return {
    logOptimization,
    logSensitiveAccess,
    logDataExport,
    logAdminAction,
    logAuditTrail,
    getSecurityEvents,
    getAuditTrails,
    approveSecurityEvent,
    getSecurityStatistics
  };
}