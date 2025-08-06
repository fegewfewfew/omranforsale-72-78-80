import { storage } from './storage';
import { checksManager } from './checksManager';
import { installmentsManager } from './installmentsManager';

export interface IntegrationResult {
  success: boolean;
  linkedChecks: number;
  linkedInstallments: number;
  errors: string[];
  warnings: string[];
}

export class ChecksInstallmentsIntegrator {
  private static instance: ChecksInstallmentsIntegrator;

  static getInstance(): ChecksInstallmentsIntegrator {
    if (!ChecksInstallmentsIntegrator.instance) {
      ChecksInstallmentsIntegrator.instance = new ChecksInstallmentsIntegrator();
    }
    return ChecksInstallmentsIntegrator.instance;
  }

  // تشغيل عملية الترابط الشاملة
  async runFullIntegration(): Promise<IntegrationResult> {
    console.log('🚀 بدء عملية ربط الشيكات والأقساط بأصحابها...');
    
    const result: IntegrationResult = {
      success: true,
      linkedChecks: 0,
      linkedInstallments: 0,
      errors: [],
      warnings: []
    };

    try {
      // 1. ربط الشيكات بأصحابها
      const checksResult = await this.linkChecksWithOwners();
      result.linkedChecks = checksResult.linked;
      if (checksResult.failed > 0) {
        result.warnings.push(`فشل في ربط ${checksResult.failed} شيك`);
      }

      // 2. ربط الأقساط بالعملاء
      const installmentsResult = await this.linkInstallmentsWithCustomers();
      result.linkedInstallments = installmentsResult.linked;
      if (installmentsResult.failed > 0) {
        result.warnings.push(`فشل في ربط ${installmentsResult.failed} قسط`);
      }

      // 3. تحديث سجلات العملاء والموردين
      await this.updateEntityRecords();

      // 4. مزامنة مع التدفق النقدي
      await this.syncWithCashFlow();

      // 5. إنشاء تنبيهات للشيكات والأقساط المستحقة
      await this.createDueAlerts();

      console.log(`✅ تم ربط ${result.linkedChecks} شيك و ${result.linkedInstallments} قسط بنجاح`);
      
    } catch (error) {
      console.error('❌ خطأ في عملية الربط:', error);
      result.success = false;
      result.errors.push(`خطأ عام: ${error}`);
    }

    return result;
  }

  // ربط الشيكات بأصحابها (عملاء/موردين)
  private async linkChecksWithOwners(): Promise<{ linked: number; failed: number }> {
    try {
      console.log('🔗 ربط الشيكات بأصحابها...');
      
      const checks = storage.getItem('checks', []);
      const customers = storage.getItem('customers', []);
      const suppliers = storage.getItem('suppliers', []);
      let linked = 0;
      let failed = 0;

      for (const check of checks) {
        if (!check.customerId && !check.supplierId) {
          // محاولة الربط مع العميل أولاً
          const customer = customers.find((c: any) => 
            c.name === check.customerName ||
            c.phone === check.customerPhone ||
            (check.customerName && c.name.includes(check.customerName.trim()))
          );

          if (customer) {
            check.customerId = customer.id;
            check.entityType = 'customer';
            linked++;

            // تحديث سجل العميل
            customer.totalChecks = (customer.totalChecks || 0) + 1;
            customer.checkAmount = (customer.checkAmount || 0) + check.amount;
            
            if (check.status === 'pending') {
              customer.pendingChecks = (customer.pendingChecks || 0) + 1;
              customer.pendingCheckAmount = (customer.pendingCheckAmount || 0) + check.amount;
            }
            
            continue;
          }

          // محاولة الربط مع المورد
          const supplier = suppliers.find((s: any) => 
            s.name === check.customerName ||
            s.phone === check.customerPhone ||
            (check.customerName && s.name.includes(check.customerName.trim()))
          );

          if (supplier) {
            check.supplierId = supplier.id;
            check.entityType = 'supplier';
            linked++;

            // تحديث سجل المورد
            supplier.totalChecks = (supplier.totalChecks || 0) + 1;
            supplier.checkAmount = (supplier.checkAmount || 0) + check.amount;
            
            if (check.status === 'pending') {
              supplier.pendingChecks = (supplier.pendingChecks || 0) + 1;
              supplier.pendingCheckAmount = (supplier.pendingCheckAmount || 0) + check.amount;
            }
          } else {
            failed++;
          }
        }
      }

      // حفظ التحديثات
      storage.setItem('checks', checks);
      storage.setItem('customers', customers);
      storage.setItem('suppliers', suppliers);

      console.log(`✅ تم ربط ${linked} شيك، فشل في ربط ${failed} شيك`);
      return { linked, failed };

    } catch (error) {
      console.error('❌ خطأ في ربط الشيكات:', error);
      return { linked: 0, failed: 0 };
    }
  }

