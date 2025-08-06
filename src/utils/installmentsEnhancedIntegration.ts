import { installmentsManager } from './installmentsManager';
import { storage } from './storage';
import { checksManager } from './checksManager';

export interface InstallmentEnhancedIntegration {
  // ربط متقدم مع المبيعات
  linkInstallmentToSalesInvoice: (installmentId: string, invoiceId: string) => void;
  getInstallmentSalesHistory: (customerId: string) => any[];
  
  // ربط متقدم مع الشيكات
  createCheckForInstallment: (installmentId: string, checkData: any) => void;
  getInstallmentPaymentMethods: (installmentId: string) => any[];
  
  // ربط مع العملاء
  getCustomerInstallmentSummary: (customerId: string) => any;
  updateCustomerCreditScore: (customerId: string) => void;
  
  // تحليلات متقدمة
  getInstallmentProfitability: () => any;
  getCustomerPaymentBehavior: (customerId: string) => any;
  
  // إدارة المخاطر
  assessInstallmentRisk: (installmentId: string) => any;
  generateRiskReport: () => any;
}

class InstallmentsEnhancedIntegrationService implements InstallmentEnhancedIntegration {
  
  // ربط متقدم مع المبيعات
  linkInstallmentToSalesInvoice(installmentId: string, invoiceId: string): void {
    const installments = installmentsManager.getInstallments();
    const installment = installments.find(inst => inst.id === installmentId);
    if (!installment) throw new Error('القسط غير موجود');

    const invoices = storage.getItem('invoices', []);
    const invoice = invoices.find((inv: any) => inv.id === invoiceId);
    if (!invoice) throw new Error('الفاتورة غير موجودة');

    // ربط القسط بالفاتورة
    const updatedInstallment = {
      ...installment,
      linkedInvoiceId: invoiceId,
      originalInvoiceNumber: invoice.invoiceNumber,
      linkedInvoiceData: {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.date,
        items: invoice.items
      }
    };

    installmentsManager.updateInstallment(installmentId, updatedInstallment);

    // تحديث الفاتورة لتشمل معرف القسط
    const updatedInvoices = invoices.map((inv: any) =>
      inv.id === invoiceId
        ? { ...inv, linkedInstallmentId: installmentId, hasInstallments: true }
        : inv
    );
    storage.setItem('invoices', updatedInvoices);
  }

  getInstallmentSalesHistory(customerId: string): any[] {
    const installments = installmentsManager.getInstallmentsByCustomer(customerId);
    const invoices = storage.getItem('invoices', []);
    
    return installments.map(installment => {
      const linkedInvoice = invoices.find((inv: any) => 
        inv.id === (installment as any).linkedInvoiceId || 
        inv.linkedInstallmentId === installment.id
      );
      
      return {
        installment,
        linkedInvoice,
        salesAmount: linkedInvoice?.totalAmount || 0,
        profit: linkedInvoice ? (linkedInvoice.totalAmount - (linkedInvoice.cost || 0)) : 0
      };
    });
  }

  // ربط متقدم مع الشيكات
  createCheckForInstallment(installmentId: string, checkData: any): void {
    const installments = installmentsManager.getInstallments();
    const installment = installments.find(inst => inst.id === installmentId);
    if (!installment) throw new Error('القسط غير موجود');

    const checkToCreate = {
      ...checkData,
      linkedInstallmentId: installmentId,
      customerName: installment.customerName,
      customerId: installment.customerId,
      type: 'installment_payment',
      createdAt: new Date().toISOString()
    };

    // إضافة الشيك
    const checks = storage.getItem('checks', []);
    const newCheck = {
      id: Date.now().toString(),
      ...checkToCreate
    };
    checks.push(newCheck);
    storage.setItem('checks', checks);

    // ربط الشيك بالقسط
    const updatedInstallment = {
      ...installment,
      linkedChecks: [...((installment as any).linkedChecks || []), newCheck.id],
      paymentMethods: [...((installment as any).paymentMethods || []), {
        type: 'check',
        checkId: newCheck.id,
        amount: checkData.amount,
        date: checkData.dueDate
      }]
    };

    installmentsManager.updateInstallment(installmentId, updatedInstallment);
  }

