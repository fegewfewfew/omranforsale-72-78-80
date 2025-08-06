import { storage } from './storage';
import { checksManager } from './checksManager';
import { installmentsManager } from './installmentsManager';

export interface EntityIntegration {
  id: string;
  entityType: 'check' | 'installment';
  entityId: string;
  ownerId: string;
  ownerName: string;
  ownerType: 'customer' | 'supplier' | 'employee';
  ownerPhone?: string;
  ownerEmail?: string;
  relationshipType: 'sales' | 'purchases' | 'salary' | 'other';
  relatedTransactionId?: string;
  autoLinked: boolean;
  confidence: number; // 0-100 دقة الربط التلقائي
  linkedAt: string;
  linkedBy?: string;
}

export interface SmartLinkingResult {
  totalProcessed: number;
  successfulLinks: number;
  failedLinks: number;
  highConfidenceLinks: number;
  lowConfidenceLinks: number;
  duplicatesFound: number;
  errors: string[];
  suggestions: Array<{
    entityType: 'check' | 'installment';
    entityId: string;
    entityName: string;
    possibleOwners: Array<{
      ownerId: string;
      ownerName: string;
      ownerType: 'customer' | 'supplier' | 'employee';
      confidence: number;
      reason: string;
    }>;
  }>;
}

export class UnifiedIntegrationManager {
  private static instance: UnifiedIntegrationManager;

  static getInstance(): UnifiedIntegrationManager {
    if (!UnifiedIntegrationManager.instance) {
      UnifiedIntegrationManager.instance = new UnifiedIntegrationManager();
    }
    return UnifiedIntegrationManager.instance;
  }

  // ربط ذكي شامل للشيكات والأقساط
  performSmartLinking(): SmartLinkingResult {
    const result: SmartLinkingResult = {
      totalProcessed: 0,
      successfulLinks: 0,
      failedLinks: 0,
      highConfidenceLinks: 0,
      lowConfidenceLinks: 0,
      duplicatesFound: 0,
      errors: [],
      suggestions: []
    };

    try {
      // ربط الشيكات
      const checksResult = this.linkChecksSmartly();
      
      // ربط الأقساط
      const installmentsResult = this.linkInstallmentsSmartly();

      // دمج النتائج
      result.totalProcessed = checksResult.totalProcessed + installmentsResult.totalProcessed;
      result.successfulLinks = checksResult.successfulLinks + installmentsResult.successfulLinks;
      result.failedLinks = checksResult.failedLinks + installmentsResult.failedLinks;
      result.highConfidenceLinks = checksResult.highConfidenceLinks + installmentsResult.highConfidenceLinks;
      result.lowConfidenceLinks = checksResult.lowConfidenceLinks + installmentsResult.lowConfidenceLinks;
      result.duplicatesFound = checksResult.duplicatesFound + installmentsResult.duplicatesFound;
      result.errors = [...checksResult.errors, ...installmentsResult.errors];
      result.suggestions = [...checksResult.suggestions, ...installmentsResult.suggestions];

      // حفظ سجل الربط الذكي
      this.saveSmartLinkingLog(result);

      return result;
    } catch (error) {
      console.error('خطأ في الربط الذكي:', error);
      result.errors.push(`خطأ عام في الربط الذكي: ${error.message}`);
      return result;
    }
  }

