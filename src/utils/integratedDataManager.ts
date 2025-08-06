import { storage } from './storage';
import { expensesManager } from './expensesManager';
import { checksManager } from './checksManager';
import { returnsManager } from './returnsManager';
import { installmentsManager } from './installmentsManager';
import { cashFlowManager } from './cashFlowManager';
import { businessIntegration } from './businessIntegration';
import { employeeManager } from './employeeManager';
import { payrollManager } from './payrollManager';

export interface UserActivityRecord {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  entityId?: string;
  entityType?: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export class IntegratedDataManager {
  private static instance: IntegratedDataManager;

  static getInstance(): IntegratedDataManager {
    if (!IntegratedDataManager.instance) {
      IntegratedDataManager.instance = new IntegratedDataManager();
    }
    return IntegratedDataManager.instance;
  }

  // Initialize and sync all integrated systems
  initializeIntegratedSystems(): void {
    try {
      console.log('Initializing integrated data systems...');
      
      // Sync all managers with cash flow
      expensesManager.syncWithCashFlow();
      checksManager.syncWithCashFlow();
      installmentsManager.syncWithCashFlow();
      
      // Sync business integration
      businessIntegration.migrateExistingData();
      
      // Sync employee payroll data
      employeeManager.syncEmployeeFinancials();
      payrollManager.syncWithFinancialSystems();
      
      // Update all account balances
      cashFlowManager.syncAllFinancialData();
      
      console.log('Integrated data systems initialized successfully');
    } catch (error) {
      console.error('Error initializing integrated systems:', error);
    }
  }

  // Get comprehensive dashboard data
  getIntegratedDashboardData() {
    try {
      // Get data from all managers
      const expenseStats = expensesManager.getExpenseStatistics();
      const checkStats = checksManager.getCheckStatistics();
      const returnStats = returnsManager.getReturnStatistics();
      const installmentStats = installmentsManager.getInstallmentStatistics();
      const businessAnalytics = businessIntegration.getBusinessAnalytics();
      const financialSummary = cashFlowManager.getFinancialSummary();
      const employeeStats = employeeManager.getEmployeeStatistics();
      const payrollStats = payrollManager.getPayrollStatistics();

      // Get alerts and notifications
      const alerts = this.getSystemAlerts();
      
      return {
        financial: {
          currentBalance: financialSummary.currentBalance,
          thisMonthIncome: financialSummary.thisMonthIncome,
          thisMonthExpenses: financialSummary.thisMonthExpenses,
          netCashFlow: financialSummary.thisMonthNetFlow,
          incomeGrowth: financialSummary.incomeGrowth,
          expenseGrowth: financialSummary.expenseGrowth
        },
        sales: {
          totalRevenue: businessAnalytics.salesRevenue,
          grossProfit: businessAnalytics.grossProfit,
          grossProfitMargin: businessAnalytics.grossProfitMargin,
          topProducts: businessAnalytics.topSellingProducts
        },
        inventory: {
          totalProducts: businessAnalytics.totalProducts,
          lowStockAlerts: businessAnalytics.lowStockAlerts,
          outOfStockAlerts: businessAnalytics.outOfStockAlerts
        },
        expenses: {
          totalExpenses: expenseStats.totalExpenses,
          paidExpenses: expenseStats.paidExpenses,
          pendingExpenses: expenseStats.pendingExpenses,
          categoryBreakdown: expenseStats.categoryBreakdown
        },
        checks: {
          totalChecks: checkStats.totalChecks,
          pendingAmount: checkStats.totalPendingAmount,
          cashedAmount: checkStats.totalCashedAmount,
          overdueCount: checkStats.overdueCount
        },
        returns: {
          totalReturns: returnStats.totalReturns,
          processedValue: returnStats.processedValue,
          pendingCount: returnStats.pendingCount
        },
        installments: {
          totalInstallments: installmentStats.totalInstallments,
          totalRemaining: installmentStats.totalRemaining,
          overdueCount: installmentStats.overdueCount,
          paymentRate: installmentStats.paymentRate
        },
        employees: {
          totalEmployees: employeeStats.totalEmployees,
          activeEmployees: employeeStats.activeEmployees,
          totalSalaries: employeeStats.totalSalaries,
          departments: employeeStats.departments
        },
        payroll: {
          totalPayrollBudget: payrollStats.totalPayrollBudget,
          paidEmployees: payrollStats.paidEmployees,
          unpaidEmployees: payrollStats.unpaidEmployees,
          totalPaidAmount: payrollStats.totalPaidAmount,
          totalUnpaidAmount: payrollStats.totalUnpaidAmount,
          paymentRate: payrollStats.paymentRate
        },
        alerts,
        recentActivity: this.getRecentActivity(10)
      };
    } catch (error) {
      console.error('Error getting integrated dashboard data:', error);
      return null;
    }
  }

  // Get system alerts and notifications
  getSystemAlerts() {
    const alerts: any[] = [];

    try {
      // Check inventory alerts
      const businessAnalytics = businessIntegration.getBusinessAnalytics();
      if (businessAnalytics.lowStockAlerts > 0) {
        alerts.push({
          type: 'warning',
          module: 'inventory',
          title: 'تنبيه مخزون منخفض',
          message: `يوجد ${businessAnalytics.lowStockAlerts} منتج بمخزون منخفض`,
          priority: 'medium',
          timestamp: new Date().toISOString()
        });
      }

      if (businessAnalytics.outOfStockAlerts > 0) {
        alerts.push({
          type: 'error',
          module: 'inventory',
          title: 'تنبيه نفاد المخزون',
          message: `يوجد ${businessAnalytics.outOfStockAlerts} منتج نفد من المخزون`,
          priority: 'high',
          timestamp: new Date().toISOString()
        });
      }

      // Check overdue installments
      const overdueInstallments = installmentsManager.getOverdueInstallments();
      if (overdueInstallments.length > 0) {
        const totalOverdueAmount = overdueInstallments.reduce((sum, inst) => sum + inst.remainingAmount, 0);
        alerts.push({
          type: 'warning',
          module: 'installments',
          title: 'أقساط متأخرة',
          message: `يوجد ${overdueInstallments.length} قسط متأخر بقيمة ${totalOverdueAmount.toLocaleString()} ج.م`,
          priority: 'high',
          timestamp: new Date().toISOString()
        });
      }

      // Check overdue checks
      const overdueChecks = checksManager.getOverdueChecks();
      if (overdueChecks.length > 0) {
        const totalOverdueAmount = overdueChecks.reduce((sum, check) => sum + check.amount, 0);
        alerts.push({
          type: 'warning',
          module: 'checks',
          title: 'شيكات متأخرة',
          message: `يوجد ${overdueChecks.length} شيك متأخر بقيمة ${totalOverdueAmount.toLocaleString()} ج.م`,
          priority: 'medium',
          timestamp: new Date().toISOString()
        });
      }

      // Check pending returns
      const pendingReturns = returnsManager.getReturnsByStatus('pending');
      if (pendingReturns.length > 0) {
        alerts.push({
          type: 'info',
          module: 'returns',
          title: 'مرتجعات في الانتظار',
          message: `يوجد ${pendingReturns.length} مرتجع في انتظار المراجعة`,
          priority: 'low',
          timestamp: new Date().toISOString()
        });
      }

      // Check due installments in next 7 days
      const dueSoonInstallments = installmentsManager.getInstallmentsDueSoon(7);
      if (dueSoonInstallments.length > 0) {
        alerts.push({
          type: 'info',
          module: 'installments',
          title: 'أقساط مستحقة قريباً',
          message: `يوجد ${dueSoonInstallments.length} قسط مستحق خلال الأسبوع القادم`,
          priority: 'low',
          timestamp: new Date().toISOString()
        });
      }

      // Check due checks in next 7 days
      const dueSoonChecks = checksManager.getChecksDueSoon();
      if (dueSoonChecks.length > 0) {
        alerts.push({
          type: 'info',
          module: 'checks',
          title: 'شيكات مستحقة قريباً',
          message: `يوجد ${dueSoonChecks.length} شيك مستحق خلال الأسبوع القادم`,
          priority: 'low',
          timestamp: new Date().toISOString()
        });
      }

      // Check unpaid salaries
      const unpaidSalaries = payrollManager.getPayrollStatistics().unpaidEmployees;
      if (unpaidSalaries > 0) {
        const unpaidAmount = payrollManager.getPayrollStatistics().totalUnpaidAmount;
        alerts.push({
          type: 'warning',
          module: 'payroll',
          title: 'رواتب غير مدفوعة',
          message: `يوجد ${unpaidSalaries} موظف برواتب غير مدفوعة بقيمة ${unpaidAmount.toLocaleString()} ج.م`,
          priority: 'medium',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Error getting system alerts:', error);
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Log user activity
  logUserActivity(activity: Omit<UserActivityRecord, 'id' | 'timestamp'>): void {
    try {
      const newActivity: UserActivityRecord = {
        ...activity,
        id: `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString()
      };

      const activities = storage.getItem('user_activities', []);
      activities.unshift(newActivity); // Add to beginning

      // Keep only last 1000 activities
      if (activities.length > 1000) {
        activities.splice(1000);
      }

      storage.setItem('user_activities', activities);
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  }

  // Get recent user activities
  getRecentActivity(limit: number = 20): UserActivityRecord[] {
    try {
      const activities = storage.getItem('user_activities', []);
      return activities.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  // Get comprehensive financial report
  getIntegratedFinancialReport(startDate: string, endDate: string) {
    try {
      // Get cash flow report
      const cashFlowReport = cashFlowManager.generateCashFlowReport(startDate, endDate);
      
      // Get specific module data for the period
      const expenses = expensesManager.getExpensesByDateRange(startDate, endDate);
      const returns = returnsManager.getReturnsByDateRange(startDate, endDate);
      
      // Get monthly installment collections
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      let installmentCollections = 0;
      
      for (let date = new Date(startDateObj); date <= endDateObj; date.setMonth(date.getMonth() + 1)) {
        const monthlyReport = installmentsManager.getMonthlyCollectionReport(date.getFullYear(), date.getMonth() + 1);
        installmentCollections += monthlyReport.totalAmount;
      }

      // Get check collections for the period
      let checkCollections = 0;
      for (let date = new Date(startDateObj); date <= endDateObj; date.setMonth(date.getMonth() + 1)) {
        const monthlyReport = checksManager.getMonthlyCollectionReport(date.getFullYear(), date.getMonth() + 1);
        checkCollections += monthlyReport.totalAmount;
      }

      return {
        period: { startDate, endDate },
        cashFlow: cashFlowReport,
        breakdown: {
          expenses: {
            total: expenses.reduce((sum, e) => sum + e.amount, 0),
            count: expenses.length,
            byCategory: expenses.reduce((acc, e) => {
              acc[e.category] = (acc[e.category] || 0) + e.amount;
              return acc;
            }, {} as { [key: string]: number })
          },
          returns: {
            total: returns.reduce((sum, r) => sum + r.totalAmount, 0),
            count: returns.length,
            processed: returns.filter(r => r.status === 'processed').length
          },
          installments: {
            collected: installmentCollections
          },
          checks: {
            cashed: checkCollections
          }
        }
      };
    } catch (error) {
      console.error('Error generating integrated financial report:', error);
      return null;
    }
  }

  // Validate data integrity across all systems
  validateDataIntegrity(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    try {
      // Check if cash flow transactions match with source records
      const transactions = cashFlowManager.getTransactions();
      
      transactions.forEach(transaction => {
        if (transaction.referenceType === 'manual' && transaction.referenceId) {
          // Check if referenced record exists
          let referenceExists = false;
          
          if (transaction.category === 'sales' && transaction.subcategory === 'شيكات') {
            const checks = checksManager.getChecks();
            referenceExists = checks.some(c => c.id === transaction.referenceId);
          } else if (transaction.category === 'sales' && transaction.subcategory === 'أقساط') {
            const installments = installmentsManager.getInstallments();
            referenceExists = installments.some(i => 
              i.paymentHistory.some(p => p.id === transaction.referenceId)
            );
          } else if (transaction.type === 'expense' && transaction.subcategory !== 'مرتجعات') {
            const expenses = expensesManager.getExpenses();
            referenceExists = expenses.some(e => e.id === transaction.referenceId);
          }
          
          if (!referenceExists && transaction.referenceId) {
            issues.push(`معاملة نقدية ${transaction.id} تشير إلى سجل غير موجود: ${transaction.referenceId}`);
          }
        }
      });

      // Check customer data consistency
      const customers = storage.getItem('customers', []);
      customers.forEach((customer: any) => {
        if (customer.hasInstallments) {
          const customerInstallments = installmentsManager.getInstallmentsByCustomer(customer.id);
          if (customerInstallments.length === 0) {
            issues.push(`العميل ${customer.name} مُعلم بأن لديه أقساط لكن لا توجد أقساط مسجلة`);
          }
        }
      });

    } catch (error) {
      issues.push(`خطأ في فحص تكامل البيانات: ${error.message}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Clean up orphaned data
  cleanupOrphanedData(): { cleaned: number; details: string[] } {
    let cleanedCount = 0;
    const details: string[] = [];

    try {
      // Remove orphaned cash flow transactions
      const transactions = cashFlowManager.getTransactions();
      const validTransactions = transactions.filter(transaction => {
        if (!transaction.referenceId || !transaction.referenceType) return true;
        
        let isValid = true;
        
        // Check if referenced record exists
        if (transaction.category === 'sales' && transaction.subcategory === 'شيكات') {
          const checks = checksManager.getChecks();
          isValid = checks.some(c => c.id === transaction.referenceId);
        } else if (transaction.category === 'sales' && transaction.subcategory === 'أقساط') {
          const installments = installmentsManager.getInstallments();
          isValid = installments.some(i => 
            i.paymentHistory.some(p => p.id === transaction.referenceId)
          );
        }
        
        if (!isValid) {
          cleanedCount++;
          details.push(`تم حذف معاملة نقدية يتيمة: ${transaction.description}`);
        }
        
        return isValid;
      });

      storage.setItem('cash_flow_transactions', validTransactions);

    } catch (error) {
      details.push(`خطأ في تنظيف البيانات: ${error.message}`);
    }

    return { cleaned: cleanedCount, details };
  }

  // Export all integrated data
  exportIntegratedData() {
    try {
      return {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          expenses: expensesManager.getExpenses(),
          deletedExpenses: expensesManager.getDeletedExpenses(),
          checks: checksManager.getChecks(),
          returns: returnsManager.getReturns(),
          installments: installmentsManager.getInstallments(),
          cashFlowTransactions: cashFlowManager.getTransactions(),
          userActivities: this.getRecentActivity(500),
          // Include existing data
          employees: employeeManager.getEmployees(),
          payrollRecords: payrollManager.getPayrollRecords(),
          salaryAdjustments: payrollManager.getSalaryAdjustments(),
          customers: storage.getItem('customers', []),
          salesInvoices: storage.getItem('sales_invoices', []),
          purchaseInvoices: storage.getItem('purchase_invoices', []),
          products: storage.getItem('products', []),
          inventoryMovements: storage.getItem('inventory_movements', []),
          suppliers: storage.getItem('suppliers', [])
        }
      };
    } catch (error) {
      console.error('Error exporting integrated data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const integratedDataManager = IntegratedDataManager.getInstance();