  getInstallmentPaymentMethods(installmentId: string): any[] {
    const installments = installmentsManager.getInstallments();
    const installment = installments.find(inst => inst.id === installmentId);
    if (!installment) return [];

    const checks = storage.getItem('checks', []);
    const linkedChecks = checks.filter((check: any) => 
      check.linkedInstallmentId === installmentId
    );

    return [
      ...installment.paymentHistory.map((payment: any) => ({
        ...payment,
        type: payment.paymentMethod || 'cash'
      })),
      ...linkedChecks.map((check: any) => ({
        type: 'check',
        amount: check.amount,
        date: check.dueDate,
        status: check.status,
        checkNumber: check.checkNumber
      }))
    ];
  }

  // ربط مع العملاء
  getCustomerInstallmentSummary(customerId: string): any {
    const installments = installmentsManager.getInstallmentsByCustomer(customerId);
    const customer = storage.getItem('customers', []).find((c: any) => c.id === customerId);
    
    const summary = {
      customerId,
      customerName: customer?.name || 'غير محدد',
      totalInstallments: installments.length,
      activeInstallments: installments.filter(i => i.status === 'active').length,
      completedInstallments: installments.filter(i => i.status === 'completed').length,
      overdueInstallments: installments.filter(i => i.status === 'overdue').length,
      totalAmount: installments.reduce((sum, i) => sum + i.totalAmount, 0),
      paidAmount: installments.reduce((sum, i) => sum + i.paidAmount, 0),
      remainingAmount: installments.reduce((sum, i) => sum + i.remainingAmount, 0),
      averagePaymentDelay: this.calculateAveragePaymentDelay(installments),
      creditScore: this.calculateCreditScore(installments),
      paymentReliability: this.calculatePaymentReliability(installments)
    };

    return summary;
  }

  updateCustomerCreditScore(customerId: string): void {
    const summary = this.getCustomerInstallmentSummary(customerId);
    const customers = storage.getItem('customers', []);
    
    const updatedCustomers = customers.map((customer: any) =>
      customer.id === customerId
        ? {
            ...customer,
            creditScore: summary.creditScore,
            paymentReliability: summary.paymentReliability,
            lastCreditUpdate: new Date().toISOString()
          }
        : customer
    );
    
    storage.setItem('customers', updatedCustomers);
  }

