import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category?: string;
  unit_price: number;
  cost_price: number;
  min_stock_level: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  last_updated: string;
  updated_by?: string;
  product?: Product;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer';
  quantity: number;
  unit_price?: number;
  total_amount?: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  product?: Product;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: 'sale' | 'purchase' | 'return';
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  status: 'draft' | 'confirmed' | 'paid' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount?: number;
  product?: Product;
}

export const useInventory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // جلب المنتجات
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user
  });

  // جلب المخزون
  const {
    data: inventory = [],
    isLoading: inventoryLoading,
    error: inventoryError
  } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          product:products(*)
        `)
        .order('last_updated', { ascending: false });
      
      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!user
  });

  // جلب حركات المخزون
  const {
    data: movements = [],
    isLoading: movementsLoading,
    error: movementsError
  } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          product:products(name, sku)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as InventoryMovement[];
    },
    enabled: !!user
  });

  // جلب الفواتير
  const {
    data: invoices = [],
    isLoading: invoicesLoading,
    error: invoicesError
  } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!user
  });

  // إضافة منتج جديد
  const addProductMutation = useMutation({
    mutationFn: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert([{ ...productData, created_by: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم إضافة المنتج بنجاح');
    },
    onError: (error: any) => {
      toast.error(`خطأ في إضافة المنتج: ${error.message}`);
    }
  });

  // تحديث منتج
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...productData }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('تم تحديث المنتج بنجاح');
    },
    onError: (error: any) => {
      toast.error(`خطأ في تحديث المنتج: ${error.message}`);
    }
  });

  // إضافة حركة مخزون
  const addMovementMutation = useMutation({
    mutationFn: async (movementData: Omit<InventoryMovement, 'id' | 'created_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert([{ ...movementData, created_by: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('تم إضافة حركة المخزون بنجاح');
    },
    onError: (error: any) => {
      toast.error(`خطأ في إضافة حركة المخزون: ${error.message}`);
    }
  });

  // إضافة فاتورة
  const addInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: {
      invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'created_by'>;
      items: Omit<InvoiceItem, 'id' | 'invoice_id'>[];
    }) => {
      // إنشاء الفاتورة أولاً
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{ ...invoiceData.invoice, created_by: user?.id }])
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;

      // إضافة عناصر الفاتورة
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .insert(
          invoiceData.items.map(item => ({
            ...item,
            invoice_id: invoice.id
          }))
        )
        .select();
      
      if (itemsError) throw itemsError;

      return { invoice, items };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast.success('تم إنشاء الفاتورة بنجاح');
    },
    onError: (error: any) => {
      toast.error(`خطأ في إنشاء الفاتورة: ${error.message}`);
    }
  });

  // تأكيد الفاتورة
  const confirmInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'confirmed' })
        .eq('id', invoiceId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast.success('تم تأكيد الفاتورة وتحديث المخزون بنجاح');
    },
    onError: (error: any) => {
      toast.error(`خطأ في تأكيد الفاتورة: ${error.message}`);
    }
  });

  // الحصول على تقرير المخزون
  const getInventoryReport = async () => {
    const { data, error } = await supabase
      .rpc('get_inventory_report');
    
    if (error) throw error;
    return data;
  };

  return {
    // البيانات
    products,
    inventory,
    movements,
    invoices,
    
    // حالات التحميل
    productsLoading,
    inventoryLoading,
    movementsLoading,
    invoicesLoading,
    
    // الأخطاء
    productsError,
    inventoryError,
    movementsError,
    invoicesError,
    
    // العمليات
    addProduct: addProductMutation.mutate,
    updateProduct: updateProductMutation.mutate,
    addMovement: addMovementMutation.mutate,
    addInvoice: addInvoiceMutation.mutate,
    confirmInvoice: confirmInvoiceMutation.mutate,
    getInventoryReport,
    
    // حالات العمليات
    isAddingProduct: addProductMutation.isPending,
    isUpdatingProduct: updateProductMutation.isPending,
    isAddingMovement: addMovementMutation.isPending,
    isAddingInvoice: addInvoiceMutation.isPending,
    isConfirmingInvoice: confirmInvoiceMutation.isPending
  };
};