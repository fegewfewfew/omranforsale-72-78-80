import { storage } from './storage';
import { customerIntegrationManager } from './customerIntegrationManager';
import { supplierIntegrationEnhancer } from './supplierIntegrationEnhancer';
import { checksManager } from './checksManager';
import { installmentsManager } from './installmentsManager';
import { cashFlowManager } from './cashFlowManager';
import { inventoryIntegrationEnhancer } from './inventoryIntegrationEnhancer';
import { inventoryDataGenerator } from './inventoryDataGenerator';

export interface SystemIntegrationStatus {
  module: string;
  integrationLevel: number;
  status: 'ممتاز' | 'جيد' | 'يحتاج تحسين' | 'ضعيف';
  connectedSystems: string[];
  missingLinks: string[];
  recommendations: string[];
}

export class EnhancedIntegrationsManager {
  private static instance: EnhancedIntegrationsManager;

  static getInstance(): EnhancedIntegrationsManager {
    if (!EnhancedIntegrationsManager.instance) {
      EnhancedIntegrationsManager.instance = new EnhancedIntegrationsManager();
    }
    return EnhancedIntegrationsManager.instance;
  }

  // تشغيل تحسين شامل لجميع الروابط
  enhanceAllSystemIntegrations(): void {
    try {
      console.log('🔄 بدء تحسين الروابط بين الأنظمة...');

      // 0. إنشاء البيانات التجريبية المطلوبة أولاً
      inventoryDataGenerator.generateAllRequiredData();

      // 1. تحسين تكامل المخزون (الأولوية العليا)
      this.enhanceInventoryIntegrations();

      // 2. ربط العملاء مع المبيعات والأقساط
      this.enhanceCustomerIntegrations();

      // 3. ربط الموردين مع المشتريات
      this.enhanceSupplierIntegrations();

      // 4. ربط الشيكات مع العملاء والموردين
      this.enhanceCheckIntegrations();

      // 5. ربط الأقساط مع العملاء
      this.enhanceInstallmentIntegrations();

      // 6. تحسين الأنظمة المتبقية
      this.enhanceRemainingIntegrations();

      // 7. مزامنة التدفق النقدي
      this.syncCashFlowIntegrations();

      console.log('✅ تم الانتهاء من تحسين جميع الروابط');
    } catch (error) {
      console.error('❌ خطأ في تحسين الروابط:', error);
    }
  }

  // تحسين الأنظمة المتبقية
  private enhanceRemainingIntegrations(): void {
    try {
      console.log('🔗 تحسين الأنظمة المتبقية...');
      
      // تحسين الصندوق
      this.enhanceCashRegisterIntegrations();
      
      // تحسين المصروفات
      this.enhanceExpensesIntegrations();
      
      // تحسين المرتجعات
      this.enhanceReturnsIntegrations();
      
      console.log('✅ تم تحسين الأنظمة المتبقية');
    } catch (error) {
      console.error('❌ خطأ في تحسين الأنظمة المتبقية:', error);
    }
  }

  // تحسين تكامل الصندوق
  private enhanceCashRegisterIntegrations(): void {
    cashFlowManager.syncAllFinancialData();
  }

  // تحسين تكامل المصروفات
  private enhanceExpensesIntegrations(): void {
    const expenses = storage.getItem('expenses', []);
    expenses.forEach((expense: any) => {
      if (!expense.categoryId) {
        expense.categoryId = 'cat_general';
        expense.category = 'مصروفات عامة';
      }
    });
    storage.setItem('expenses', expenses);
  }

  // تحسين تكامل المرتجعات
  private enhanceReturnsIntegrations(): void {
    const returns = storage.getItem('returns', []);
    const products = storage.getItem('products', []);
    
    returns.forEach((returnItem: any) => {
      if (!returnItem.productId && returnItem.productName) {
        const product = products.find((p: any) => p.name === returnItem.productName);
        if (product) {
          returnItem.productId = product.id;
        }
      }
    });
    storage.setItem('returns', returns);
  }

  // تحسين روابط العملاء
  private enhanceCustomerIntegrations(): void {
    try {
      console.log('🔗 تحسين روابط العملاء...');
      
      // ربط العملاء مع فواتير المبيعات
      this.linkCustomersWithSalesInvoices();
      
      // ربط العملاء مع الأقساط
      this.linkCustomersWithInstallments();
      
      // ربط العملاء مع الشيكات
      this.linkCustomersWithChecks();
      
      // تحديث إحصائيات العملاء
      customerIntegrationManager.syncAllCustomers();
      
      console.log('✅ تم تحسين روابط العملاء');
    } catch (error) {
      console.error('❌ خطأ في تحسين روابط العملاء:', error);
    }
  }

