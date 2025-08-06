import { createContext, useContext, useState, ReactNode } from "react";
import { useOptimizedStorage } from "@/hooks/useOptimizedStorage";

export interface Customer {
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
  loyaltyPoints?: number;
  totalDebt?: number;
  creditLimit?: number;
  paymentReliability?: number;
  customerRank?: string;
  hasInstallments?: boolean;
  installmentAmount?: number;
}

interface CustomerContextType {
  customers: Customer[];
  deletedCustomers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'status' | 'createdAt'>) => void;
  updateCustomer: (id: number, customerData: Partial<Customer>) => void;
  deleteCustomer: (id: number) => void;
  deleteAllCustomers: () => void;
  restoreDeletedCustomers: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const initialCustomers: Customer[] = [];

export function CustomerProvider({ children }: { children: ReactNode }) {

  // استخدام التخزين المحسن مع debouncing
  const { data: customers, updateData: setCustomers } = useOptimizedStorage<Customer[]>(
    'customers', 
    initialCustomers,
    { debounceMs: 500 }
  );

  const { data: deletedCustomers, updateData: setDeletedCustomers } = useOptimizedStorage<Customer[]>(
    'deletedCustomers', 
    [],
    { debounceMs: 500 }
  );

  const addCustomer = (customerData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'status' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Math.max(...customers.map(c => c.id), ...deletedCustomers.map(c => c.id), 0) + 1,
      totalOrders: 0,
      totalSpent: 0,
      status: "نشط",
      createdAt: new Date()
    };
    setCustomers(prev => [...prev, newCustomer]);
  };

  const updateCustomer = (id: number, customerData: Partial<Customer>) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === id ? { ...customer, ...customerData } : customer
    ));
  };

  const deleteCustomer = (id: number) => {
    const customerToDelete = customers.find(c => c.id === id);
    if (customerToDelete) {
      setDeletedCustomers(prev => [...prev, customerToDelete]);
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  const deleteAllCustomers = () => {
    setDeletedCustomers(prev => [...prev, ...customers]);
    setCustomers([]);
  };

  const restoreDeletedCustomers = () => {
    setCustomers(prev => [...prev, ...deletedCustomers]);
    setDeletedCustomers([]);
  };

  return (
    <CustomerContext.Provider value={{ 
      customers, 
      deletedCustomers, 
      addCustomer,
      updateCustomer,
      deleteCustomer,
      deleteAllCustomers, 
      restoreDeletedCustomers 
    }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
}