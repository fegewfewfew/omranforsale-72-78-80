import { storage } from './storage';
import { inventoryManager } from './inventoryUtils';
import { cashFlowManager } from './cashFlowManager';
import { employeeManager } from './employeeManager';
import { checksManager } from './checksManager';
import { expensesManager } from './expensesManager';
import { installmentsManager } from './installmentsManager';
import { returnsManager } from './returnsManager';
import { payrollManager } from './payrollManager';
import { businessIntegration } from './businessIntegration';

export interface UnifiedReport {
  id: string;
  title: string;
  type: 'financial' | 'operational' | 'performance' | 'comprehensive' | 'integration';
  period: {
    start: string;
    end: string;
  };
  data: any;
  generatedAt: string;
  generatedBy?: string;
}

export interface FinancialOverview {
  salesRevenue: number;
  purchaseCosts: number;
  grossProfit: number;
  grossProfitMargin: number;
  operatingExpenses: number;
  payrollCosts: number;
  netProfit: number;
  netProfitMargin: number;
  cashFlow: {
    inflows: number;
    outflows: number;
    netFlow: number;
  };
  accountsReceivable: number;
  accountsPayable: number;
  pendingChecks: number;
  pendingInstallments: number;
}

export interface OperationalMetrics {
  inventory: {
    totalProducts: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    fastMovingProducts: any[];
    slowMovingProducts: any[];
    turnoverRate: number;
  };
  sales: {
    totalInvoices: number;
    averageOrderValue: number;
    topCustomers: any[];
    salesTrends: any[];
  };
  purchases: {
    totalOrders: number;
    topSuppliers: any[];
    purchaseTrends: any[];
  };
  employees: {
    totalCount: number;
    payrollTrends: any[];
    performanceMetrics: any[];
  };
}

export interface PerformanceAnalysis {
  profitabilityByProduct: any[];
  profitabilityByCustomer: any[];
  profitabilityByPeriod: any[];
  costAnalysis: {
    directCosts: number;
    indirectCosts: number;
    variableCosts: number;
    fixedCosts: number;
  };
  efficiency: {
    inventoryTurnover: number;
    receivablesTurnover: number;
    payablesTurnover: number;
    assetUtilization: number;
  };
  trends: {
    revenue: any[];
    profit: any[];
    costs: any[];
    volumes: any[];
  };
}

export class UnifiedReportingManager {
  private static instance: UnifiedReportingManager;

  static getInstance(): UnifiedReportingManager {
    if (!UnifiedReportingManager.instance) {
      UnifiedReportingManager.instance = new UnifiedReportingManager();
    }
    return UnifiedReportingManager.instance;
  }

  // Generate comprehensive financial overview
  generateFinancialOverview(startDate: string, endDate: string): FinancialOverview {
    try {
      const businessAnalytics = businessIntegration.getBusinessAnalytics();
      const cashFlowTransactions = cashFlowManager.getTransactions().filter(t => {
        const tDate = new Date(t.date).getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return tDate >= start && tDate <= end;
      });
      const totalIncome = cashFlowTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalCashFlowExpenses = cashFlowTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const cashFlowReport = {
        summary: {
          totalIncome,
          totalExpenses: totalCashFlowExpenses,
          netCashFlow: totalIncome - totalCashFlowExpenses
        }
      };
      const expenses = expensesManager.getExpensesByDateRange(startDate, endDate);
      const allPayroll = payrollManager.getPayrollRecords();
      const payrollCosts = allPayroll.filter((pr: any) => {
        const prDate = new Date(pr.date || pr.createdAt).getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return prDate >= start && prDate <= end;
      });
      const allChecks = checksManager.getChecks();
      const pendingChecks = allChecks.filter((c: any) => c.status === 'pending');
      const allInstallments = installmentsManager.getInstallments();
      const pendingInstallments = allInstallments.filter((i: any) => i.status === 'pending');

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalPayroll = payrollCosts.reduce((sum, pr) => sum + pr.totalAmount, 0);
      const operatingExpenses = totalExpenses + totalPayroll;
      const netProfit = businessAnalytics.grossProfit - operatingExpenses;

      return {
        salesRevenue: businessAnalytics.salesRevenue,
        purchaseCosts: businessAnalytics.purchaseCosts,
        grossProfit: businessAnalytics.grossProfit,
        grossProfitMargin: businessAnalytics.grossProfitMargin,
        operatingExpenses,
        payrollCosts: totalPayroll,
        netProfit,
        netProfitMargin: businessAnalytics.salesRevenue > 0 ? (netProfit / businessAnalytics.salesRevenue) * 100 : 0,
        cashFlow: {
          inflows: cashFlowReport.summary.totalIncome,
          outflows: cashFlowReport.summary.totalExpenses,
          netFlow: cashFlowReport.summary.netCashFlow
        },
        accountsReceivable: this.calculateAccountsReceivable(),
        accountsPayable: this.calculateAccountsPayable(),
        pendingChecks: pendingChecks.reduce((sum, check) => sum + check.amount, 0),
        pendingInstallments: pendingInstallments.reduce((sum, inst) => sum + inst.remainingAmount, 0)
      };
    } catch (error) {
      console.error('Error generating financial overview:', error);
      throw error;
    }
  }