  // تحسين روابط الموردين
  private enhanceSupplierIntegrations(): void {
    try {
      console.log('🔗 تحسين روابط الموردين...');
      
      // ربط الموردين مع فواتير المشتريات
      this.linkSuppliersWithPurchaseInvoices();
      
      // ربط الموردين مع الشيكات
      this.linkSuppliersWithChecks();
      
      // تحديث إحصائيات الموردين
      supplierIntegrationEnhancer.syncAllSuppliers();
      
      console.log('✅ تم تحسين روابط الموردين');
    } catch (error) {
      console.error('❌ خطأ في تحسين روابط الموردين:', error);
    }
  }

  // تحسين روابط الشيكات
  private enhanceCheckIntegrations(): void {
    try {
      console.log('🔗 تحسين روابط الشيكات...');
      
      const checks = checksManager.getChecks();
      const customers = storage.getItem('customers', []);
      const suppliers = storage.getItem('suppliers', []);
      
      let linkedCount = 0;
      
      checks.forEach(check => {
        // تخطي الشيكات المربوطة بالفعل
        if (check.customerId || check.supplierId) return;
        
        // محاولة ربط بعميل
        const customer = customers.find((c: any) => 
          this.matchEntity(c, check.customerName, check.customerPhone)
        );
        
        if (customer) {
          this.linkCheckToCustomer(check.id, customer.id);
          linkedCount++;
          return;
        }
        
        // محاولة ربط بمورد
        const supplier = suppliers.find((s: any) => 
          this.matchEntity(s, check.customerName, check.customerPhone)
        );
        
        if (supplier) {
          this.linkCheckToSupplier(check.id, supplier.id);
          linkedCount++;
        }
      });
      
      console.log(`✅ تم ربط ${linkedCount} شيك مع العملاء والموردين`);
    } catch (error) {
      console.error('❌ خطأ في تحسين روابط الشيكات:', error);
    }
  }

  // تحسين روابط الأقساط
  private enhanceInstallmentIntegrations(): void {
    try {
      console.log('🔗 تحسين روابط الأقساط...');
      
      const installments = installmentsManager.getInstallments();
      const customers = storage.getItem('customers', []);
      
      let linkedCount = 0;
      
      installments.forEach(installment => {
        // تخطي الأقساط المربوطة بالفعل
        if (installment.customerId) return;
        
        const customer = customers.find((c: any) => 
          this.matchEntity(c, installment.customerName, installment.customerPhone)
        );
        
        if (customer) {
          this.linkInstallmentToCustomer(installment.id, customer.id);
          linkedCount++;
        }
      });
      
      console.log(`✅ تم ربط ${linkedCount} قسط مع العملاء`);
    } catch (error) {
      console.error('❌ خطأ في تحسين روابط الأقساط:', error);
    }
  }

  // تحسين تكامل المخزون
  private enhanceInventoryIntegrations(): void {
    try {
      console.log('🔗 تحسين تكامل المخزون...');
      
      // التأكد من وجود البيانات المطلوبة أولاً
      inventoryDataGenerator.generateAllRequiredData();
      
      // تشغيل التحسين الشامل للمخزون
      const status = inventoryIntegrationEnhancer.enhanceInventoryIntegration();
      
      console.log(`✅ تم تحسين تكامل المخزون: ${status.integrationLevel}%`);
    } catch (error) {
      console.error('❌ خطأ في تحسين تكامل المخزون:', error);
    }
  }

  // مزامنة التدفق النقدي
  private syncCashFlowIntegrations(): void {
    try {
      console.log('🔗 مزامنة التدفق النقدي...');
      
      // مزامنة الشيكات
      checksManager.syncWithCashFlow();
      
      // مزامنة الأقساط
      installmentsManager.syncWithCashFlow();
      
      console.log('✅ تم مزامنة التدفق النقدي');
    } catch (error) {
      console.error('❌ خطأ في مزامنة التدفق النقدي:', error);
    }
  }

  // ربط العملاء مع فواتير المبيعات
  private linkCustomersWithSalesInvoices(): void {
    const salesInvoices = storage.getItem('sales_invoices', []);
    const customers = storage.getItem('customers', []);
    
    salesInvoices.forEach((invoice: any) => {
      if (invoice.customerId) return;
      
      const customer = customers.find((c: any) => 
        this.matchEntity(c, invoice.customerName, invoice.customerPhone)
      );
      
      if (customer) {
        invoice.customerId = customer.id;
        invoice.linkedToCustomer = true;
      }
    });
    
    storage.setItem('sales_invoices', salesInvoices);
  }

