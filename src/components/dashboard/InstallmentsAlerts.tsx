import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Phone, DollarSign } from 'lucide-react';
import { installmentsManager } from '@/utils/installmentsManager';
import { installmentsIntegrationManager } from '@/utils/installmentsIntegrationManager';
import { storage } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';

export const InstallmentsAlerts = () => {
  const [overdueInstallments, setOverdueInstallments] = useState<any[]>([]);
  const [upcomingDue, setUpcomingDue] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
    
    // تشغيل فحص الأقساط المتأخرة
    installmentsIntegrationManager.checkOverdueInstallments();
    installmentsIntegrationManager.sendPaymentReminders();
  }, []);

  const loadAlerts = () => {
    const allInstallments = installmentsManager.getInstallments();
    const customers = storage.getItem('customers', []);
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    // الأقساط المتأخرة
    const overdue = allInstallments
      .filter(inst => inst.status === 'overdue')
      .map(inst => {
        const customer = customers.find((c: any) => c.id === inst.customerId);
        return {
          ...inst,
          customerInfo: customer
        };
      })
      .slice(0, 5); // أحدث 5 أقساط متأخرة

    // الأقساط المستحقة قريباً
    const upcoming = allInstallments
      .filter(inst => {
        if (inst.status !== 'active') return false;
        const dueDate = new Date(inst.dueDate);
        return dueDate >= today && dueDate <= threeDaysFromNow;
      })
      .map(inst => {
        const customer = customers.find((c: any) => c.id === inst.customerId);
        return {
          ...inst,
          customerInfo: customer
        };
      })
      .slice(0, 5); // أحدث 5 أقساط مستحقة

    setOverdueInstallments(overdue);
    setUpcomingDue(upcoming);
  };

  const handleContactCustomer = (customerPhone: string, customerName: string) => {
    if (customerPhone) {
      const whatsappUrl = `https://wa.me/966${customerPhone.replace(/^0/, '')}?text=مرحباً ${customerName}، نذكركم بموعد استحقاق القسط`;
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "تم فتح واتساب",
        description: `تم توجيهك لمراسلة ${customerName}`,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (overdueInstallments.length === 0 && upcomingDue.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <DollarSign className="h-5 w-5" />
            تنبيهات الأقساط
          </CardTitle>
          <CardDescription>جميع الأقساط محدثة ✅</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          تنبيهات الأقساط
        </CardTitle>
        <CardDescription>
          الأقساط المتأخرة والمستحقة قريباً
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* الأقساط المتأخرة */}
        {overdueInstallments.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              أقساط متأخرة ({overdueInstallments.length})
            </h4>
            <div className="space-y-2">
              {overdueInstallments.map((installment) => (
                <div key={installment.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-l-red-500">
                  <div className="flex-1">
                    <div className="font-medium text-red-900">
                      {installment.customerInfo?.name || installment.customerName}
                    </div>
                    <div className="text-sm text-red-700">
                      مبلغ القسط: {installment.installmentAmount.toLocaleString()} ر.س
                    </div>
                    <div className="text-xs text-red-600">
                      استحق في: {formatDate(installment.dueDate)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      متأخر
                    </Badge>
                    {installment.customerPhone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleContactCustomer(installment.customerPhone, installment.customerName)}
                        className="h-8 w-8 p-0"
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* الأقساط المستحقة قريباً */}
        {upcomingDue.length > 0 && (
          <div>
            <h4 className="font-semibold text-amber-600 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              مستحقة قريباً ({upcomingDue.length})
            </h4>
            <div className="space-y-2">
              {upcomingDue.map((installment) => (
                <div key={installment.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border-l-4 border-l-amber-500">
                  <div className="flex-1">
                    <div className="font-medium text-amber-900">
                      {installment.customerInfo?.name || installment.customerName}
                    </div>
                    <div className="text-sm text-amber-700">
                      مبلغ القسط: {installment.installmentAmount.toLocaleString()} ر.س
                    </div>
                    <div className="text-xs text-amber-600">
                      يستحق في: {formatDate(installment.dueDate)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                      {getDaysUntilDue(installment.dueDate)} يوم
                    </Badge>
                    {installment.customerPhone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleContactCustomer(installment.customerPhone, installment.customerName)}
                        className="h-8 w-8 p-0"
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* رابط سريع لصفحة الأقساط */}
        <div className="pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.href = '/installments'}
            className="w-full"
          >
            عرض جميع الأقساط
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};