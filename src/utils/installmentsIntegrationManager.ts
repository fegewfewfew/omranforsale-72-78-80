import { installmentsManager, Installment } from './installmentsManager';
import { storage } from './storage';
import { checksManager } from './checksManager';
import { smartAlertsManager } from './smartAlertsManager';

export interface InstallmentIntegration {
  // ربط مع المبيعات
  createInstallmentFromInvoice: (invoiceId: string, installmentPlan: InstallmentPlan) => void;
  getInvoiceInstallments: (invoiceId: string) => Installment[];
  
  // ربط مع الشيكات
  linkCheckToInstallment: (installmentId: string, checkId: string) => void;
  getInstallmentChecks: (installmentId: string) => any[];
  
  // التنبيهات والإشعارات
  checkOverdueInstallments: () => void;
  sendPaymentReminders: () => void;
  
  // التقارير والتحليلات
  generateInstallmentReport: (customerId?: string, dateRange?: DateRange) => InstallmentReport;
  getInstallmentAnalytics: () => InstallmentAnalytics;
}

interface InstallmentPlan {
  numberOfInstallments: number;
  installmentAmount: number;
  startDate: string;
  frequency: 'monthly' | 'weekly' | 'quarterly';
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface InstallmentReport {
  summary: {
    totalInstallments: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    overdueAmount: number;
  };
  customerBreakdown: Array<{
    customerId: string;
    customerName: string;
    installments: Installment[];
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  }>;
  timeline: Array<{
    date: string;
    dueAmount: number;
    paidAmount: number;
    overdueAmount: number;
  }>;
}

interface InstallmentAnalytics {
  paymentTrends: {
    onTimePayments: number;
    latePayments: number;
    missedPayments: number;
  };
  customerPerformance: Array<{
    customerId: string;
    customerName: string;
    paymentScore: number;
    averageDelayDays: number;
  }>;
  financialProjections: {
    expectedRevenue: number;
    projectedCollections: number;
    riskAmount: number;
  };
}

class InstallmentsIntegrationManager implements InstallmentIntegration {
  // ربط مع المبيعات
  createInstallmentFromInvoice(invoiceId: string, installmentPlan: InstallmentPlan): void {
    const invoices = storage.getItem('invoices', []);
    const invoice = invoices.find((inv: any) => inv.id === invoiceId);
    
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة');
    }

    // إنشاء الأقساط بناء على خطة التقسيط
    for (let i = 0; i < installmentPlan.numberOfInstallments; i++) {
      const dueDate = this.calculateDueDate(installmentPlan.startDate, installmentPlan.frequency, i);
      
      const customer = storage.getItem('customers', []).find((c: any) => c.id === invoice.customerId);
      
      const installment: Omit<Installment, 'id'> = {
        customerId: invoice.customerId,
        customerName: customer?.name || 'غير محدد',
        customerPhone: customer?.phone || '',
        originalInvoiceId: invoiceId,
        originalInvoiceNumber: invoice.invoiceNumber,
        installmentNumber: (i + 1).toString(),
        installmentAmount: installmentPlan.installmentAmount,
        installmentPeriod: installmentPlan.frequency === 'monthly' ? 1 : installmentPlan.frequency === 'quarterly' ? 3 : 0.25,
        totalAmount: installmentPlan.installmentAmount,
        paidAmount: 0,
        remainingAmount: installmentPlan.installmentAmount,
        dueDate,
        startDate: installmentPlan.startDate,
        status: 'active',
        createdAt: new Date().toISOString(),
        paymentHistory: []
      };

      installmentsManager.addInstallment(installment);
    }

    // تحديث الفاتورة لتشير إلى وجود أقساط
    const updatedInvoices = invoices.map((inv: any) => 
      inv.id === invoiceId 
        ? { ...inv, hasInstallments: true, installmentPlan }
        : inv
    );
    storage.setItem('invoices', updatedInvoices);
  }

  getInvoiceInstallments(invoiceId: string): Installment[] {
    return installmentsManager.getInstallments().filter(
      installment => installment.originalInvoiceId === invoiceId
    );
  }

  // ربط مع الشيكات
  linkCheckToInstallment(installmentId: string, checkId: string): void {
    const installments = installmentsManager.getInstallments();
    const installment = installments.find(inst => inst.id === installmentId);
    
    if (!installment) {
      throw new Error('القسط غير موجود');
    }

    // إضافة معرف الشيك إلى القسط
    const updatedInstallment = {
      ...installment,
      linkedCheckId: checkId
    };

    installmentsManager.updateInstallment(installmentId, updatedInstallment);

    // تحديث الشيك ليشير إلى القسط
    const checks = storage.getItem('checks', []);
    const updatedChecks = checks.map((check: any) =>
      check.id === checkId
        ? { ...check, linkedInstallmentId: installmentId }
        : check
    );
    storage.setItem('checks', updatedChecks);
  }