  // ربط العملاء مع الأقساط
  private linkCustomersWithInstallments(): void {
    const installments = installmentsManager.getInstallments();
    const customers = storage.getItem('customers', []);
    
    installments.forEach(installment => {
      if (installment.customerId) return;
      
      const customer = customers.find((c: any) => 
        this.matchEntity(c, installment.customerName, installment.customerPhone)
      );
      
      if (customer) {
        installment.customerId = customer.id;
        // تحديث سجل العميل
        customer.hasInstallments = true;
        customer.totalInstallments = (customer.totalInstallments || 0) + 1;
      }
    });
    
    storage.setItem('installments', installments);
    storage.setItem('customers', customers);
  }

  // ربط العملاء مع الشيكات
  private linkCustomersWithChecks(): void {
    const checks = checksManager.getChecks();
    const customers = storage.getItem('customers', []);
    
    checks.forEach(check => {
      if (check.customerId) return;
      
      const customer = customers.find((c: any) => 
        this.matchEntity(c, check.customerName, check.customerPhone)
      );
      
      if (customer) {
        check.customerId = customer.id;
        check.entityType = 'customer';
        // تحديث سجل العميل
        customer.hasChecks = true;
        customer.totalChecks = (customer.totalChecks || 0) + 1;
      }
    });
    
    storage.setItem('checks', checks);
    storage.setItem('customers', customers);
  }

  // ربط الموردين مع فواتير المشتريات
  private linkSuppliersWithPurchaseInvoices(): void {
    const purchaseInvoices = storage.getItem('purchase_invoices', []);
    const suppliers = storage.getItem('suppliers', []);
    
    purchaseInvoices.forEach((invoice: any) => {
      if (invoice.supplierId) return;
      
      const supplier = suppliers.find((s: any) => 
        this.matchEntity(s, invoice.supplierName, invoice.supplierPhone)
      );
      
      if (supplier) {
        invoice.supplierId = supplier.id;
        invoice.linkedToSupplier = true;
      }
    });
    
    storage.setItem('purchase_invoices', purchaseInvoices);
  }

  // ربط الموردين مع الشيكات
  private linkSuppliersWithChecks(): void {
    const checks = checksManager.getChecks();
    const suppliers = storage.getItem('suppliers', []);
    
    checks.forEach(check => {
      if (check.supplierId || check.customerId) return;
      
      const supplier = suppliers.find((s: any) => 
        this.matchEntity(s, check.customerName, check.customerPhone)
      );
      
      if (supplier) {
        check.supplierId = supplier.id;
        check.entityType = 'supplier';
        // تحديث سجل المورد
        supplier.hasChecks = true;
        supplier.totalChecks = (supplier.totalChecks || 0) + 1;
      }
    });
    
    storage.setItem('checks', checks);
    storage.setItem('suppliers', suppliers);
  }

  // مطابقة الكيان
  private matchEntity(entity: any, name?: string, phone?: string): boolean {
    if (!entity || !name) return false;
    
    // مطابقة الاسم
    if (entity.name && entity.name.trim().toLowerCase() === name.trim().toLowerCase()) {
      return true;
    }
    
    // مطابقة الهاتف
    if (phone && entity.phone && this.normalizePhone(entity.phone) === this.normalizePhone(phone)) {
      return true;
    }
    
    // مطابقة جزئية للاسم
    if (entity.name && name) {
      const entityWords = entity.name.trim().toLowerCase().split(/\s+/);
      const nameWords = name.trim().toLowerCase().split(/\s+/);
      const commonWords = entityWords.filter(word => nameWords.includes(word));
      return commonWords.length >= Math.min(entityWords.length, nameWords.length) * 0.6;
    }
    
    return false;
  }

  // تطبيع رقم الهاتف
  private normalizePhone(phone: string): string {
    return phone.replace(/[\s\-\(\)\+]/g, '').slice(-10);
  }

  // ربط شيك بعميل
  private linkCheckToCustomer(checkId: string, customerId: string): void {
    const checks = checksManager.getChecks();
    const checkIndex = checks.findIndex(c => c.id === checkId);
    
    if (checkIndex !== -1) {
      checks[checkIndex].customerId = customerId;
      checks[checkIndex].entityType = 'customer';
      storage.setItem('checks', checks);
    }
  }