  // Generate operational metrics
  generateOperationalMetrics(startDate: string, endDate: string): OperationalMetrics {
    try {
      const products = inventoryManager.getProducts();
      const movements = inventoryManager.getMovementsByDateRange(startDate, endDate);
      const salesInvoices = this.getSalesInvoicesByDateRange(startDate, endDate);
      const purchaseInvoices = this.getPurchaseInvoicesByDateRange(startDate, endDate);
      const employees = employeeManager.getEmployees();

      // Calculate inventory metrics
      const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
      const lowStockItems = inventoryManager.getLowStockProducts().length;
      const outOfStockItems = inventoryManager.getOutOfStockProducts().length;
      const fastMovingProducts = this.getFastMovingProducts(movements);
      const slowMovingProducts = this.getSlowMovingProducts(movements);
      const turnoverRate = this.calculateInventoryTurnover(movements, totalValue);

      // Calculate sales metrics
      const averageOrderValue = salesInvoices.length > 0 
        ? salesInvoices.reduce((sum, inv) => sum + inv.total, 0) / salesInvoices.length 
        : 0;
      const topCustomers = this.getTopCustomers(salesInvoices);
      const salesTrends = this.calculateSalesTrends(salesInvoices);

      // Calculate purchase metrics
      const topSuppliers = this.getTopSuppliers(purchaseInvoices);
      const purchaseTrends = this.calculatePurchaseTrends(purchaseInvoices);

      return {
        inventory: {
          totalProducts: products.length,
          totalValue,
          lowStockItems,
          outOfStockItems,
          fastMovingProducts,
          slowMovingProducts,
          turnoverRate
        },
        sales: {
          totalInvoices: salesInvoices.length,
          averageOrderValue,
          topCustomers,
          salesTrends
        },
        purchases: {
          totalOrders: purchaseInvoices.length,
          topSuppliers,
          purchaseTrends
        },
        employees: {
          totalCount: employees.length,
          payrollTrends: this.calculatePayrollTrends(startDate, endDate),
          performanceMetrics: this.calculateEmployeePerformance()
        }
      };
    } catch (error) {
      console.error('Error generating operational metrics:', error);
      throw error;
    }
  }

