import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { installmentsManager, Installment } from '@/utils/installmentsManager';
import { storage } from '@/utils/storage';
import { CustomerInstallmentsCard } from './CustomerInstallmentsCard';
import { InstallmentDetailsView } from './InstallmentDetailsView';
import { InstallmentStatsCards } from './InstallmentStatsCards';
import { InstallmentPaymentDialog } from './InstallmentPaymentDialog';
import { InstallmentReportsDialog } from './InstallmentReportsDialog';
import { installmentsIntegrationManager } from '@/utils/installmentsIntegrationManager';

interface InstallmentsByCustomerDashboardProps {
  customerId?: string;
}

export const InstallmentsByCustomerDashboard = ({ customerId }: InstallmentsByCustomerDashboardProps) => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customerId || '');

  useEffect(() => {
    loadData();
    
    // فحص الأقساط المتأخرة وإرسال التنبيهات
    installmentsIntegrationManager.checkOverdueInstallments();
    installmentsIntegrationManager.sendPaymentReminders();
  }, [selectedCustomerId]);

  const loadData = () => {
    // تحميل الأقساط
    if (selectedCustomerId) {
      const customerInstallments = installmentsManager.getInstallmentsByCustomer(selectedCustomerId);
      setInstallments(customerInstallments);
    } else {
      setInstallments(installmentsManager.getInstallments());
    }

    // تحميل العملاء
    setCustomers(storage.getItem('customers', []));
  };


  const getCustomerInstallmentsStats = (customerId: string) => {
    const customerInstallments = installments.filter(inst => inst.customerId === customerId);
    
    const active = customerInstallments.filter(i => i.status === 'active');
    const completed = customerInstallments.filter(i => i.status === 'completed');
    const overdue = customerInstallments.filter(i => i.status === 'overdue');
    
    return {
      total: customerInstallments.length,
      active: active.length,
      completed: completed.length,
      overdue: overdue.length,
      totalAmount: customerInstallments.reduce((sum, i) => sum + i.totalAmount, 0),
      paidAmount: customerInstallments.reduce((sum, i) => sum + i.paidAmount, 0),
      remainingAmount: customerInstallments.reduce((sum, i) => sum + i.remainingAmount, 0)
    };
  };

  const filteredInstallments = selectedCustomerId 
    ? installments.filter(inst => inst.customerId === selectedCustomerId)
    : installments;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">أقساط العملاء</h2>
          <p className="text-muted-foreground">
            إدارة ومتابعة الأقساط مع العملاء
          </p>
        </div>
        <div className="flex gap-2">
          <InstallmentReportsDialog customerId={selectedCustomerId} />
          <User className="h-6 w-6" />
        </div>
      </div>

      {/* قائمة العملاء مع إحصائيات الأقساط */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customers.map((customer) => {
          const stats = getCustomerInstallmentsStats(customer.id);
          
          return (
            <CustomerInstallmentsCard
              key={customer.id}
              customer={customer}
              stats={stats}
              isSelected={selectedCustomerId === customer.id}
              onClick={() => setSelectedCustomerId(selectedCustomerId === customer.id ? '' : customer.id)}
            />
          );
        })}
      </div>

      {/* تفاصيل أقساط العميل المحدد */}
      {selectedCustomerId && (
        <InstallmentDetailsView
          installments={filteredInstallments}
          customerName={customers.find(c => c.id === selectedCustomerId)?.name || 'غير محدد'}
        />
      )}

      {/* إحصائيات عامة عند عدم تحديد عميل */}
      {!selectedCustomerId && (
        <InstallmentStatsCards installments={installments} />
      )}
    </div>
  );
};