  // ربط شيك بمورد
  private linkCheckToSupplier(checkId: string, supplierId: string): void {
    const checks = checksManager.getChecks();
    const checkIndex = checks.findIndex(c => c.id === checkId);
    
    if (checkIndex !== -1) {
      checks[checkIndex].supplierId = supplierId;
      checks[checkIndex].entityType = 'supplier';
      storage.setItem('checks', checks);
    }
  }

  // ربط قسط بعميل
  private linkInstallmentToCustomer(installmentId: string, customerId: string): void {
    const installments = installmentsManager.getInstallments();
    const installmentIndex = installments.findIndex(i => i.id === installmentId);
    
    if (installmentIndex !== -1) {
      installments[installmentIndex].customerId = customerId;
      storage.setItem('installments', installments);
    }
  }

  // تقييم مستوى تكامل النظام
  evaluateSystemIntegration(): SystemIntegrationStatus[] {
    const evaluations: SystemIntegrationStatus[] = [];
    
    // تقييم تكامل المبيعات
    evaluations.push(this.evaluateSalesIntegration());
    
    // تقييم تكامل المشتريات
    evaluations.push(this.evaluatePurchasesIntegration());
    
    // تقييم تكامل المخزون
    evaluations.push(this.evaluateInventoryIntegration());
    
    // تقييم تكامل العملاء
    evaluations.push(this.evaluateCustomersIntegration());
    
    // تقييم تكامل الموردين
    evaluations.push(this.evaluateSuppliersIntegration());
    
    // تقييم تكامل الصندوق
    evaluations.push(this.evaluateCashRegisterIntegration());
    
    // تقييم تكامل المصروفات
    evaluations.push(this.evaluateExpensesIntegration());
    
    // تقييم تكامل الموظفين
    evaluations.push(this.evaluateEmployeesIntegration());
    
    // تقييم تكامل الشيكات
    evaluations.push(this.evaluateChecksIntegration());
    
    // تقييم تكامل المرتجعات
    evaluations.push(this.evaluateReturnsIntegration());
    
    // تقييم تكامل الأقساط
    evaluations.push(this.evaluateInstallmentsIntegration());
    
    // تقييم تكامل إدارة المستخدمين
    evaluations.push(this.evaluateUserManagementIntegration());
    
    return evaluations;
  }

  // تقييم تكامل المبيعات
  private evaluateSalesIntegration(): SystemIntegrationStatus {
    const salesInvoices = storage.getItem('sales_invoices', []);
    const linkedCount = salesInvoices.filter((inv: any) => inv.customerId).length;
    const integrationLevel = salesInvoices.length > 0 ? (linkedCount / salesInvoices.length) * 100 : 100;
    
    return {
      module: 'المبيعات',
      integrationLevel: Math.round(integrationLevel),
      status: this.getIntegrationStatus(integrationLevel),
      connectedSystems: ['المخزون', 'الصندوق', 'العملاء'],
      missingLinks: integrationLevel < 80 ? ['ربط بعض الفواتير بالعملاء'] : [],
      recommendations: integrationLevel < 80 ? ['تحسين ربط فواتير المبيعات بالعملاء'] : []
    };
  }

  // تقييم تكامل المشتريات
  private evaluatePurchasesIntegration(): SystemIntegrationStatus {
    const purchaseInvoices = storage.getItem('purchase_invoices', []);
    const linkedCount = purchaseInvoices.filter((inv: any) => inv.supplierId).length;
    const integrationLevel = purchaseInvoices.length > 0 ? (linkedCount / purchaseInvoices.length) * 100 : 100;
    
    return {
      module: 'المشتريات',
      integrationLevel: Math.round(integrationLevel),
      status: this.getIntegrationStatus(integrationLevel),
      connectedSystems: ['المخزون', 'الصندوق', 'الموردين'],
      missingLinks: integrationLevel < 80 ? ['ربط بعض الفواتير بالموردين'] : [],
      recommendations: integrationLevel < 80 ? ['تحسين ربط فواتير المشتريات بالموردين'] : []
    };
  }

