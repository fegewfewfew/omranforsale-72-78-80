import { useState, useEffect, useCallback } from 'react';
import { useCustomers } from '@/contexts/CustomerContext';
import { storage } from '@/utils/storage';
import { installmentsManager } from '@/utils/installmentsManager';
import { checksManager } from '@/utils/checksManager';

export interface EnhancedCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  center?: string;
  country?: string;
  customerType?: string;
  taxNumber?: string;
  paymentOption?: string;
  debtLimit?: string;
  totalOrders: number;
  totalSpent: number;
  status: string;
  createdAt: Date;
  
  // Enhanced fields
  loyaltyPoints: number;
  totalDebt: number;
  creditLimit: number;
  paymentHistory: any[];
  installments: any[];
  checks: any[];
  lastPurchaseDate?: Date;
  averageOrderValue: number;
  customerRank: 'new' | 'regular' | 'vip' | 'premium';
  paymentReliability: number; // 0-100 score
  overdueAmount: number;
  totalInstallmentsAmount: number;
  totalChecksAmount: number;
}

export function useEnhancedCustomers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [enhancedCustomers, setEnhancedCustomers] = useState<EnhancedCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // تحديث بيانات العملاء المحسنة
  const enhanceCustomersData = useCallback(async () => {
    setIsLoading(true);
    try {
      const salesInvoices = storage.getItem('invoices', []);
      const enhanced = customers.map(customer => {
        // حساب المشتريات والمدفوعات
        const customerInvoices = salesInvoices.filter((inv: any) => 
          inv.customerName === customer.name || inv.customerId === customer.id
        );

        const totalSpent = customerInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
        const totalOrders = customerInvoices.length;
        const lastPurchaseDate = customerInvoices.length > 0 
          ? new Date(Math.max(...customerInvoices.map((inv: any) => new Date(inv.date).getTime())))
          : undefined;

        // حساب الأقساط
        const customerInstallments = installmentsManager.getInstallmentsByCustomer(customer.id.toString());
        const totalInstallmentsAmount = customerInstallments.reduce((sum, inst) => sum + inst.totalAmount, 0);
        const overdueInstallments = customerInstallments.filter(inst => inst.status === 'overdue');
        const overdueAmount = overdueInstallments.reduce((sum, inst) => sum + inst.remainingAmount, 0);

        // حساب الشيكات
        const customerChecks = checksManager.getChecksByCustomer(customer.id.toString());
        const totalChecksAmount = customerChecks.reduce((sum, check) => sum + check.amount, 0);

        // حساب نقاط الولاء (1 نقطة لكل 100 جنيه)
        const loyaltyPoints = Math.floor(totalSpent / 100);

        // تقييم العميل
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        let customerRank: 'new' | 'regular' | 'vip' | 'premium' = 'new';
        
        if (totalSpent > 100000) customerRank = 'premium';
        else if (totalSpent > 50000) customerRank = 'vip';
        else if (totalOrders > 5) customerRank = 'regular';

        // حساب موثوقية الدفع
        const completedInstallments = customerInstallments.filter(inst => inst.status === 'completed').length;
        const cashedChecks = customerChecks.filter(check => check.status === 'cashed').length;
        const paymentReliability = calculatePaymentReliability(
          customerInstallments.length,
          completedInstallments,
          customerChecks.length,
          cashedChecks
        );

        // جمع تاريخ المدفوعات
        const paymentHistory = [
          ...customerInvoices.map((inv: any) => ({
            type: 'sale',
            amount: inv.total,
            date: inv.date,
            reference: inv.id
          })),
          ...customerInstallments.flatMap(inst => 
            inst.paymentHistory.map(payment => ({
              type: 'installment',
              amount: payment.amount,
              date: payment.date,
              reference: inst.id
            }))
          )
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
          ...customer,
          totalSpent,
          totalOrders,
          loyaltyPoints,
          totalDebt: overdueAmount,
          creditLimit: parseFloat(customer.debtLimit || '0'),
          paymentHistory,
          installments: customerInstallments,
          checks: customerChecks,
          lastPurchaseDate,
          averageOrderValue,
          customerRank,
          paymentReliability,
          overdueAmount,
          totalInstallmentsAmount,
          totalChecksAmount
        } as EnhancedCustomer;
      });

      setEnhancedCustomers(enhanced);
    } catch (error) {
      console.error('خطأ في تحسين بيانات العملاء:', error);
    } finally {
      setIsLoading(false);
    }
  }, [customers]);

  useEffect(() => {
    enhanceCustomersData();
  }, [enhanceCustomersData]);

  // تحديث نقاط الولاء
  const updateLoyaltyPoints = (customerId: number, points: number) => {
    const customer = enhancedCustomers.find(c => c.id === customerId);
    if (customer) {
      const newPoints = Math.max(0, customer.loyaltyPoints + points);
      updateCustomer(customerId, { 
        loyaltyPoints: newPoints,
        totalSpent: customer.totalSpent 
      } as any);
    }
  };

  // إضافة مديونية
  const addDebt = (customerId: number, amount: number, description: string) => {
    const customer = enhancedCustomers.find(c => c.id === customerId);
    if (customer) {
      const newDebt = customer.totalDebt + amount;
      if (newDebt <= customer.creditLimit) {
        updateCustomer(customerId, { totalDebt: newDebt } as any);
        return true;
      }
      return false; // تجاوز الحد الائتماني
    }
    return false;
  };

  // دفع مديونية
  const payDebt = (customerId: number, amount: number) => {
    const customer = enhancedCustomers.find(c => c.id === customerId);
    if (customer && amount <= customer.totalDebt) {
      const newDebt = customer.totalDebt - amount;
      updateCustomer(customerId, { totalDebt: newDebt } as any);
      
      // إضافة نقاط ولاء للدفع المبكر
      updateLoyaltyPoints(customerId, Math.floor(amount / 100));
      return true;
    }
    return false;
  };

  // العملاء المتأخرين
  const getOverdueCustomers = () => {
    return enhancedCustomers.filter(customer => customer.overdueAmount > 0);
  };

  // العملاء VIP
  const getVIPCustomers = () => {
    return enhancedCustomers.filter(customer => 
      customer.customerRank === 'vip' || customer.customerRank === 'premium'
    );
  };

  // العملاء الجدد
  const getNewCustomers = (days: number = 30) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
    
    return enhancedCustomers.filter(customer => 
      new Date(customer.createdAt) >= thirtyDaysAgo
    );
  };

  return {
    enhancedCustomers,
    isLoading,
    updateLoyaltyPoints,
    addDebt,
    payDebt,
    getOverdueCustomers,
    getVIPCustomers,
    getNewCustomers,
    refreshData: enhanceCustomersData
  };
}

// حساب موثوقية الدفع
function calculatePaymentReliability(
  totalInstallments: number,
  completedInstallments: number,
  totalChecks: number,
  cashedChecks: number
): number {
  if (totalInstallments === 0 && totalChecks === 0) return 100;
  
  const installmentScore = totalInstallments > 0 ? (completedInstallments / totalInstallments) * 100 : 100;
  const checksScore = totalChecks > 0 ? (cashedChecks / totalChecks) * 100 : 100;
  
  return Math.round((installmentScore + checksScore) / 2);
}