  getInstallmentChecks(installmentId: string): any[] {
    const checks = storage.getItem('checks', []);
    return checks.filter((check: any) => check.linkedInstallmentId === installmentId);
  }

  // التنبيهات والإشعارات
  checkOverdueInstallments(): void {
    const installments = installmentsManager.getInstallments();
    const today = new Date();
    const customers = storage.getItem('customers', []);
    let updatedCount = 0;

    installments.forEach(installment => {
      const dueDate = new Date(installment.dueDate);
      const isOverdue = installment.status === 'active' && dueDate < today;

      if (isOverdue && installment.status !== 'overdue') {
        // تحديث حالة القسط إلى متأخر
        installmentsManager.updateInstallment(installment.id!, {
          ...installment,
          status: 'overdue'
        });

        updatedCount++;
        
        // إرسال تنبيه وحفظه في الذاكرة
        const customer = customers.find((c: any) => c.id === installment.customerId);
        const alertMessage = `القسط رقم ${installment.installmentNumber} للعميل ${customer?.name || 'غير محدد'} متأخر عن موعد الاستحقاق`;
        
        // حفظ التنبيه في localStorage للوصول إليه لاحقاً
        const alerts = storage.getItem('installmentAlerts', []);
        alerts.push({
          id: Date.now(),
          installmentId: installment.id,
          customerId: installment.customerId,
          message: alertMessage,
          type: 'overdue',
          createdAt: new Date().toISOString(),
          read: false
        });
        storage.setItem('installmentAlerts', alerts);
        
        console.log(`تنبيه: ${alertMessage}`);
      }
    });

    if (updatedCount > 0) {
      console.log(`تم تحديث ${updatedCount} قسط إلى حالة متأخر`);
    }
  }

  sendPaymentReminders(): void {
    const installments = installmentsManager.getInstallments();
    const today = new Date();
    const reminderDays = 3; // إرسال تذكير قبل 3 أيام من الاستحقاق
    const customers = storage.getItem('customers', []);
    let remindersSent = 0;

    installments.forEach(installment => {
      if (installment.status !== 'active') return;

      const dueDate = new Date(installment.dueDate);
      const daysDifference = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

      if (daysDifference === reminderDays) {
        const customer = customers.find((c: any) => c.id === installment.customerId);
        const reminderMessage = `يستحق القسط رقم ${installment.installmentNumber} للعميل ${customer?.name || 'غير محدد'} خلال ${reminderDays} أيام`;
        
        // حفظ التذكير في localStorage
        const alerts = storage.getItem('installmentAlerts', []);
        alerts.push({
          id: Date.now() + Math.random(),
          installmentId: installment.id,
          customerId: installment.customerId,
          message: reminderMessage,
          type: 'upcoming',
          createdAt: new Date().toISOString(),
          read: false
        });
        storage.setItem('installmentAlerts', alerts);
        
        remindersSent++;
        console.log(`تذكير: ${reminderMessage}`);
      }
    });

    if (remindersSent > 0) {
      console.log(`تم إرسال ${remindersSent} تذكير للأقساط المستحقة`);
    }
  }

  // التقارير والتحليلات
  generateInstallmentReport(customerId?: string, dateRange?: DateRange): InstallmentReport {
    let installments = installmentsManager.getInstallments();
    const customers = storage.getItem('customers', []);

    // تطبيق فلترة العميل
    if (customerId) {
      installments = installments.filter(inst => inst.customerId === customerId);
    }

    // تطبيق فلترة التاريخ
    if (dateRange) {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      installments = installments.filter(inst => {
        const dueDate = new Date(inst.dueDate);
        return dueDate >= startDate && dueDate <= endDate;
      });
    }

    // حساب الملخص
    const summary = {
      totalInstallments: installments.length,
      totalAmount: installments.reduce((sum, inst) => sum + inst.totalAmount, 0),
      paidAmount: installments.reduce((sum, inst) => sum + inst.paidAmount, 0),
      remainingAmount: installments.reduce((sum, inst) => sum + inst.remainingAmount, 0),
      overdueAmount: installments
        .filter(inst => inst.status === 'overdue')
        .reduce((sum, inst) => sum + inst.remainingAmount, 0)
    };

    // تجميع البيانات حسب العميل
    const customerGroups = new Map();
    installments.forEach(inst => {
      if (!customerGroups.has(inst.customerId)) {
        const customer = customers.find((c: any) => c.id === inst.customerId);
        customerGroups.set(inst.customerId, {
          customerId: inst.customerId,
          customerName: customer?.name || 'غير محدد',
          installments: [],
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0
        });
      }
      
      const group = customerGroups.get(inst.customerId);
      group.installments.push(inst);
      group.totalAmount += inst.totalAmount;
      group.paidAmount += inst.paidAmount;
      group.remainingAmount += inst.remainingAmount;
    });

    const customerBreakdown = Array.from(customerGroups.values());

    // إنشاء الجدول الزمني
    const timeline = this.generateTimeline(installments);

    return {
      summary,
      customerBreakdown,
      timeline
    };
  }