  // تقييم تكامل العملاء
  private evaluateCustomersIntegration(): SystemIntegrationStatus {
    const customers = storage.getItem('customers', []);
    const salesInvoices = storage.getItem('sales_invoices', []);
    const installments = installmentsManager.getInstallments();
    const checks = checksManager.getChecks();
    
    let integrationScore = 0;
    let maxScore = 0;
    
    // تقييم ربط العملاء بالفواتير
    const customersWithInvoices = customers.filter((c: any) => 
      salesInvoices.some((inv: any) => inv.customerId === c.id)
    ).length;
    if (customers.length > 0) {
      integrationScore += (customersWithInvoices / customers.length) * 40;
      maxScore += 40;
    }
    
    // تقييم ربط العملاء بالأقساط
    const customersWithInstallments = customers.filter((c: any) => 
      installments.some((inst: any) => inst.customerId === c.id)
    ).length;
    if (customers.length > 0) {
      integrationScore += (customersWithInstallments / customers.length) * 30;
      maxScore += 30;
    }
    
    // تقييم ربط العملاء بالشيكات
    const customersWithChecks = customers.filter((c: any) => 
      checks.some((check: any) => check.customerId === c.id)
    ).length;
    if (customers.length > 0) {
      integrationScore += (customersWithChecks / customers.length) * 30;
      maxScore += 30;
    }
    
    const integrationLevel = maxScore > 0 ? (integrationScore / maxScore) * 100 : 100;
    
    return {
      module: 'العملاء',
      integrationLevel: Math.round(integrationLevel),
      status: this.getIntegrationStatus(integrationLevel),
      connectedSystems: ['المبيعات', 'الأقساط', 'الشيكات'],
      missingLinks: this.getCustomerMissingLinks(integrationLevel),
      recommendations: this.getCustomerRecommendations(integrationLevel)
    };
  }

  // تقييم تكامل الموردين
  private evaluateSuppliersIntegration(): SystemIntegrationStatus {
    const suppliers = storage.getItem('suppliers', []);
    const purchaseInvoices = storage.getItem('purchase_invoices', []);
    const checks = checksManager.getChecks();
    
    let integrationScore = 0;
    let maxScore = 0;
    
    // تقييم ربط الموردين بالفواتير
    const suppliersWithInvoices = suppliers.filter((s: any) => 
      purchaseInvoices.some((inv: any) => inv.supplierId === s.id)
    ).length;
    if (suppliers.length > 0) {
      integrationScore += (suppliersWithInvoices / suppliers.length) * 60;
      maxScore += 60;
    }
    
    // تقييم ربط الموردين بالشيكات
    const suppliersWithChecks = suppliers.filter((s: any) => 
      checks.some((check: any) => check.supplierId === s.id)
    ).length;
    if (suppliers.length > 0) {
      integrationScore += (suppliersWithChecks / suppliers.length) * 40;
      maxScore += 40;
    }
    
    const integrationLevel = maxScore > 0 ? (integrationScore / maxScore) * 100 : 100;
    
    return {
      module: 'الموردين',
      integrationLevel: Math.round(integrationLevel),
      status: this.getIntegrationStatus(integrationLevel),
      connectedSystems: ['المشتريات', 'الشيكات'],
      missingLinks: this.getSupplierMissingLinks(integrationLevel),
      recommendations: this.getSupplierRecommendations(integrationLevel)
    };
  }

  // تقييم تكامل الشيكات
  private evaluateChecksIntegration(): SystemIntegrationStatus {
    const checks = checksManager.getChecks();
    const linkedCount = checks.filter(c => c.customerId || c.supplierId).length;
    const integrationLevel = checks.length > 0 ? (linkedCount / checks.length) * 100 : 100;
    
    return {
      module: 'الشيكات',
      integrationLevel: Math.round(integrationLevel),
      status: this.getIntegrationStatus(integrationLevel),
      connectedSystems: ['العملاء', 'الموردين', 'الصندوق'],
      missingLinks: integrationLevel < 80 ? ['ربط بعض الشيكات بأصحابها'] : [],
      recommendations: integrationLevel < 80 ? ['تحسين ربط الشيكات بالعملاء والموردين'] : []
    };
  }

  // تقييم تكامل الأقساط
  private evaluateInstallmentsIntegration(): SystemIntegrationStatus {
    const installments = installmentsManager.getInstallments();
    const linkedCount = installments.filter(i => i.customerId).length;
    const integrationLevel = installments.length > 0 ? (linkedCount / installments.length) * 100 : 100;
    
    return {
      module: 'الأقساط',
      integrationLevel: Math.round(integrationLevel),
      status: this.getIntegrationStatus(integrationLevel),
      connectedSystems: ['العملاء', 'الصندوق'],
      missingLinks: integrationLevel < 80 ? ['ربط بعض الأقساط بالعملاء'] : [],
      recommendations: integrationLevel < 80 ? ['تحسين ربط الأقساط بالعملاء'] : []
    };
  }