  // ربط ذكي للشيكات
  private linkChecksSmartly(): Partial<SmartLinkingResult> {
    const checks = checksManager.getChecks();
    const customers = storage.getItem('customers', []);
    const suppliers = storage.getItem('suppliers', []);
    const employees = storage.getItem('employees', []);
    const existingIntegrations = storage.getItem('entity_integrations', []);

    const result: Partial<SmartLinkingResult> = {
      totalProcessed: checks.length,
      successfulLinks: 0,
      failedLinks: 0,
      highConfidenceLinks: 0,
      lowConfidenceLinks: 0,
      duplicatesFound: 0,
      errors: [],
      suggestions: []
    };

    checks.forEach(check => {
      try {
        // تحقق من وجود ربط موجود
        const existingLink = existingIntegrations.find((ei: any) => 
          ei.entityType === 'check' && ei.entityId === check.id
        );

        if (existingLink) {
          result.duplicatesFound!++;
          return;
        }

        // البحث عن أفضل مطابقة
        const bestMatch = this.findBestOwnerMatch(
          { name: check.customerName, phone: check.customerPhone },
          [
            ...customers.map((c: any) => ({ ...c, type: 'customer' })),
            ...suppliers.map((s: any) => ({ ...s, type: 'supplier' })),
            ...employees.map((e: any) => ({ ...e, type: 'employee' }))
          ]
        );

        if (bestMatch) {
          const integration: EntityIntegration = {
            id: `INT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            entityType: 'check',
            entityId: check.id,
            ownerId: bestMatch.owner.id,
            ownerName: bestMatch.owner.name,
            ownerType: bestMatch.owner.type,
            ownerPhone: bestMatch.owner.phone,
            ownerEmail: bestMatch.owner.email,
            relationshipType: this.determineRelationshipType(bestMatch.owner.type),
            relatedTransactionId: check.relatedInvoiceId,
            autoLinked: true,
            confidence: bestMatch.confidence,
            linkedAt: new Date().toISOString(),
            linkedBy: 'system'
          };

          existingIntegrations.push(integration);
          result.successfulLinks!++;

          if (bestMatch.confidence >= 80) {
            result.highConfidenceLinks!++;
          } else {
            result.lowConfidenceLinks!++;
          }
        } else {
          result.failedLinks!++;
          
          // إضافة اقتراح للربط اليدوي
          const suggestions = this.generateLinkingSuggestions(
            'check',
            check.id,
            check.customerName,
            { name: check.customerName, phone: check.customerPhone },
            [customers, suppliers, employees]
          );

          if (suggestions.length > 0) {
            result.suggestions!.push({
              entityType: 'check',
              entityId: check.id,
              entityName: `شيك رقم ${check.checkNumber}`,
              possibleOwners: suggestions
            });
          }
        }
      } catch (error) {
        result.errors!.push(`خطأ في ربط الشيك ${check.checkNumber}: ${error.message}`);
        result.failedLinks!++;
      }
    });

    storage.setItem('entity_integrations', existingIntegrations);
    return result;
  }

  // ربط ذكي للأقساط
  private linkInstallmentsSmartly(): Partial<SmartLinkingResult> {
    const installments = installmentsManager.getInstallments();
    const customers = storage.getItem('customers', []);
    const suppliers = storage.getItem('suppliers', []);
    const employees = storage.getItem('employees', []);
    const existingIntegrations = storage.getItem('entity_integrations', []);

    const result: Partial<SmartLinkingResult> = {
      totalProcessed: installments.length,
      successfulLinks: 0,
      failedLinks: 0,
      highConfidenceLinks: 0,
      lowConfidenceLinks: 0,
      duplicatesFound: 0,
      errors: [],
      suggestions: []
    };

    installments.forEach(installment => {
      try {
        // تحقق من وجود ربط موجود
        const existingLink = existingIntegrations.find((ei: any) => 
          ei.entityType === 'installment' && ei.entityId === installment.id
        );

        if (existingLink) {
          result.duplicatesFound!++;
          return;
        }

        // البحث عن أفضل مطابقة
        const bestMatch = this.findBestOwnerMatch(
          { name: installment.customerName, phone: installment.customerPhone },
          [
            ...customers.map((c: any) => ({ ...c, type: 'customer' })),
            ...suppliers.map((s: any) => ({ ...s, type: 'supplier' })),
            ...employees.map((e: any) => ({ ...e, type: 'employee' }))
          ]
        );

        if (bestMatch) {
          const integration: EntityIntegration = {
            id: `INT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            entityType: 'installment',
            entityId: installment.id,
            ownerId: bestMatch.owner.id,
            ownerName: bestMatch.owner.name,
            ownerType: bestMatch.owner.type,
            ownerPhone: bestMatch.owner.phone,
            ownerEmail: bestMatch.owner.email,
            relationshipType: this.determineRelationshipType(bestMatch.owner.type),
            relatedTransactionId: installment.originalInvoiceId,
            autoLinked: true,
            confidence: bestMatch.confidence,
            linkedAt: new Date().toISOString(),
            linkedBy: 'system'
          };

          existingIntegrations.push(integration);
          result.successfulLinks!++;

          if (bestMatch.confidence >= 80) {
            result.highConfidenceLinks!++;
          } else {
            result.lowConfidenceLinks!++;
          }
        } else {
          result.failedLinks!++;
          
          // إضافة اقتراح للربط اليدوي
          const suggestions = this.generateLinkingSuggestions(
            'installment',
            installment.id,
            installment.customerName,
            { name: installment.customerName, phone: installment.customerPhone },
            [customers, suppliers, employees]
          );

          if (suggestions.length > 0) {
            result.suggestions!.push({
              entityType: 'installment',
              entityId: installment.id,
              entityName: `قسط رقم ${installment.installmentNumber}`,
              possibleOwners: suggestions
            });
          }
        }
      } catch (error) {
        result.errors!.push(`خطأ في ربط القسط ${installment.installmentNumber}: ${error.message}`);
        result.failedLinks!++;
      }
    });

    storage.setItem('entity_integrations', existingIntegrations);
    return result;
  }