  // تحليلات متقدمة
  getInstallmentProfitability(): any {
    const installments = installmentsManager.getInstallments();
    const invoices = storage.getItem('invoices', []);
    
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    installments.forEach(installment => {
      const linkedInvoice = invoices.find((inv: any) => 
        inv.id === (installment as any).linkedInvoiceId || 
        inv.linkedInstallmentId === installment.id
      );
      
      if (linkedInvoice) {
        totalRevenue += installment.paidAmount;
        totalCost += linkedInvoice.cost || 0;
        totalProfit += installment.paidAmount - (linkedInvoice.cost || 0);
      }
    });

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      installmentCount: installments.length,
      averageProfitPerInstallment: installments.length > 0 ? totalProfit / installments.length : 0
    };
  }

  getCustomerPaymentBehavior(customerId: string): any {
    const installments = installmentsManager.getInstallmentsByCustomer(customerId);
    
    let onTimePayments = 0;
    let latePayments = 0;
    let totalDelayDays = 0;
    
    installments.forEach(installment => {
      installment.paymentHistory.forEach(payment => {
        const dueDate = new Date(installment.dueDate);
        const paymentDate = new Date(payment.date);
        const delayDays = Math.max(0, Math.ceil((paymentDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));
        
        if (delayDays === 0) {
          onTimePayments++;
        } else {
          latePayments++;
          totalDelayDays += delayDays;
        }
      });
    });

    return {
      onTimePayments,
      latePayments,
      averageDelayDays: latePayments > 0 ? totalDelayDays / latePayments : 0,
      punctualityScore: ((onTimePayments / (onTimePayments + latePayments)) * 100) || 0,
      totalPayments: onTimePayments + latePayments
    };
  }

  // إدارة المخاطر
  assessInstallmentRisk(installmentId: string): any {
    const installments = installmentsManager.getInstallments();
    const installment = installments.find(inst => inst.id === installmentId);
    if (!installment) return null;

    const customerBehavior = this.getCustomerPaymentBehavior(installment.customerId);
    const today = new Date();
    const dueDate = new Date(installment.dueDate);
    const daysPastDue = Math.max(0, Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));
    
    let riskLevel = 'منخفض';
    let riskScore = 0;

    // تقييم المخاطر بناء على عوامل متعددة
    if (installment.status === 'overdue') {
      riskScore += daysPastDue * 2;
    }
    
    if (customerBehavior.punctualityScore < 70) {
      riskScore += 30;
    }
    
    if (installment.remainingAmount > installment.totalAmount * 0.8) {
      riskScore += 20;
    }

    if (riskScore > 50) {
      riskLevel = 'عالي';
    } else if (riskScore > 25) {
      riskLevel = 'متوسط';
    }

    return {
      installmentId,
      riskLevel,
      riskScore,
      daysPastDue,
      customerPunctuality: customerBehavior.punctualityScore,
      remainingPercentage: (installment.remainingAmount / installment.totalAmount) * 100,
      recommendations: this.generateRiskRecommendations(riskLevel, riskScore)
    };
  }

  generateRiskReport(): any {
    const installments = installmentsManager.getInstallments();
    const riskAssessments = installments.map(inst => this.assessInstallmentRisk(inst.id!));
    
    const highRisk = riskAssessments.filter(r => r?.riskLevel === 'عالي').length;
    const mediumRisk = riskAssessments.filter(r => r?.riskLevel === 'متوسط').length;
    const lowRisk = riskAssessments.filter(r => r?.riskLevel === 'منخفض').length;

    return {
      totalInstallments: installments.length,
      riskDistribution: {
        high: highRisk,
        medium: mediumRisk,
        low: lowRisk
      },
      highRiskInstallments: riskAssessments.filter(r => r?.riskLevel === 'عالي'),
      totalRiskAmount: riskAssessments
        .filter(r => r?.riskLevel === 'عالي')
        .reduce((sum, r) => {
          const inst = installments.find(i => i.id === r?.installmentId);
          return sum + (inst?.remainingAmount || 0);
        }, 0),
      generatedAt: new Date().toISOString()
    };
  }

  private calculateAveragePaymentDelay(installments: any[]): number {
    let totalDelayDays = 0;
    let paymentCount = 0;

    installments.forEach(installment => {
      installment.paymentHistory.forEach((payment: any) => {
        const dueDate = new Date(installment.dueDate);
        const paymentDate = new Date(payment.date);
        const delayDays = Math.max(0, Math.ceil((paymentDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));
        totalDelayDays += delayDays;
        paymentCount++;
      });
    });

    return paymentCount > 0 ? totalDelayDays / paymentCount : 0;
  }

  private calculateCreditScore(installments: any[]): number {
    const totalInstallments = installments.length;
    if (totalInstallments === 0) return 0;

    const completedOnTime = installments.filter(i => 
      i.status === 'completed' && this.wasCompletedOnTime(i)
    ).length;

    const overdueCount = installments.filter(i => i.status === 'overdue').length;
    
    let score = 100;
    score -= (overdueCount / totalInstallments) * 40; // خصم 40 نقطة للمتأخرات
    score += (completedOnTime / totalInstallments) * 20; // إضافة 20 نقطة للمكتملة في الوقت

    return Math.max(0, Math.min(100, score));
  }

  private calculatePaymentReliability(installments: any[]): number {
    const totalPayments = installments.reduce((sum, i) => sum + i.paymentHistory.length, 0);
    if (totalPayments === 0) return 0;

    const onTimePayments = installments.reduce((sum, installment) => {
      return sum + installment.paymentHistory.filter((payment: any) => {
        const dueDate = new Date(installment.dueDate);
        const paymentDate = new Date(payment.date);
        return paymentDate <= dueDate;
      }).length;
    }, 0);

    return (onTimePayments / totalPayments) * 100;
  }

  private wasCompletedOnTime(installment: any): boolean {
    if (installment.status !== 'completed') return false;
    
    const lastPayment = installment.paymentHistory[installment.paymentHistory.length - 1];
    if (!lastPayment) return false;

    const dueDate = new Date(installment.dueDate);
    const paymentDate = new Date(lastPayment.date);
    
    return paymentDate <= dueDate;
  }

  private generateRiskRecommendations(riskLevel: string, riskScore: number): string[] {
    const recommendations = [];

    if (riskLevel === 'عالي') {
      recommendations.push('تواصل فوري مع العميل');
      recommendations.push('وضع خطة دفع معدلة');
      recommendations.push('تقييم إمكانية الضمانات الإضافية');
    } else if (riskLevel === 'متوسط') {
      recommendations.push('إرسال تذكير ودي للعميل');
      recommendations.push('متابعة دورية أسبوعية');
      recommendations.push('تقييم تاريخ الدفع السابق');
    } else {
      recommendations.push('المتابعة الروتينية');
      recommendations.push('إرسال تذكيرات قبل الاستحقاق');
    }

    return recommendations;
  }
}

export const installmentsEnhancedIntegration = new InstallmentsEnhancedIntegrationService();