  // تقييم تكامل المخزون
  private evaluateInventoryIntegration(): SystemIntegrationStatus {
    // استخدام المحسن الجديد للحصول على تقييم دقيق
    const status = inventoryIntegrationEnhancer.calculateIntegrationStatus();
    
    const missingLinks = [];
    const recommendations = [];
    
    if (status.integrationLevel < 80) {
      if (status.productsLinkedToSales / status.totalProducts < 0.8) {
        missingLinks.push('ربط المنتجات بفواتير المبيعات');
        recommendations.push('تحسين ربط المنتجات بالمبيعات');
      }
      
      if (status.productsLinkedToPurchases / status.totalProducts < 0.8) {
        missingLinks.push('ربط المنتجات بفواتير المشتريات');
        recommendations.push('تحسين ربط المنتجات بالمشتريات');
      }
      
      if (status.productsWithMovements / status.totalProducts < 0.8) {
        missingLinks.push('إنشاء حركات مخزون للمنتجات');
        recommendations.push('إنشاء حركات مخزون تلقائياً');
      }
      
      if (status.transactionsLinkedToProducts / status.totalTransactions < 0.8) {
        missingLinks.push('ربط المعاملات بالمنتجات');
        recommendations.push('تحديث بيانات المنتجات في الفواتير');
      }
    }
    
    return {
      module: 'المخزون',
      integrationLevel: status.integrationLevel,
      status: this.getIntegrationStatus(status.integrationLevel),
      connectedSystems: ['المبيعات', 'المشتريات', 'الباركود', 'حركات المخزون'],
      missingLinks,
      recommendations: recommendations.length > 0 ? recommendations : ['النظام متكامل بشكل ممتاز']
    };
  }

  // تقييم تكامل الصندوق
  private evaluateCashRegisterIntegration(): SystemIntegrationStatus {
    const cashEntries = storage.getItem('cash_register', []);
    const salesInvoices = storage.getItem('sales_invoices', []);
    const purchaseInvoices = storage.getItem('purchase_invoices', []);
    const expenses = storage.getItem('expenses', []);
    
    let integrationScore = 0;
    let maxScore = 0;
    
    // تقييم ربط الصندوق بالمبيعات
    const salesLinkedToCash = salesInvoices.filter((inv: any) => 
      cashEntries.some((entry: any) => entry.reference === inv.id)
    ).length;
    if (salesInvoices.length > 0) {
      integrationScore += (salesLinkedToCash / salesInvoices.length) * 40;
      maxScore += 40;
    }
    
    // تقييم ربط الصندوق بالمشتريات
    const purchasesLinkedToCash = purchaseInvoices.filter((inv: any) => 
      cashEntries.some((entry: any) => entry.reference === inv.id)
    ).length;
    if (purchaseInvoices.length > 0) {
      integrationScore += (purchasesLinkedToCash / purchaseInvoices.length) * 30;
      maxScore += 30;
    }
    
    // تقييم ربط الصندوق بالمصروفات
    const expensesLinkedToCash = expenses.filter((exp: any) => 
      cashEntries.some((entry: any) => entry.reference === exp.id)
    ).length;
    if (expenses.length > 0) {
      integrationScore += (expensesLinkedToCash / expenses.length) * 30;
      maxScore += 30;
    }
    
    const integrationLevel = maxScore > 0 ? (integrationScore / maxScore) * 100 : 100;
    
    return {
      module: 'الصندوق',
      integrationLevel: Math.round(integrationLevel),
      status: this.getIntegrationStatus(integrationLevel),
      connectedSystems: ['المبيعات', 'المشتريات', 'المصروفات', 'الشيكات'],
      missingLinks: integrationLevel < 80 ? ['ربط المعاملات بالصندوق'] : [],
      recommendations: integrationLevel < 80 ? ['تحسين ربط الصندوق بالمعاملات'] : []
    };
  }