  // البحث عن أفضل مطابقة للمالك
  private findBestOwnerMatch(
    entityData: { name: string; phone: string },
    allOwners: any[]
  ): { owner: any; confidence: number } | null {
    let bestMatch: { owner: any; confidence: number } | null = null;

    allOwners.forEach(owner => {
      const confidence = this.calculateMatchConfidence(entityData, owner);
      
      if (confidence > 60 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { owner, confidence };
      }
    });

    return bestMatch;
  }

  // حساب دقة المطابقة
  private calculateMatchConfidence(
    entityData: { name: string; phone: string },
    owner: any
  ): number {
    let confidence = 0;

    // مطابقة الاسم (الوزن الأكبر)
    if (entityData.name && owner.name) {
      const nameMatch = this.calculateStringMatch(entityData.name, owner.name);
      confidence += nameMatch * 0.7; // 70% من الوزن للاسم
    }

    // مطابقة رقم الهاتف (دقة عالية)
    if (entityData.phone && owner.phone) {
      const phoneMatch = this.calculatePhoneMatch(entityData.phone, owner.phone);
      confidence += phoneMatch * 0.3; // 30% من الوزن للهاتف
    }

    return Math.min(confidence, 100);
  }

  // حساب مطابقة النص
  private calculateStringMatch(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 100;
    
    // استخدام خوارزمية Levenshtein distance
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    
    if (maxLength === 0) return 100;
    
    const similarity = ((maxLength - distance) / maxLength) * 100;
    return Math.max(similarity, 0);
  }

  // حساب مطابقة أرقام الهاتف
  private calculatePhoneMatch(phone1: string, phone2: string): number {
    if (!phone1 || !phone2) return 0;
    
    // تنظيف أرقام الهاتف
    const clean1 = phone1.replace(/\D/g, '');
    const clean2 = phone2.replace(/\D/g, '');
    
    if (clean1 === clean2) return 100;
    
    // مقارنة آخر 9 أرقام (للأرقام السعودية)
    const last9_1 = clean1.slice(-9);
    const last9_2 = clean2.slice(-9);
    
    if (last9_1 === last9_2 && last9_1.length === 9) return 90;
    
    return 0;
  }

  // حساب Levenshtein distance
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // تحديد نوع العلاقة
  private determineRelationshipType(ownerType: string): 'sales' | 'purchases' | 'salary' | 'other' {
    switch (ownerType) {
      case 'customer': return 'sales';
      case 'supplier': return 'purchases';
      case 'employee': return 'salary';
      default: return 'other';
    }
  }