  // Generate performance analysis
  generatePerformanceAnalysis(startDate: string, endDate: string): PerformanceAnalysis {
    try {
      const salesInvoices = this.getSalesInvoicesByDateRange(startDate, endDate);
      const purchaseInvoices = this.getPurchaseInvoicesByDateRange(startDate, endDate);
      const expenses = expensesManager.getExpensesByDateRange(startDate, endDate);

      const profitabilityByProduct = this.calculateProductProfitability(salesInvoices);
      const profitabilityByCustomer = this.calculateCustomerProfitability(salesInvoices);
      const profitabilityByPeriod = this.calculatePeriodProfitability(salesInvoices, startDate, endDate);

      const directCosts = purchaseInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const indirectCosts = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalCosts = directCosts + indirectCosts;

      return {
        profitabilityByProduct,
        profitabilityByCustomer,
        profitabilityByPeriod,
        costAnalysis: {
          directCosts,
          indirectCosts,
          variableCosts: directCosts * 0.8, // Estimate
          fixedCosts: indirectCosts + (directCosts * 0.2)
        },
        efficiency: {
          inventoryTurnover: this.calculateInventoryTurnover(
            inventoryManager.getMovementsByDateRange(startDate, endDate),
            inventoryManager.getProducts().reduce((sum, p) => sum + (p.stock * p.cost), 0)
          ),
          receivablesTurnover: this.calculateReceivablesTurnover(salesInvoices),
          payablesTurnover: this.calculatePayablesTurnover(purchaseInvoices),
          assetUtilization: this.calculateAssetUtilization()
        },
        trends: {
          revenue: this.calculateRevenueTrends(salesInvoices),
          profit: this.calculateProfitTrends(salesInvoices, totalCosts),
          costs: this.calculateCostTrends(expenses),
          volumes: this.calculateVolumeTrends(salesInvoices)
        }
      };
    } catch (error) {
      console.error('Error generating performance analysis:', error);
      throw error;
    }
  }