  // ربط الأقساط بالعملاء
  private async linkInstallmentsWithCustomers(): Promise<{ linked: number; failed: number }> {
    try {
      console.log('🔗 ربط الأقساط بالعملاء...');
      
      const installments = storage.getItem('installments', []);
      const customers = storage.getItem('customers', []);
      let linked = 0;
      let failed = 0;

      for (const installment of installments) {
        if (!installment.customerId && installment.customerName) {
          const customer = customers.find((c: any) => 
            c.name === installment.customerName ||
            c.phone === installment.customerPhone ||
            (installment.customerName && c.name.includes(installment.customerName.trim()))
          );

          if (customer) {
            installment.customerId = customer.id;
            linked++;

            // تحديث سجل العميل
            customer.hasInstallments = true;
            customer.totalInstallments = (customer.totalInstallments || 0) + 1;
            customer.installmentAmount = (customer.installmentAmount || 0) + installment.totalAmount;
            customer.remainingInstallmentAmount = (customer.remainingInstallmentAmount || 0) + installment.remainingAmount;
            
            // إضافة تفاصيل القسط
            if (!customer.installmentDetails) {
              customer.installmentDetails = [];
            }
            
            customer.installmentDetails.push({
              id: installment.id,
              installmentNumber: installment.installmentNumber,
              totalAmount: installment.totalAmount,
              paidAmount: installment.paidAmount,
              remainingAmount: installment.remainingAmount,
              status: installment.status,
              dueDate: installment.dueDate,
              startDate: installment.startDate
            });

            // تحديد حالة العميل بناءً على الأقساط
            if (installment.status === 'overdue') {
              customer.hasOverdueInstallments = true;
              customer.overdueInstallments = (customer.overdueInstallments || 0) + 1;
            }
          } else {
            failed++;
          }
        }
      }

      // حفظ التحديثات
      storage.setItem('installments', installments);
      storage.setItem('customers', customers);

      console.log(`✅ تم ربط ${linked} قسط، فشل في ربط ${failed} قسط`);
      return { linked, failed };

    } catch (error) {
      console.error('❌ خطأ في ربط الأقساط:', error);
      return { linked: 0, failed: 0 };
    }
  }

