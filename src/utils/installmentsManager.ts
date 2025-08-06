import { storage } from './storage';
import { cashFlowManager } from './cashFlowManager';

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  notes?: string;
  paymentMethod?: 'cash' | 'bank' | 'check';
  receivedBy?: string;
}

export interface Installment {
  id: string;
  installmentNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  originalInvoiceId?: string;
  originalInvoiceNumber?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installmentAmount: number;
  installmentPeriod: number; // months
  startDate: string;
  dueDate: string;
  status: 'active' | 'completed' | 'overdue' | 'cancelled';
  notes?: string;
  paymentHistory: PaymentRecord[];
  createdBy?: string;
  createdAt: string;
  interestRate?: number;
  lateFee?: number;
}

export class InstallmentsManager {
  private static instance: InstallmentsManager;

  static getInstance(): InstallmentsManager {
    if (!InstallmentsManager.instance) {
      InstallmentsManager.instance = new InstallmentsManager();
    }
    return InstallmentsManager.instance;
  }

  // Get all installments
  getInstallments(): Installment[] {
    return storage.getItem('installments', []);
  }

  // Add new installment
  addInstallment(installmentData: Omit<Installment, 'id' | 'installmentNumber' | 'createdAt' | 'paymentHistory' | 'paidAmount' | 'remainingAmount' | 'status'>): boolean {
    try {
      const newInstallment: Installment = {
        ...installmentData,
        id: `INST_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        installmentNumber: `INST-${Date.now().toString().slice(-6)}`,
        paidAmount: 0,
        remainingAmount: installmentData.totalAmount,
        status: 'active',
        paymentHistory: [],
        createdAt: new Date().toISOString()
      };

      const installments = this.getInstallments();
      installments.unshift(newInstallment); // Add to beginning
      storage.setItem('installments', installments);

      // ربط تلقائي محسن مع العميل والفاتورة
      this.autoLinkWithCustomerAndInvoice(newInstallment);

      return true;
    } catch (error) {
      console.error('Error adding installment:', error);
      return false;
    }
  }

  // ربط تلقائي محسن للقسط مع العميل والفاتورة الأصلية
  private autoLinkWithCustomerAndInvoice(installment: Installment): void {
    try {
      // ربط مع العميل
      const customers = storage.getItem('customers', []);
      const customer = customers.find((c: any) => 
        c.name === installment.customerName || c.phone === installment.customerPhone
      );

      if (customer) {
        installment.customerId = customer.id;
        
        // تحديث محسن لسجل العميل
        customer.hasInstallments = true;
        customer.totalInstallments = (customer.totalInstallments || 0) + 1;
        customer.installmentAmount = (customer.installmentAmount || 0) + installment.totalAmount;
        customer.lastInstallmentDate = installment.startDate;
        customer.creditRisk = this.calculateCustomerCreditRisk(customer);
        customer.paymentHistory = customer.paymentHistory || [];
        customer.paymentHistory.push({
          type: 'installment_created',
          amount: installment.totalAmount,
          date: installment.startDate,
          reference: installment.id
        });
        
        storage.setItem('customers', customers);
      }

      // ربط مع الفاتورة الأصلية إذا تم تحديدها
      if (installment.originalInvoiceNumber) {
        const salesInvoices = storage.getItem('sales_invoices', []);
        const originalInvoice = salesInvoices.find((inv: any) => 
          inv.id === installment.originalInvoiceNumber || 
          inv.invoiceNumber === installment.originalInvoiceNumber
        );

        if (originalInvoice) {
          installment.originalInvoiceId = originalInvoice.id;
          
          // تحديث الفاتورة الأصلية
          originalInvoice.hasInstallments = true;
          originalInvoice.installmentId = installment.id;
          
          storage.setItem('sales_invoices', salesInvoices);
        }
      }

      // تحديث القسط بمعلومات الربط
      const installments = this.getInstallments();
      const installmentIndex = installments.findIndex(i => i.id === installment.id);
      if (installmentIndex !== -1) {
        installments[installmentIndex] = installment;
        storage.setItem('installments', installments);
      }
    } catch (error) {
      console.error('Error auto-linking installment:', error);
    }
  }

  // Add payment to installment
  addPayment(installmentId: string, payment: Omit<PaymentRecord, 'id'>): boolean {
    try {
      const installments = this.getInstallments();
      const installmentIndex = installments.findIndex(inst => inst.id === installmentId);
      
      if (installmentIndex === -1) return false;

      const installment = installments[installmentIndex];
      
      // Validate payment amount
      if (payment.amount > installment.remainingAmount) {
        throw new Error('مبلغ الدفع أكبر من المبلغ المتبقي');
      }

      const newPayment: PaymentRecord = {
        ...payment,
        id: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      };

      // Update installment
      const updatedInstallment = {
        ...installment,
        paidAmount: installment.paidAmount + payment.amount,
        remainingAmount: installment.remainingAmount - payment.amount,
        paymentHistory: [...installment.paymentHistory, newPayment],
        status: (installment.remainingAmount - payment.amount <= 0) ? 'completed' as const : installment.status
      };

      // Update next due date if not completed
      if (updatedInstallment.status !== 'completed') {
        updatedInstallment.dueDate = this.calculateNextDueDate(updatedInstallment);
      }

      installments[installmentIndex] = updatedInstallment;
      storage.setItem('installments', installments);

      // Add to cash flow
      this.addPaymentToCashFlow(updatedInstallment, newPayment);

      // Update customer record
      this.updateCustomerInstallmentRecord(updatedInstallment, newPayment);

      return true;
    } catch (error) {
      console.error('Error adding payment:', error);
      return false;
    }
  }

  // Update installment
  updateInstallment(installmentId: string, updates: Partial<Installment>): boolean {
    try {
      const installments = this.getInstallments();
      const installmentIndex = installments.findIndex(inst => inst.id === installmentId);
      
      if (installmentIndex === -1) return false;

      installments[installmentIndex] = { ...installments[installmentIndex], ...updates };
      storage.setItem('installments', installments);

      return true;
    } catch (error) {
      console.error('Error updating installment:', error);
      return false;
    }
  }

  // Cancel installment
  cancelInstallment(installmentId: string, reason?: string): boolean {
    try {
      const installments = this.getInstallments();
      const installmentIndex = installments.findIndex(inst => inst.id === installmentId);
      
      if (installmentIndex === -1) return false;

      installments[installmentIndex].status = 'cancelled';
      installments[installmentIndex].notes = (installments[installmentIndex].notes || '') + `\nملغي: ${reason || 'غير محدد'}`;
      
      storage.setItem('installments', installments);

      return true;
    } catch (error) {
      console.error('Error cancelling installment:', error);
      return false;
    }
  }

  // Delete installment
  deleteInstallment(installmentId: string): boolean {
    try {
      const installments = this.getInstallments();
      const installmentToDelete = installments.find(inst => inst.id === installmentId);
      
      if (!installmentToDelete) return false;

      // Remove related cash flow transactions
      installmentToDelete.paymentHistory.forEach(payment => {
        this.removePaymentFromCashFlow(payment);
      });

      const updatedInstallments = installments.filter(inst => inst.id !== installmentId);
      storage.setItem('installments', updatedInstallments);

      return true;
    } catch (error) {
      console.error('Error deleting installment:', error);
      return false;
    }
  }

  // Get installments by status
  getInstallmentsByStatus(status: Installment['status']): Installment[] {
    return this.getInstallments().filter(inst => inst.status === status);
  }

  // Get installments by customer
  getInstallmentsByCustomer(customerId: string): Installment[] {
    return this.getInstallments().filter(inst => inst.customerId === customerId);
  }

  // Get overdue installments
  getOverdueInstallments(): Installment[] {
    const today = new Date();
    const installments = this.getInstallments();
    
    return installments.filter(inst => {
      if (inst.status !== 'active') return false;
      
      const dueDate = new Date(inst.dueDate);
      return dueDate < today;
    }).map(inst => {
      // Update status to overdue if it isn't already
      if (inst.status === 'active') {
        inst.status = 'overdue';
        this.updateInstallment(inst.id, { status: 'overdue' });
      }
      return inst;
    });
  }

  // Get installments due soon
  getInstallmentsDueSoon(days: number = 7): Installment[] {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    
    return this.getInstallments().filter(inst => {
      if (inst.status !== 'active') return false;
      
      const dueDate = new Date(inst.dueDate);
      return dueDate >= today && dueDate <= futureDate;
    });
  }

  // Get installment statistics
  getInstallmentStatistics() {
    const installments = this.getInstallments();
    const activeInstallments = installments.filter(i => i.status === 'active');
    const completedInstallments = installments.filter(i => i.status === 'completed');
    const overdueInstallments = this.getOverdueInstallments();

    return {
      totalInstallments: installments.length,
      activeCount: activeInstallments.length,
      completedCount: completedInstallments.length,
      overdueCount: overdueInstallments.length,
      totalAmount: installments.reduce((sum, i) => sum + i.totalAmount, 0),
      totalPaid: installments.reduce((sum, i) => sum + i.paidAmount, 0),
      totalRemaining: installments.reduce((sum, i) => sum + i.remainingAmount, 0),
      overdueAmount: overdueInstallments.reduce((sum, i) => sum + i.remainingAmount, 0),
      averageInstallmentValue: installments.length > 0 ? installments.reduce((sum, i) => sum + i.totalAmount, 0) / installments.length : 0,
      paymentRate: installments.length > 0 ? (completedInstallments.length / installments.length) * 100 : 0
    };
  }

  // Calculate next due date
  private calculateNextDueDate(installment: Installment): string {
    const paymentsCount = installment.paymentHistory.length;
    const startDate = new Date(installment.startDate);
    const nextDueDate = new Date(startDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + paymentsCount + 1);
    
    return nextDueDate.toISOString().split('T')[0];
  }

  // ربط محسن للقسط مع العميل والفاتورة الأصلية
  private linkWithCustomerAndInvoice(installment: Installment): void {
    try {
      // Link with customer
      const customers = storage.getItem('customers', []);
      const customer = customers.find((c: any) => 
        c.name === installment.customerName || c.phone === installment.customerPhone
      );

      if (customer) {
        installment.customerId = customer.id;
        
        // تحديث محسن لسجل العميل
        customer.hasInstallments = true;
        customer.totalInstallments = (customer.totalInstallments || 0) + 1;
        customer.installmentAmount = (customer.installmentAmount || 0) + installment.totalAmount;
        customer.lastInstallmentDate = installment.startDate;
        customer.creditRisk = this.calculateCustomerCreditRisk(customer);
        customer.paymentHistory = customer.paymentHistory || [];
        customer.paymentHistory.push({
          type: 'installment_created',
          amount: installment.totalAmount,
          date: installment.startDate,
          reference: installment.id
        });
        
        storage.setItem('customers', customers);
      }

      // Link with original invoice if provided
      if (installment.originalInvoiceNumber) {
        const salesInvoices = storage.getItem('sales_invoices', []);
        const originalInvoice = salesInvoices.find((inv: any) => 
          inv.id === installment.originalInvoiceNumber || 
          inv.invoiceNumber === installment.originalInvoiceNumber
        );

        if (originalInvoice) {
          installment.originalInvoiceId = originalInvoice.id;
          
          // Update original invoice
          originalInvoice.hasInstallments = true;
          originalInvoice.installmentId = installment.id;
          
          storage.setItem('sales_invoices', salesInvoices);
        }
      }
    } catch (error) {
      console.error('Error linking installment:', error);
    }
  }

  // Add payment to cash flow
  private addPaymentToCashFlow(installment: Installment, payment: PaymentRecord): void {
    try {
      cashFlowManager.addTransaction({
        date: payment.date,
        type: 'income',
        category: 'sales',
        subcategory: 'أقساط',
        amount: payment.amount,
        description: `دفعة قسط ${installment.installmentNumber} - ${installment.customerName}`,
        referenceId: payment.id,
        referenceType: 'manual',
        paymentMethod: payment.paymentMethod || 'cash',
        notes: `القسط: ${installment.installmentNumber}, المبلغ المتبقي: ${installment.remainingAmount}`,
        createdBy: payment.receivedBy
      });
    } catch (error) {
      console.error('Error adding payment to cash flow:', error);
    }
  }

  // Remove payment from cash flow
  private removePaymentFromCashFlow(payment: PaymentRecord): void {
    try {
      const transactions = cashFlowManager.getTransactions();
      const updatedTransactions = transactions.filter(t => t.referenceId !== payment.id);
      storage.setItem('cash_flow_transactions', updatedTransactions);
    } catch (error) {
      console.error('Error removing payment from cash flow:', error);
    }
  }

  // Update customer installment record
  private updateCustomerInstallmentRecord(installment: Installment, payment: PaymentRecord): void {
    try {
      if (!installment.customerId) return;

      const customers = storage.getItem('customers', []);
      const customerIndex = customers.findIndex((c: any) => c.id === installment.customerId);
      
      if (customerIndex !== -1) {
        const customer = customers[customerIndex];
        
        customer.installmentsPaid = (customer.installmentsPaid || 0) + payment.amount;
        customer.lastPaymentDate = payment.date;
        
        if (installment.status === 'completed') {
          customer.completedInstallments = (customer.completedInstallments || 0) + 1;
        }
        
        customers[customerIndex] = customer;
        storage.setItem('customers', customers);
      }
    } catch (error) {
      console.error('Error updating customer installment record:', error);
    }
  }

  // Get monthly collection report
  getMonthlyCollectionReport(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const installments = this.getInstallments();
    const monthlyPayments: PaymentRecord[] = [];
    
    installments.forEach(installment => {
      installment.paymentHistory.forEach(payment => {
        const paymentDate = new Date(payment.date);
        if (paymentDate >= startDate && paymentDate <= endDate) {
          monthlyPayments.push(payment);
        }
      });
    });

    return {
      totalCollected: monthlyPayments.length,
      totalAmount: monthlyPayments.reduce((sum, p) => sum + p.amount, 0),
      payments: monthlyPayments,
      uniqueCustomers: new Set(monthlyPayments.map((p: any) => p.customerName)).size
    };
  }

  // Calculate late fees for overdue installments
  calculateLateFees(): void {
    const overdueInstallments = this.getOverdueInstallments();
    
    overdueInstallments.forEach(installment => {
      if (!installment.lateFee) return;
      
      const dueDate = new Date(installment.dueDate);
      const today = new Date();
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysPastDue > 0) {
        const lateFeeAmount = (installment.remainingAmount * (installment.lateFee / 100)) * daysPastDue;
        installment.remainingAmount += lateFeeAmount;
        installment.totalAmount += lateFeeAmount;
        
        this.updateInstallment(installment.id, {
          remainingAmount: installment.remainingAmount,
          totalAmount: installment.totalAmount,
          notes: (installment.notes || '') + `\nغرامة تأخير: ${lateFeeAmount} (${daysPastDue} يوم)`
        });
      }
    });
  }

  // حساب مخاطر الائتمان للعميل
  private calculateCustomerCreditRisk(customer: any): 'منخفض' | 'متوسط' | 'عالي' {
    try {
      const installments = this.getInstallmentsByCustomer(customer.id);
      const totalInstallments = installments.length;
      
      if (totalInstallments === 0) return 'منخفض';
      
      const overdueInstallments = installments.filter(i => i.status === 'overdue').length;
      const completedInstallments = installments.filter(i => i.status === 'completed').length;
      
      const overdueRate = (overdueInstallments / totalInstallments) * 100;
      const completionRate = (completedInstallments / totalInstallments) * 100;
      
      if (overdueRate > 30 || completionRate < 50) return 'عالي';
      if (overdueRate > 15 || completionRate < 75) return 'متوسط';
      
      return 'منخفض';
    } catch (error) {
      console.error('خطأ في حساب مخاطر الائتمان:', error);
      return 'منخفض';
    }
  }

  // الحصول على ملخص أقساط العميل
  getCustomerInstallmentsSummary(customerId: string) {
    const customerInstallments = this.getInstallmentsByCustomer(customerId);
    const active = customerInstallments.filter(i => i.status === 'active');
    const completed = customerInstallments.filter(i => i.status === 'completed');
    const overdue = customerInstallments.filter(i => i.status === 'overdue');
    const cancelled = customerInstallments.filter(i => i.status === 'cancelled');

    const totalAmount = customerInstallments.reduce((sum, i) => sum + i.totalAmount, 0);
    const paidAmount = customerInstallments.reduce((sum, i) => sum + i.paidAmount, 0);
    const remainingAmount = customerInstallments.reduce((sum, i) => sum + i.remainingAmount, 0);

    return {
      totalInstallments: customerInstallments.length,
      activeInstallments: active.length,
      completedInstallments: completed.length,
      overdueInstallments: overdue.length,
      cancelledInstallments: cancelled.length,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentProgress: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
      creditRisk: this.calculateCustomerCreditRisk({ id: customerId }),
      nextDueDate: active.length > 0 ? active.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].dueDate : null,
      overdueAmount: overdue.reduce((sum, i) => sum + i.remainingAmount, 0)
    };
  }

  // ربط جميع الأقساط غير المربوطة بالعملاء
  linkAllUnlinkedInstallments(): { linked: number; failed: number } {
    try {
      const installments = this.getInstallments();
      const customers = storage.getItem('customers', []);
      let linked = 0;
      let failed = 0;

      installments.forEach(installment => {
        if (!installment.customerId && installment.customerName) {
          const customer = customers.find((c: any) => 
            c.name === installment.customerName || 
            c.phone === installment.customerPhone
          );

          if (customer) {
            installment.customerId = customer.id;
            linked++;
            
            // تحديث سجل العميل
            customer.hasInstallments = true;
            customer.totalInstallments = (customer.totalInstallments || 0) + 1;
            customer.installmentAmount = (customer.installmentAmount || 0) + installment.totalAmount;
          } else {
            failed++;
          }
        }
      });

      if (linked > 0) {
        storage.setItem('installments', installments);
        storage.setItem('customers', customers);
      }

      return { linked, failed };
    } catch (error) {
      console.error('Error linking unlinked installments:', error);
      return { linked: 0, failed: 0 };
    }
  }

  // Sync existing payments with cash flow
  syncWithCashFlow(): void {
    try {
      const installments = this.getInstallments();
      const existingTransactions = cashFlowManager.getTransactions();
      
      installments.forEach(installment => {
        installment.paymentHistory.forEach(payment => {
          // Check if already synced
          const alreadySynced = existingTransactions.some(t => t.referenceId === payment.id);
          if (!alreadySynced) {
            this.addPaymentToCashFlow(installment, payment);
          }
        });
      });
    } catch (error) {
      console.error('Error syncing installments with cash flow:', error);
    }
  }
}

// Export singleton instance
export const installmentsManager = InstallmentsManager.getInstance();