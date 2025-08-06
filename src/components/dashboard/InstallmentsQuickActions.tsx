import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CreditCard, FileText, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { installmentsIntegrationManager } from '@/utils/installmentsIntegrationManager';
import { storage } from '@/utils/storage';

export const InstallmentsQuickActions = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [installmentPlan, setInstallmentPlan] = useState({
    numberOfInstallments: '3',
    installmentAmount: '',
    frequency: 'monthly'
  });
  const { toast } = useToast();

  const handleCreateFromInvoice = () => {
    if (!selectedInvoice || !installmentPlan.installmentAmount || !installmentPlan.numberOfInstallments) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    try {
      const plan = {
        numberOfInstallments: parseInt(installmentPlan.numberOfInstallments),
        installmentAmount: parseFloat(installmentPlan.installmentAmount),
        startDate: new Date().toISOString().split('T')[0],
        frequency: installmentPlan.frequency as 'monthly' | 'weekly' | 'quarterly'
      };

      installmentsIntegrationManager.createInstallmentFromInvoice(selectedInvoice, plan);
      
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء خطة الأقساط من الفاتورة",
      });

      // إعادة تعيين النموذج
      setSelectedInvoice('');
      setInstallmentPlan({
        numberOfInstallments: '3',
        installmentAmount: '',
        frequency: 'monthly'
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الأقساط",
        variant: "destructive"
      });
    }
  };

  const getRecentInvoices = () => {
    const invoices = storage.getItem('invoices', []);
    return invoices
      .filter((invoice: any) => !invoice.hasInstallments && invoice.totalAmount > 1000)
      .slice(0, 10);
  };

  const generateReport = () => {
    try {
      const report = installmentsIntegrationManager.generateInstallmentReport();
      console.log('تقرير الأقساط:', report);
      
      toast({
        title: "تم إنشاء التقرير",
        description: "تم إنشاء تقرير الأقساط - تحقق من وحدة التحكم",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive"
      });
    }
  };

  const recentInvoices = getRecentInvoices();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          إجراءات سريعة - الأقساط
        </CardTitle>
        <CardDescription>
          عمليات سريعة لإدارة الأقساط
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* إنشاء أقساط من فاتورة */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              تحويل فاتورة إلى أقساط
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء خطة أقساط من فاتورة</DialogTitle>
              <DialogDescription>
                اختر فاتورة وحدد خطة التقسيط
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invoice">اختر الفاتورة</Label>
                <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر فاتورة..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recentInvoices.map((invoice: any) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        فاتورة #{invoice.invoiceNumber} - {invoice.totalAmount.toLocaleString()} ر.س
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="installments">عدد الأقساط</Label>
                <Select value={installmentPlan.numberOfInstallments} onValueChange={(value) => 
                  setInstallmentPlan({...installmentPlan, numberOfInstallments: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 أقساط</SelectItem>
                    <SelectItem value="6">6 أقساط</SelectItem>
                    <SelectItem value="12">12 قسط</SelectItem>
                    <SelectItem value="24">24 قسط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">مبلغ القسط</Label>
                <Input
                  type="number"
                  value={installmentPlan.installmentAmount}
                  onChange={(e) => setInstallmentPlan({...installmentPlan, installmentAmount: e.target.value})}
                  placeholder="مبلغ القسط الشهري"
                />
              </div>

              <div>
                <Label htmlFor="frequency">تكرار الدفع</Label>
                <Select value={installmentPlan.frequency} onValueChange={(value) => 
                  setInstallmentPlan({...installmentPlan, frequency: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">شهرياً</SelectItem>
                    <SelectItem value="weekly">أسبوعياً</SelectItem>
                    <SelectItem value="quarterly">ربع سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreateFromInvoice} className="w-full">
                إنشاء خطة الأقساط
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* إنشاء تقرير سريع */}
        <Button 
          variant="outline" 
          onClick={generateReport}
          className="w-full"
        >
          <FileText className="h-4 w-4 mr-2" />
          إنشاء تقرير الأقساط
        </Button>


        {/* معلومات الفواتير المتاحة */}
        {recentInvoices.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground mb-2">
              فواتير متاحة للتقسيط:
            </div>
            <div className="space-y-1">
              {recentInvoices.slice(0, 3).map((invoice: any) => (
                <div key={invoice.id} className="flex justify-between text-xs">
                  <span>#{invoice.invoiceNumber}</span>
                  <Badge variant="secondary" className="text-xs">
                    {invoice.totalAmount.toLocaleString()} ر.س
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};