  // تحديث سجلات العملاء والموردين
  private async updateEntityRecords(): Promise<void> {
    try {
      console.log('📊 تحديث سجلات العملاء والموردين...');
      
      const customers = storage.getItem('customers', []);
      const suppliers = storage.getItem('suppliers', []);
      
      // تحديث سجلات العملاء
      for (const customer of customers) {
        const customerChecks = checksManager.getChecksByCustomer(customer.id);
        const customerInstallments = installmentsManager.getInstallmentsByCustomer(customer.id);
        
        // إحصائيات الشيكات
        const pendingChecks = customerChecks.filter(c => c.status === 'pending');
        const cashedChecks = customerChecks.filter(c => c.status === 'cashed');
        const bouncedChecks = customerChecks.filter(c => c.status === 'bounced');
        
        customer.checksStats = {
          total: customerChecks.length,
          pending: pendingChecks.length,
          cashed: cashedChecks.length,
          bounced: bouncedChecks.length,
          totalAmount: customerChecks.reduce((sum, c) => sum + c.amount, 0),
          pendingAmount: pendingChecks.reduce((sum, c) => sum + c.amount, 0)
        };

        // إحصائيات الأقساط
        const activeInstallments = customerInstallments.filter(i => i.status === 'active');
        const completedInstallments = customerInstallments.filter(i => i.status === 'completed');
        const overdueInstallments = customerInstallments.filter(i => i.status === 'overdue');
        
        customer.installmentsStats = {
          total: customerInstallments.length,
          active: activeInstallments.length,
          completed: completedInstallments.length,
          overdue: overdueInstallments.length,
          totalAmount: customerInstallments.reduce((sum, i) => sum + i.totalAmount, 0),
          paidAmount: customerInstallments.reduce((sum, i) => sum + i.paidAmount, 0),
          remainingAmount: customerInstallments.reduce((sum, i) => sum + i.remainingAmount, 0)
        };

        // تحديث تصنيف المخاطر
        customer.riskLevel = this.calculateCustomerRiskLevel(customer);
      }

      // تحديث سجلات الموردين
      for (const supplier of suppliers) {
        const supplierChecks = checksManager.getChecksBySupplier(supplier.id);
        
        const pendingChecks = supplierChecks.filter(c => c.status === 'pending');
        const cashedChecks = supplierChecks.filter(c => c.status === 'cashed');
        const bouncedChecks = supplierChecks.filter(c => c.status === 'bounced');
        
        supplier.checksStats = {
          total: supplierChecks.length,
          pending: pendingChecks.length,
          cashed: cashedChecks.length,
          bounced: bouncedChecks.length,
          totalAmount: supplierChecks.reduce((sum, c) => sum + c.amount, 0),
          pendingAmount: pendingChecks.reduce((sum, c) => sum + c.amount, 0)
        };
      }

      // حفظ التحديثات
      storage.setItem('customers', customers);
      storage.setItem('suppliers', suppliers);

      console.log('✅ تم تحديث سجلات العملاء والموردين');

    } catch (error) {
      console.error('❌ خطأ في تحديث سجلات العملاء والموردين:', error);
    }
  }

  // حساب مستوى المخاطر للعميل
  private calculateCustomerRiskLevel(customer: any): 'منخفض' | 'متوسط' | 'عالي' {
    let riskScore = 0;

    // عوامل الخطر من الشيكات
    if (customer.checksStats) {
      const bounceRate = customer.checksStats.total > 0 ? 
        (customer.checksStats.bounced / customer.checksStats.total) * 100 : 0;
      
      if (bounceRate > 20) riskScore += 3;
      else if (bounceRate > 10) riskScore += 2;
      else if (bounceRate > 5) riskScore += 1;
    }

    // عوامل الخطر من الأقساط
    if (customer.installmentsStats) {
      const overdueRate = customer.installmentsStats.total > 0 ? 
        (customer.installmentsStats.overdue / customer.installmentsStats.total) * 100 : 0;
      
      if (overdueRate > 30) riskScore += 3;
      else if (overdueRate > 15) riskScore += 2;
      else if (overdueRate > 5) riskScore += 1;
    }

    // تصنيف المخاطر
    if (riskScore >= 5) return 'عالي';
    if (riskScore >= 3) return 'متوسط';
    return 'منخفض';
  }

  // مزامنة مع التدفق النقدي
  private async syncWithCashFlow(): Promise<void> {
    try {
      console.log('💰 مزامنة مع التدفق النقدي...');
      
      checksManager.syncWithCashFlow();
      installmentsManager.syncWithCashFlow();
      
      console.log('✅ تم مزامنة الشيكات والأقساط مع التدفق النقدي');

    } catch (error) {
      console.error('❌ خطأ في مزامنة التدفق النقدي:', error);
    }
  }