  // تقييم تكامل المصروفات
  private evaluateExpensesIntegration(): SystemIntegrationStatus {
    const expenses = storage.getItem('expenses', []);
    const cashEntries = storage.getItem('cash_register', []);
    
    let integrationScore = 0;
    let maxScore = 0;
    
    // تقييم ربط المصروفات بالصندوق
    const expensesLinkedToCash = expenses.filter((exp: any) => 
      cashEntries.some((entry: any) => entry.reference === exp.id && entry.type === 'expense')
    ).length;
    if (expenses.length > 0) {
      integrationScore += (expensesLinkedToCash / expenses.length) * 100;
      maxScore += 100;
    }
    
    const integrationLevel = maxScore > 0 ? (integrationScore / maxScore) * 100 : 100;
    
    return {
      module: 'المصروفات',
      integrationLevel: Math.round(integrationLevel),
      status: this.getIntegrationStatus(integrationLevel),
      connectedSystems: ['الصندوق'],
      missingLinks: integrationLevel < 80 ? ['ربط المصروفات بالصندوق'] : [],
      recommendations: integrationLevel < 80 ? ['تحسين ربط المصروفات بالصندوق'] : []
    };
  }

  // تقييم تكامل الموظفين
  private evaluateEmployeesIntegration(): SystemIntegrationStatus {
    const employees = storage.getItem('employees', []);
    const payroll = storage.getItem('payroll', []);
    const cashEntries = storage.getItem('cash_register', []);
    
    let integrationScore = 0;
    let maxScore = 0;
    
    // تقييم ربط الموظفين بالأجور
    const employeesWithPayroll = employees.filter((emp: any) => 
      payroll.some((pay: any) => pay.employeeId === emp.id)
    ).length;
    if (employees.length > 0) {
      integrationScore += (employeesWithPayroll / employees.length) * 70;
      maxScore += 70;
    }
    
    // تقييم ربط الأجور بالصندوق
    const payrollLinkedToCash = payroll.filter((pay: any) => 
      cashEntries.some((entry: any) => entry.reference === pay.id)
    ).length;
    if (payroll.length > 0) {
      integrationScore += (payrollLinkedToCash / payroll.length) * 30;
      maxScore += 30;
    }
    
    const integrationLevel = maxScore > 0 ? (integrationScore / maxScore) * 100 : 100;
    
    return {
      module: 'الموظفين',
      integrationLevel: Math.round(integrationLevel),
      status: this.getIntegrationStatus(integrationLevel),
      connectedSystems: ['الأجور', 'الصندوق'],
      missingLinks: integrationLevel < 80 ? ['ربط الموظفين بالأجور', 'ربط الأجور بالصندوق'] : [],
      recommendations: integrationLevel < 80 ? ['تحسين ربط الموظفين بالأجور', 'ربط المرتبات بالصندوق'] : []
    };
  }

  // تقييم تكامل المرتجعات
  private evaluateReturnsIntegration(): SystemIntegrationStatus {
    const returns = storage.getItem('returns', []);
    const salesInvoices = storage.getItem('sales_invoices', []);
    const inventory = storage.getItem('products', []);
    const cashEntries = storage.getItem('cash_register', []);
    
    let integrationScore = 0;
    let maxScore = 0;
    
    // تقييم ربط المرتجعات بالمبيعات
    const returnsLinkedToSales = returns.filter((ret: any) => 
      salesInvoices.some((inv: any) => inv.id === ret.originalInvoiceId)
    ).length;
    if (returns.length > 0) {
      integrationScore += (returnsLinkedToSales / returns.length) * 50;
      maxScore += 50;
    }
    
    // تقييم ربط المرتجعات بالمخزون
    const returnsWithInventoryUpdate = returns.filter((ret: any) => 
      ret.inventoryUpdated === true
    ).length;
    if (returns.length > 0) {
      integrationScore += (returnsWithInventoryUpdate / returns.length) * 30;
      maxScore += 30;
    }
    
    // تقييم ربط المرتجعات بالصندوق
    const returnsLinkedToCash = returns.filter((ret: any) => 
      cashEntries.some((entry: any) => entry.reference === ret.id)
    ).length;
    if (returns.length > 0) {
      integrationScore += (returnsLinkedToCash / returns.length) * 20;
      maxScore += 20;
    }
    
    const integrationLevel = maxScore > 0 ? (integrationScore / maxScore) * 100 : 100;
    
    return {
      module: 'المرتجعات',
      integrationLevel: Math.round(integrationLevel),
      status: this.getIntegrationStatus(integrationLevel),
      connectedSystems: ['المبيعات', 'المخزون', 'الصندوق'],
      missingLinks: integrationLevel < 80 ? ['ربط المرتجعات بالمبيعات', 'تحديث المخزون'] : [],
      recommendations: integrationLevel < 80 ? ['تحسين ربط المرتجعات بالفواتير الأصلية', 'تحديث المخزون تلقائياً'] : []
    };
  }