  getInstallmentAnalytics(): InstallmentAnalytics {
    const installments = installmentsManager.getInstallments();
    const customers = storage.getItem('customers', []);

    // تحليل اتجاهات الدفع
    const paymentTrends = {
      onTimePayments: 0,
      latePayments: 0,
      missedPayments: 0
    };

    installments.forEach(inst => {
      inst.paymentHistory.forEach(payment => {
        const dueDate = new Date(inst.dueDate);
        const paymentDate = new Date(payment.date);
        
        if (paymentDate <= dueDate) {
          paymentTrends.onTimePayments++;
        } else {
          paymentTrends.latePayments++;
        }
      });
      
      if (inst.status === 'overdue') {
        paymentTrends.missedPayments++;
      }
    });

    // تحليل أداء العملاء
    const customerPerformance = customers.map((customer: any) => {
      const customerInstallments = installments.filter(inst => inst.customerId === customer.id);
      
      let totalDelayDays = 0;
      let delayCount = 0;
      let onTimeCount = 0;

      customerInstallments.forEach(inst => {
        inst.paymentHistory.forEach(payment => {
          const dueDate = new Date(inst.dueDate);
          const paymentDate = new Date(payment.date);
          const delayDays = Math.max(0, Math.ceil((paymentDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));
          
          if (delayDays > 0) {
            totalDelayDays += delayDays;
            delayCount++;
          } else {
            onTimeCount++;
          }
        });
      });

      const averageDelayDays = delayCount > 0 ? totalDelayDays / delayCount : 0;
      const paymentScore = onTimeCount / (onTimeCount + delayCount) * 100 || 0;

      return {
        customerId: customer.id,
        customerName: customer.name,
        paymentScore: Math.round(paymentScore),
        averageDelayDays: Math.round(averageDelayDays)
      };
    });

    // التوقعات المالية
    const activeInstallments = installments.filter(inst => inst.status === 'active');
    const financialProjections = {
      expectedRevenue: activeInstallments.reduce((sum, inst) => sum + inst.remainingAmount, 0),
      projectedCollections: activeInstallments.reduce((sum, inst) => sum + inst.remainingAmount * 0.9, 0), // افتراض تحصيل 90%
      riskAmount: installments
        .filter(inst => inst.status === 'overdue')
        .reduce((sum, inst) => sum + inst.remainingAmount, 0)
    };

    return {
      paymentTrends,
      customerPerformance,
      financialProjections
    };
  }

  private calculateDueDate(startDate: string, frequency: string, installmentIndex: number): string {
    const date = new Date(startDate);
    
    switch (frequency) {
      case 'monthly':
        date.setMonth(date.getMonth() + installmentIndex);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (installmentIndex * 7));
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + (installmentIndex * 3));
        break;
    }
    
    return date.toISOString();
  }

  private generateTimeline(installments: Installment[]): Array<{
    date: string;
    dueAmount: number;
    paidAmount: number;
    overdueAmount: number;
  }> {
    const timelineMap = new Map();
    
    installments.forEach(inst => {
      const dueDate = new Date(inst.dueDate).toDateString();
      
      if (!timelineMap.has(dueDate)) {
        timelineMap.set(dueDate, {
          date: dueDate,
          dueAmount: 0,
          paidAmount: 0,
          overdueAmount: 0
        });
      }
      
      const entry = timelineMap.get(dueDate);
      entry.dueAmount += inst.totalAmount;
      entry.paidAmount += inst.paidAmount;
      
      if (inst.status === 'overdue') {
        entry.overdueAmount += inst.remainingAmount;
      }
    });
    
    return Array.from(timelineMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }
}

export const installmentsIntegrationManager = new InstallmentsIntegrationManager();