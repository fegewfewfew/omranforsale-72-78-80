import { storage } from './storage';
import { inventoryManager } from './inventoryUtils';
import { cashFlowManager } from './cashFlowManager';

export interface SmartAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  priority: 'high' | 'medium' | 'low';
  category: 'inventory' | 'financial' | 'customer' | 'supplier' | 'system';
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
  data?: any;
  createdAt: string;
  isRead: boolean;
}

export class SmartAlertsManager {
  private static instance: SmartAlertsManager;

  static getInstance(): SmartAlertsManager {
    if (!SmartAlertsManager.instance) {
      SmartAlertsManager.instance = new SmartAlertsManager();
    }
    return SmartAlertsManager.instance;
  }

  // الحصول على جميع التنبيهات
  getAllAlerts(): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    
    // تنبيهات المخزون
    alerts.push(...this.getInventoryAlerts());
    
    // تنبيهات مالية
    alerts.push(...this.getFinancialAlerts());
    
    // تنبيهات العملاء
    alerts.push(...this.getCustomerAlerts());
    
    // تنبيهات الموردين
    alerts.push(...this.getSupplierAlerts());
    
    // ترتيب التنبيهات حسب الأولوية والتاريخ
    return alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  // تنبيهات المخزون
  private getInventoryAlerts(): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const products = inventoryManager.getProducts();
    
    products.forEach(product => {
      // تنبيه المخزون المنخفض
      if (product.stock <= product.minStock) {
        alerts.push({
          id: `low_stock_${product.id}`,
          type: product.stock === 0 ? 'error' : 'warning',
          priority: product.stock === 0 ? 'high' : 'medium',
          category: 'inventory',
          title: product.stock === 0 ? 'نفاد المخزون' : 'مخزون منخفض',
          message: `${product.name} - المخزون الحالي: ${product.stock}`,
          action: {
            label: 'عرض المنتج',
            href: `/inventory/products?search=${encodeURIComponent(product.name)}`
          },
          data: { productId: product.id, currentStock: product.stock },
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }
    });

    return alerts;
  }

  // تنبيهات مالية
  private getFinancialAlerts(): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    
    // تنبيهات الشيكات المستحقة
    const checks = storage.getItem('checks', []);
    const today = new Date();
    
    checks.forEach((check: any) => {
      if (check.status === 'pending') {
        const dueDate = new Date(check.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 3 && daysUntilDue >= 0) {
          alerts.push({
            id: `check_due_${check.id}`,
            type: daysUntilDue === 0 ? 'error' : 'warning',
            priority: daysUntilDue === 0 ? 'high' : 'medium',
            category: 'financial',
            title: daysUntilDue === 0 ? 'شيك مستحق اليوم' : `شيك مستحق خلال ${daysUntilDue} أيام`,
            message: `شيك رقم ${check.checkNumber} - المبلغ: ${check.amount.toLocaleString()} جنيه`,
            action: {
              label: 'عرض الشيكات',
              href: '/checks'
            },
            data: { checkId: check.id, amount: check.amount, daysUntilDue },
            createdAt: new Date().toISOString(),
            isRead: false
          });
        }
      }
    });

    // تنبيهات الأقساط المستحقة
    const installments = storage.getItem('installments', []);
    
    installments.forEach((installment: any) => {
      if (installment.status === 'pending') {
        const dueDate = new Date(installment.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 7 && daysUntilDue >= 0) {
          alerts.push({
            id: `installment_due_${installment.id}`,
            type: daysUntilDue <= 1 ? 'error' : 'warning',
            priority: daysUntilDue <= 1 ? 'high' : 'medium',
            category: 'financial',
            title: daysUntilDue === 0 ? 'قسط مستحق اليوم' : `قسط مستحق خلال ${daysUntilDue} أيام`,
            message: `قسط العميل ${installment.customerName} - المبلغ: ${installment.amount.toLocaleString()} جنيه`,
            action: {
              label: 'عرض الأقساط',
              href: '/installments'
            },
            data: { installmentId: installment.id, amount: installment.amount, daysUntilDue },
            createdAt: new Date().toISOString(),
            isRead: false
          });
        }
      }
    });

    return alerts;
  }

  // تنبيهات العملاء
  private getCustomerAlerts(): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const customers = storage.getItem('customers', []);
    const salesInvoices = storage.getItem('sales_invoices', []);
    const installments = storage.getItem('installments', []);
    
    customers.forEach((customer: any) => {
      // العملاء المتأخرين في الدفع
      const customerInstallments = installments.filter((inst: any) => 
        inst.customerId === customer.id?.toString() && inst.status === 'pending'
      );
      
      const overdueInstallments = customerInstallments.filter((inst: any) => {
        const dueDate = new Date(inst.dueDate);
        return dueDate < new Date();
      });
      
      if (overdueInstallments.length > 0) {
        const totalOverdue = overdueInstallments.reduce((sum: number, inst: any) => sum + inst.amount, 0);
        
        alerts.push({
          id: `customer_overdue_${customer.id}`,
          type: 'warning',
          priority: 'high',
          category: 'customer',
          title: 'عميل متأخر في الدفع',
          message: `${customer.name} - إجمالي المتأخرات: ${totalOverdue.toLocaleString()} جنيه (${overdueInstallments.length} قسط)`,
          action: {
            label: 'عرض العميل',
            href: `/sales/customers/${customer.id}`
          },
          data: { customerId: customer.id, overdueAmount: totalOverdue, overdueCount: overdueInstallments.length },
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }
    });

    return alerts;
  }

  // تنبيهات الموردين
  private getSupplierAlerts(): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const suppliers = storage.getItem('suppliers', []);
    const purchaseInvoices = storage.getItem('purchase_invoices', []);
    
    suppliers.forEach((supplier: any) => {
      // الموردين الذين لم نشتري منهم لفترة طويلة
      const supplierInvoices = purchaseInvoices.filter((inv: any) => inv.supplierId === supplier.id);
      
      if (supplierInvoices.length > 0) {
        const lastPurchase = supplierInvoices
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        const daysSinceLastPurchase = Math.floor(
          (new Date().getTime() - new Date(lastPurchase.date).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastPurchase > 60) { // أكثر من شهرين
          alerts.push({
            id: `supplier_inactive_${supplier.id}`,
            type: 'info',
            priority: 'low',
            category: 'supplier',
            title: 'مورد غير نشط',
            message: `${supplier.name} - آخر شراء منذ ${daysSinceLastPurchase} يوم`,
            action: {
              label: 'عرض المورد',
              href: `/purchases/suppliers?search=${encodeURIComponent(supplier.name)}`
            },
            data: { supplierId: supplier.id, daysSinceLastPurchase },
            createdAt: new Date().toISOString(),
            isRead: false
          });
        }
      }
    });

    return alerts;
  }

  // تحديد التنبيه كمقروء
  markAsRead(alertId: string): void {
    // في التطبيق الحقيقي، سيتم حفظ حالة قراءة التنبيهات
    console.log(`Alert ${alertId} marked as read`);
  }

  // إحصائيات التنبيهات
  getAlertsStats(): {
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    const alerts = this.getAllAlerts();
    
    return {
      total: alerts.length,
      unread: alerts.filter(a => !a.isRead).length,
      byType: alerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: alerts.reduce((acc, alert) => {
        acc[alert.priority] = (acc[alert.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const smartAlertsManager = SmartAlertsManager.getInstance();