  // تقييم تكامل إدارة المستخدمين
  private evaluateUserManagementIntegration(): SystemIntegrationStatus {
    const users = storage.getItem('users', []);
    const employees = storage.getItem('employees', []);
    
    let integrationScore = 0;
    let maxScore = 0;
    
    // تقييم ربط المستخدمين بالموظفين
    const usersLinkedToEmployees = users.filter((user: any) => 
      employees.some((emp: any) => emp.userId === user.id)
    ).length;
    if (users.length > 0) {
      integrationScore += (usersLinkedToEmployees / users.length) * 100;
      maxScore += 100;
    }
    
    const integrationLevel = maxScore > 0 ? (integrationScore / maxScore) * 100 : 100;
    
    return {
      module: 'إدارة المستخدمين',
      integrationLevel: Math.round(integrationLevel),
      status: this.getIntegrationStatus(integrationLevel),
      connectedSystems: ['الموظفين', 'الصلاحيات'],
      missingLinks: integrationLevel < 80 ? ['ربط المستخدمين بالموظفين'] : [],
      recommendations: integrationLevel < 80 ? ['ربط حسابات المستخدمين ببيانات الموظفين'] : []
    };
  }

  // الحصول على حالة التكامل
  private getIntegrationStatus(level: number): 'ممتاز' | 'جيد' | 'يحتاج تحسين' | 'ضعيف' {
    if (level >= 90) return 'ممتاز';
    if (level >= 75) return 'جيد';
    if (level >= 50) return 'يحتاج تحسين';
    return 'ضعيف';
  }

  // الحصول على الروابط المفقودة للعملاء
  private getCustomerMissingLinks(level: number): string[] {
    const missing = [];
    if (level < 80) {
      missing.push('ربط العملاء بفواتير المبيعات');
      missing.push('ربط العملاء بالأقساط');
      missing.push('ربط العملاء بالشيكات');
    }
    return missing;
  }

  // الحصول على توصيات العملاء
  private getCustomerRecommendations(level: number): string[] {
    const recommendations = [];
    if (level < 80) {
      recommendations.push('تشغيل ميزة الربط التلقائي للعملاء');
      recommendations.push('مراجعة بيانات العملاء لضمان الدقة');
      recommendations.push('تحديث معلومات الاتصال للعملاء');
    }
    return recommendations;
  }

  // الحصول على الروابط المفقودة للموردين
  private getSupplierMissingLinks(level: number): string[] {
    const missing = [];
    if (level < 80) {
      missing.push('ربط الموردين بفواتير المشتريات');
      missing.push('ربط الموردين بالشيكات');
    }
    return missing;
  }

  // الحصول على توصيات الموردين
  private getSupplierRecommendations(level: number): string[] {
    const recommendations = [];
    if (level < 80) {
      recommendations.push('تشغيل ميزة الربط التلقائي للموردين');
      recommendations.push('مراجعة بيانات الموردين لضمان الدقة');
    }
    return recommendations;
  }

  // تقرير شامل للتكامل
  generateIntegrationReport() {
    const assessments = this.evaluateSystemIntegration();
    const overallScore = assessments.reduce((sum, assessment) => sum + assessment.integrationLevel, 0) / assessments.length;
    
    return {
      overallScore: Math.round(overallScore),
      overallStatus: this.getIntegrationStatus(overallScore),
      moduleEvaluations: assessments,
      summary: {
        excellentModules: assessments.filter(e => e.status === 'ممتاز').length,
        goodModules: assessments.filter(e => e.status === 'جيد').length,
        needsImprovementModules: assessments.filter(e => e.status === 'يحتاج تحسين').length,
        poorModules: assessments.filter(e => e.status === 'ضعيف').length
      },
      topRecommendations: this.getTopRecommendations(assessments)
    };
  }

  // الحصول على أهم التوصيات
  private getTopRecommendations(evaluations: SystemIntegrationStatus[]): string[] {
    const allRecommendations = evaluations.flatMap(e => e.recommendations);
    const priorityRecommendations = [];
    
    // أولوية للنظم الأساسية
    const criticalModules = evaluations.filter(e => 
      ['المبيعات', 'المشتريات', 'العملاء'].includes(e.module) && e.integrationLevel < 80
    );
    
    if (criticalModules.length > 0) {
      priorityRecommendations.push('تشغيل ميزة التحسين الشامل للروابط');
      priorityRecommendations.push('مراجعة بيانات العملاء والموردين');
    }
    
    return priorityRecommendations.slice(0, 5);
  }
}

// Export singleton instance
export const enhancedIntegrationsManager = EnhancedIntegrationsManager.getInstance();