  // توليد اقتراحات للربط
  private generateLinkingSuggestions(
    entityType: 'check' | 'installment',
    entityId: string,
    entityName: string,
    entityData: { name: string; phone: string },
    ownerGroups: any[][]
  ) {
    const suggestions: Array<{
      ownerId: string;
      ownerName: string;
      ownerType: 'customer' | 'supplier' | 'employee';
      confidence: number;
      reason: string;
    }> = [];

    const allOwners = [
      ...ownerGroups[0].map((c: any) => ({ ...c, type: 'customer' })),
      ...ownerGroups[1].map((s: any) => ({ ...s, type: 'supplier' })),
      ...ownerGroups[2].map((e: any) => ({ ...e, type: 'employee' }))
    ];

    allOwners.forEach(owner => {
      const confidence = this.calculateMatchConfidence(entityData, owner);
      
      if (confidence > 30) { // اقتراحات للمطابقات المحتملة
        let reason = '';
        
        if (confidence >= 60) reason = 'مطابقة قوية';
        else if (confidence >= 45) reason = 'مطابقة متوسطة';
        else reason = 'مطابقة ضعيفة';
        
        suggestions.push({
          ownerId: owner.id,
          ownerName: owner.name,
          ownerType: owner.type,
          confidence,
          reason
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  // حفظ سجل الربط الذكي
  private saveSmartLinkingLog(result: SmartLinkingResult): void {
    try {
      const logs = storage.getItem('smart_linking_logs', []);
      const newLog = {
        id: `LOG_${Date.now()}`,
        timestamp: new Date().toISOString(),
        result,
        performedBy: 'system'
      };
      
      logs.unshift(newLog);
      
      // الاحتفاظ بآخر 50 سجل فقط
      if (logs.length > 50) {
        logs.splice(50);
      }
      
      storage.setItem('smart_linking_logs', logs);
    } catch (error) {
      console.error('خطأ في حفظ سجل الربط الذكي:', error);
    }
  }

  // الحصول على تقرير شامل للربط
  getIntegrationReport() {
    try {
      const integrations = storage.getItem('entity_integrations', []);
      const checks = checksManager.getChecks();
      const installments = installmentsManager.getInstallments();

      const checkIntegrations = integrations.filter((i: any) => i.entityType === 'check');
      const installmentIntegrations = integrations.filter((i: any) => i.entityType === 'installment');

      const linkedChecks = checkIntegrations.length;
      const unlinkedChecks = checks.length - linkedChecks;
      const linkedInstallments = installmentIntegrations.length;
      const unlinkedInstallments = installments.length - linkedInstallments;

      const autoLinkedCount = integrations.filter((i: any) => i.autoLinked).length;
      const manualLinkedCount = integrations.filter((i: any) => !i.autoLinked).length;

      const highConfidenceCount = integrations.filter((i: any) => i.confidence >= 80).length;
      const mediumConfidenceCount = integrations.filter((i: any) => i.confidence >= 60 && i.confidence < 80).length;
      const lowConfidenceCount = integrations.filter((i: any) => i.confidence < 60).length;

      return {
        summary: {
          totalEntities: checks.length + installments.length,
          totalLinked: integrations.length,
          totalUnlinked: unlinkedChecks + unlinkedInstallments,
          linkingRate: checks.length + installments.length > 0 ? 
            (integrations.length / (checks.length + installments.length)) * 100 : 0
        },
        byEntityType: {
          checks: {
            total: checks.length,
            linked: linkedChecks,
            unlinked: unlinkedChecks,
            linkingRate: checks.length > 0 ? (linkedChecks / checks.length) * 100 : 0
          },
          installments: {
            total: installments.length,
            linked: linkedInstallments,
            unlinked: unlinkedInstallments,
            linkingRate: installments.length > 0 ? (linkedInstallments / installments.length) * 100 : 0
          }
        },
        byLinkingMethod: {
          autoLinked: autoLinkedCount,
          manualLinked: manualLinkedCount
        },
        byConfidence: {
          high: highConfidenceCount,
          medium: mediumConfidenceCount,
          low: lowConfidenceCount
        },
        lastSmartLinking: this.getLastSmartLinkingResult()
      };
    } catch (error) {
      console.error('خطأ في إنشاء تقرير الربط:', error);
      return null;
    }
  }

  // الحصول على آخر نتيجة للربط الذكي
  private getLastSmartLinkingResult() {
    try {
      const logs = storage.getItem('smart_linking_logs', []);
      return logs.length > 0 ? logs[0] : null;
    } catch (error) {
      console.error('خطأ في الحصول على آخر نتيجة ربط ذكي:', error);
      return null;
    }
  }

  // ربط يدوي لكيان محدد
  manualLink(
    entityType: 'check' | 'installment',
    entityId: string,
    ownerId: string,
    ownerType: 'customer' | 'supplier' | 'employee',
    linkedBy?: string
  ): boolean {
    try {
      const integrations = storage.getItem('entity_integrations', []);
      
      // تحقق من وجود ربط موجود
      const existingIntegration = integrations.find((i: any) => 
        i.entityType === entityType && i.entityId === entityId
      );

      if (existingIntegration) {
        // تحديث الربط الموجود
        existingIntegration.ownerId = ownerId;
        existingIntegration.ownerType = ownerType;
        existingIntegration.autoLinked = false;
        existingIntegration.confidence = 100; // الربط اليدوي دقته 100%
        existingIntegration.linkedAt = new Date().toISOString();
        existingIntegration.linkedBy = linkedBy || 'user';
      } else {
        // إنشاء ربط جديد
        let ownerData: any = {};
        
        // الحصول على بيانات المالك
        const dataKey = ownerType === 'customer' ? 'customers' : 
                       ownerType === 'supplier' ? 'suppliers' : 'employees';
        const owners = storage.getItem(dataKey, []);
        const owner = owners.find((o: any) => o.id === ownerId);
        
        if (owner) {
          ownerData = {
            ownerName: owner.name,
            ownerPhone: owner.phone,
            ownerEmail: owner.email
          };
        }

        const newIntegration: EntityIntegration = {
          id: `INT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          entityType,
          entityId,
          ownerId,
          ownerName: ownerData.ownerName,
          ownerType,
          ownerPhone: ownerData.ownerPhone,
          ownerEmail: ownerData.ownerEmail,
          relationshipType: this.determineRelationshipType(ownerType),
          autoLinked: false,
          confidence: 100,
          linkedAt: new Date().toISOString(),
          linkedBy: linkedBy || 'user'
        };

        integrations.push(newIntegration);
      }

      storage.setItem('entity_integrations', integrations);
      return true;
    } catch (error) {
      console.error('خطأ في الربط اليدوي:', error);
      return false;
    }
  }

  // إلغاء ربط كيان
  unlinkEntity(entityType: 'check' | 'installment', entityId: string): boolean {
    try {
      const integrations = storage.getItem('entity_integrations', []);
      const updatedIntegrations = integrations.filter((i: any) => 
        !(i.entityType === entityType && i.entityId === entityId)
      );
      
      storage.setItem('entity_integrations', updatedIntegrations);
      return true;
    } catch (error) {
      console.error('خطأ في إلغاء الربط:', error);
      return false;
    }
  }

  // الحصول على الكيانات المرتبطة بمالك معين
  getEntitiesByOwner(ownerId: string, ownerType: 'customer' | 'supplier' | 'employee') {
    try {
      const integrations = storage.getItem('entity_integrations', []);
      const ownerIntegrations = integrations.filter((i: any) => 
        i.ownerId === ownerId && i.ownerType === ownerType
      );

      const checks = checksManager.getChecks();
      const installments = installmentsManager.getInstallments();

      const linkedChecks = checks.filter(check => 
        ownerIntegrations.some((oi: any) => oi.entityType === 'check' && oi.entityId === check.id)
      );

      const linkedInstallments = installments.filter(installment => 
        ownerIntegrations.some((oi: any) => oi.entityType === 'installment' && oi.entityId === installment.id)
      );

      return {
        checks: linkedChecks,
        installments: linkedInstallments,
        integrations: ownerIntegrations
      };
    } catch (error) {
      console.error('خطأ في الحصول على الكيانات المرتبطة:', error);
      return { checks: [], installments: [], integrations: [] };
    }
  }
}

// Export singleton instance
export const unifiedIntegrationManager = UnifiedIntegrationManager.getInstance();