  // Generate comprehensive report
  generateComprehensiveReport(startDate: string, endDate: string): UnifiedReport {
    try {
      const financial = this.generateFinancialOverview(startDate, endDate);
      const operational = this.generateOperationalMetrics(startDate, endDate);
      const performance = this.generatePerformanceAnalysis(startDate, endDate);

      const report: UnifiedReport = {
        id: `unified_${Date.now()}`,
        title: `تقرير شامل للفترة من ${startDate} إلى ${endDate}`,
        type: 'comprehensive',
        period: { start: startDate, end: endDate },
        data: {
          financial,
          operational,
          performance,
          summary: {
            totalRevenue: financial.salesRevenue,
            totalProfit: financial.netProfit,
            profitMargin: financial.netProfitMargin,
            cashPosition: financial.cashFlow.netFlow,
            inventoryValue: operational.inventory.totalValue,
            customerCount: operational.sales.topCustomers.length,
            productCount: operational.inventory.totalProducts,
            employeeCount: operational.employees.totalCount
          }
        },
        generatedAt: new Date().toISOString()
      };

      // Save report
      this.saveReport(report);
      
      return report;
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateAccountsReceivable(): number {
    const salesInvoices = storage.getItem('sales_invoices', []);
    return salesInvoices
      .filter((inv: any) => inv.paymentStatus === 'pending')
      .reduce((sum: number, inv: any) => sum + inv.total, 0);
  }

  private calculateAccountsPayable(): number {
    const purchaseInvoices = storage.getItem('purchase_invoices', []);
    return purchaseInvoices
      .filter((inv: any) => inv.status === 'pending')
      .reduce((sum: number, inv: any) => sum + inv.total, 0);
  }

  private getSalesInvoicesByDateRange(startDate: string, endDate: string): any[] {
    const salesInvoices = storage.getItem('sales_invoices', []);
    return salesInvoices.filter((inv: any) => {
      const invDate = new Date(inv.date).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      return invDate >= start && invDate <= end;
    });
  }

  private getPurchaseInvoicesByDateRange(startDate: string, endDate: string): any[] {
    const purchaseInvoices = storage.getItem('purchase_invoices', []);
    return purchaseInvoices.filter((inv: any) => {
      const invDate = new Date(inv.date).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      return invDate >= start && invDate <= end;
    });
  }

  private getFastMovingProducts(movements: any[]): any[] {
    const productMovements: { [key: string]: number } = {};
    
    movements
      .filter(m => m.type === 'out')
      .forEach(m => {
        productMovements[m.productId] = (productMovements[m.productId] || 0) + m.quantity;
      });

    return Object.entries(productMovements)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([productId, quantity]) => ({ productId, quantity }));
  }

  private getSlowMovingProducts(movements: any[]): any[] {
    const products = inventoryManager.getProducts();
    const productMovements: { [key: string]: number } = {};
    
    movements
      .filter(m => m.type === 'out')
      .forEach(m => {
        productMovements[m.productId] = (productMovements[m.productId] || 0) + m.quantity;
      });

    return products
      .filter(p => (productMovements[p.id] || 0) < 5)
      .sort((a, b) => (productMovements[a.id] || 0) - (productMovements[b.id] || 0))
      .slice(0, 10);
  }

  private calculateInventoryTurnover(movements: any[], averageInventoryValue: number): number {
    const costOfGoodsSold = movements
      .filter(m => m.type === 'out')
      .reduce((sum, m) => sum + m.value, 0);
    
    return averageInventoryValue > 0 ? costOfGoodsSold / averageInventoryValue : 0;
  }

  private getTopCustomers(salesInvoices: any[]): any[] {
    const customerTotals: { [key: string]: number } = {};
    
    salesInvoices.forEach(inv => {
      customerTotals[inv.customerName] = (customerTotals[inv.customerName] || 0) + inv.total;
    });

    return Object.entries(customerTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, total]) => ({ name, total }));
  }

  private getTopSuppliers(purchaseInvoices: any[]): any[] {
    const supplierTotals: { [key: string]: number } = {};
    
    purchaseInvoices.forEach(inv => {
      supplierTotals[inv.supplier] = (supplierTotals[inv.supplier] || 0) + inv.total;
    });

    return Object.entries(supplierTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, total]) => ({ name, total }));
  }

  private calculateSalesTrends(salesInvoices: any[]): any[] {
    const monthlyData: { [key: string]: number } = {};
    
    salesInvoices.forEach(inv => {
      const month = new Date(inv.date).toISOString().substring(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + inv.total;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));
  }

  private calculatePurchaseTrends(purchaseInvoices: any[]): any[] {
    const monthlyData: { [key: string]: number } = {};
    
    purchaseInvoices.forEach(inv => {
      const month = new Date(inv.date).toISOString().substring(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + inv.total;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));
  }

  private calculatePayrollTrends(startDate: string, endDate: string): any[] {
    const payrollRecords = payrollManager.getPayrollByDateRange(startDate, endDate);
    const monthlyData: { [key: string]: number } = {};
    
    payrollRecords.forEach(record => {
      const month = new Date(record.date).toISOString().substring(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + record.totalAmount;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));
  }

  private calculateEmployeePerformance(): any[] {
    // This would require more detailed employee tracking
    // For now, return basic metrics
    const employees = employeeManager.getEmployees();
    return employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      department: emp.department,
      performanceScore: Math.random() * 100 // Placeholder
    }));
  }

  private calculateProductProfitability(salesInvoices: any[]): any[] {
    const productData: { [key: string]: { revenue: number; cost: number; quantity: number } } = {};
    
    salesInvoices.forEach(inv => {
      if (inv.itemsDetails) {
        inv.itemsDetails.forEach((item: any) => {
          if (!productData[item.productName]) {
            productData[item.productName] = { revenue: 0, cost: 0, quantity: 0 };
          }
          productData[item.productName].revenue += item.total;
          productData[item.productName].cost += (item.cost || 0) * item.quantity;
          productData[item.productName].quantity += item.quantity;
        });
      }
    });

    return Object.entries(productData)
      .map(([name, data]) => ({
        product: name,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.revenue - data.cost,
        margin: data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0,
        quantity: data.quantity
      }))
      .sort((a, b) => b.profit - a.profit);
  }

  private calculateCustomerProfitability(salesInvoices: any[]): any[] {
    const customerData: { [key: string]: { revenue: number; orders: number } } = {};
    
    salesInvoices.forEach(inv => {
      if (!customerData[inv.customerName]) {
        customerData[inv.customerName] = { revenue: 0, orders: 0 };
      }
      customerData[inv.customerName].revenue += inv.total;
      customerData[inv.customerName].orders += 1;
    });

    return Object.entries(customerData)
      .map(([name, data]) => ({
        customer: name,
        revenue: data.revenue,
        orders: data.orders,
        averageOrderValue: data.revenue / data.orders
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private calculatePeriodProfitability(salesInvoices: any[], startDate: string, endDate: string): any[] {
    const monthlyData: { [key: string]: { revenue: number; cost: number } } = {};
    
    salesInvoices.forEach(inv => {
      const month = new Date(inv.date).toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, cost: 0 };
      }
      monthlyData[month].revenue += inv.total;
      
      if (inv.itemsDetails) {
        const invoiceCost = inv.itemsDetails.reduce((sum: number, item: any) => 
          sum + ((item.cost || 0) * item.quantity), 0);
        monthlyData[month].cost += invoiceCost;
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        period: month,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.revenue - data.cost,
        margin: data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0
      }));
  }

  private calculateReceivablesTurnover(salesInvoices: any[]): number {
    const totalRevenue = salesInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const averageReceivables = this.calculateAccountsReceivable();
    return averageReceivables > 0 ? totalRevenue / averageReceivables : 0;
  }

  private calculatePayablesTurnover(purchaseInvoices: any[]): number {
    const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const averagePayables = this.calculateAccountsPayable();
    return averagePayables > 0 ? totalPurchases / averagePayables : 0;
  }

  private calculateAssetUtilization(): number {
    // This would require asset tracking - placeholder calculation
    const inventoryValue = inventoryManager.getProducts()
      .reduce((sum, p) => sum + (p.stock * p.cost), 0);
    const totalRevenue = storage.getItem('sales_invoices', [])
      .reduce((sum: number, inv: any) => sum + inv.total, 0);
    
    return inventoryValue > 0 ? totalRevenue / inventoryValue : 0;
  }

  private calculateRevenueTrends(salesInvoices: any[]): any[] {
    return this.calculateSalesTrends(salesInvoices);
  }

  private calculateProfitTrends(salesInvoices: any[], totalCosts: number): any[] {
    const revenueTrends = this.calculateRevenueTrends(salesInvoices);
    const avgCostPerMonth = totalCosts / Math.max(revenueTrends.length, 1);
    
    return revenueTrends.map(trend => ({
      month: trend.month,
      profit: trend.total - avgCostPerMonth,
      revenue: trend.total
    }));
  }

  private calculateCostTrends(expenses: any[]): any[] {
    const monthlyData: { [key: string]: number } = {};
    
    expenses.forEach(exp => {
      const month = new Date(exp.date).toISOString().substring(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + exp.amount;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));
  }

  private calculateVolumeTrends(salesInvoices: any[]): any[] {
    const monthlyData: { [key: string]: number } = {};
    
    salesInvoices.forEach(inv => {
      const month = new Date(inv.date).toISOString().substring(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  }

  // Save and retrieve reports
  saveReport(report: UnifiedReport): void {
    try {
      const reports = storage.getItem('unified_reports', []);
      reports.push(report);
      
      // Keep only last 50 reports
      if (reports.length > 50) {
        reports.splice(0, reports.length - 50);
      }
      
      storage.setItem('unified_reports', reports);
    } catch (error) {
      console.error('Error saving report:', error);
    }
  }

  getReports(): UnifiedReport[] {
    return storage.getItem('unified_reports', []);
  }

  getReport(id: string): UnifiedReport | null {
    const reports = this.getReports();
    return reports.find(r => r.id === id) || null;
  }

  deleteReport(id: string): boolean {
    try {
      const reports = this.getReports();
      const filteredReports = reports.filter(r => r.id !== id);
      storage.setItem('unified_reports', filteredReports);
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      return false;
    }
  }
}

// Export singleton instance
export const unifiedReporting = UnifiedReportingManager.getInstance();