  // إنشاء تنبيهات للشيكات والأقساط المستحقة
  private async createDueAlerts(): Promise<void> {
    try {
      console.log('🔔 إنشاء تنبيهات للمستحقات...');
      
      const overdueChecks = checksManager.getOverdueChecks();
      const checksDueSoon = checksManager.getChecksDueSoon();
      const overdueInstallments = installmentsManager.getOverdueInstallments();
      const installmentsDueSoon = installmentsManager.getInstallmentsDueSoon();

      const alerts = [];

      // تنبيهات الشيكات المتأخرة
      overdueChecks.forEach(check => {
        alerts.push({
          id: `OVERDUE_CHECK_${check.id}`,
          type: 'overdue_check',
          title: 'شيك متأخر',
          message: `الشيك رقم ${check.checkNumber} متأخر عن موعد الاستحقاق`,
          severity: 'high',
          entityId: check.customerId || check.supplierId,
          entityType: check.entityType,
          amount: check.amount,
          dueDate: check.dueDate,
          createdAt: new Date().toISOString()
        });
      });

      // تنبيهات الشيكات المستحقة قريباً
      checksDueSoon.forEach(check => {
        alerts.push({
          id: `DUE_SOON_CHECK_${check.id}`,
          type: 'due_soon_check',
          title: 'شيك مستحق قريباً',
          message: `الشيك رقم ${check.checkNumber} مستحق خلال أسبوع`,
          severity: 'medium',
          entityId: check.customerId || check.supplierId,
          entityType: check.entityType,
          amount: check.amount,
          dueDate: check.dueDate,
          createdAt: new Date().toISOString()
        });
      });

      // تنبيهات الأقساط المتأخرة
      overdueInstallments.forEach(installment => {
        alerts.push({
          id: `OVERDUE_INSTALLMENT_${installment.id}`,
          type: 'overdue_installment',
          title: 'قسط متأخر',
          message: `القسط ${installment.installmentNumber} متأخر عن موعد الاستحقاق`,
          severity: 'high',
          entityId: installment.customerId,
          entityType: 'customer',
          amount: installment.remainingAmount,
          dueDate: installment.dueDate,
          createdAt: new Date().toISOString()
        });
      });

      // تنبيهات الأقساط المستحقة قريباً
      installmentsDueSoon.forEach(installment => {
        alerts.push({
          id: `DUE_SOON_INSTALLMENT_${installment.id}`,
          type: 'due_soon_installment',
          title: 'قسط مستحق قريباً',
          message: `القسط ${installment.installmentNumber} مستحق خلال أسبوع`,
          severity: 'medium',
          entityId: installment.customerId,
          entityType: 'customer',
          amount: installment.remainingAmount,
          dueDate: installment.dueDate,
          createdAt: new Date().toISOString()
        });
      });

      // حفظ التنبيهات
      storage.setItem('financial_alerts', alerts);
      
      console.log(`✅ تم إنشاء ${alerts.length} تنبيه للمستحقات`);

    } catch (error) {
      console.error('❌ خطأ في إنشاء التنبيهات:', error);
    }
  }

  // الحصول على إحصائيات الترابط
  getIntegrationStats() {
    try {
      const checks = storage.getItem('checks', []);
      const installments = storage.getItem('installments', []);
      
      const linkedChecks = checks.filter((c: any) => c.customerId || c.supplierId).length;
      const unlinkedChecks = checks.length - linkedChecks;
      
      const linkedInstallments = installments.filter((i: any) => i.customerId).length;
      const unlinkedInstallments = installments.length - linkedInstallments;

      return {
        checks: {
          total: checks.length,
          linked: linkedChecks,
          unlinked: unlinkedChecks,
          linkageRate: checks.length > 0 ? (linkedChecks / checks.length) * 100 : 0
        },
        installments: {
          total: installments.length,
          linked: linkedInstallments,
          unlinked: unlinkedInstallments,
          linkageRate: installments.length > 0 ? (linkedInstallments / installments.length) * 100 : 0
        }
      };
    } catch (error) {
      console.error('❌ خطأ في الحصول على إحصائيات الترابط:', error);
      return {
        checks: { total: 0, linked: 0, unlinked: 0, linkageRate: 0 },
        installments: { total: 0, linked: 0, unlinked: 0, linkageRate: 0 }
      };
    }
  }
}

// Export singleton instance
export const checksInstallmentsIntegrator = ChecksInstallmentsIntegrator.getInstance();