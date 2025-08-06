import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, TrendingUp, Calendar, Users, DollarSign } from 'lucide-react';
import { installmentsIntegrationManager } from '@/utils/installmentsIntegrationManager';

interface InstallmentReportsDialogProps {
  customerId?: string;
}

export const InstallmentReportsDialog = ({ customerId }: InstallmentReportsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const generateReport = () => {
    const dateRange = selectedPeriod === 'all' ? undefined : {
      startDate: getDateRange(selectedPeriod).start,
      endDate: getDateRange(selectedPeriod).end
    };

    return installmentsIntegrationManager.generateInstallmentReport(customerId, dateRange);
  };

  const getAnalytics = () => {
    return installmentsIntegrationManager.getInstallmentAnalytics();
  };

  const getDateRange = (period: string) => {
    const today = new Date();
    const ranges: Record<string, { start: string; end: string }> = {
      'this_month': {
        start: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
        end: today.toISOString()
      },
      'last_month': {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), 0).toISOString()
      },
      'this_year': {
        start: new Date(today.getFullYear(), 0, 1).toISOString(),
        end: today.toISOString()
      }
    };
    return ranges[period] || { start: '', end: '' };
  };

  const report = generateReport();
  const analytics = getAnalytics();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          التقارير والتحليلات
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            تقارير وتحليلات الأقساط
          </DialogTitle>
          <DialogDescription>
            تقارير شاملة عن الأقساط والأداء المالي
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">الملخص</TabsTrigger>
            <TabsTrigger value="customers">العملاء</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
            <TabsTrigger value="timeline">الجدول الزمني</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">إجمالي الأقساط</div>
                      <div className="text-xl font-bold">{report.summary.totalInstallments}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-success" />
                    <div>
                      <div className="text-sm text-muted-foreground">إجمالي المبلغ</div>
                      <div className="text-xl font-bold">{report.summary.totalAmount.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">المدفوع</div>
                      <div className="text-xl font-bold text-success">{report.summary.paidAmount.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-warning" />
                    <div>
                      <div className="text-sm text-muted-foreground">المتبقي</div>
                      <div className="text-xl font-bold text-warning">{report.summary.remainingAmount.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {report.summary.overdueAmount > 0 && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">تحذير - مبالغ متأخرة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {report.summary.overdueAmount.toLocaleString()} ر.س
                  </div>
                  <p className="text-sm text-muted-foreground">
                    يجب المتابعة مع العملاء لتحصيل هذه المبالغ
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <div className="space-y-4">
              {report.customerBreakdown.map((customer) => (
                <Card key={customer.customerId}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{customer.customerName}</span>
                      <Badge variant="secondary">{customer.installments.length} قسط</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">إجمالي</div>
                        <div className="font-semibold">{customer.totalAmount.toLocaleString()} ر.س</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">مدفوع</div>
                        <div className="font-semibold text-success">{customer.paidAmount.toLocaleString()} ر.س</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">متبقي</div>
                        <div className="font-semibold text-warning">{customer.remainingAmount.toLocaleString()} ر.س</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>اتجاهات الدفع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>دفعات في الوقت المحدد</span>
                      <Badge variant="default">{analytics.paymentTrends.onTimePayments}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>دفعات متأخرة</span>
                      <Badge variant="destructive">{analytics.paymentTrends.latePayments}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>دفعات مفقودة</span>
                      <Badge variant="secondary">{analytics.paymentTrends.missedPayments}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>التوقعات المالية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>الإيرادات المتوقعة</span>
                      <span className="font-semibold">{analytics.financialProjections.expectedRevenue.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>التحصيلات المتوقعة</span>
                      <span className="font-semibold text-success">{analytics.financialProjections.projectedCollections.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>المبلغ المعرض للخطر</span>
                      <span className="font-semibold text-destructive">{analytics.financialProjections.riskAmount.toLocaleString()} ر.س</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>أداء العملاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.customerPerformance.slice(0, 5).map((customer) => (
                    <div key={customer.customerId} className="flex items-center justify-between p-3 border rounded">
                      <span>{customer.customerName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={customer.paymentScore > 80 ? 'default' : customer.paymentScore > 60 ? 'secondary' : 'destructive'}>
                          {customer.paymentScore}%
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          متوسط التأخير: {customer.averageDelayDays} يوم
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <div className="space-y-3">
              {report.timeline.slice(0, 10).map((entry, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{new Date(entry.date).toLocaleDateString('ar-SA')}</span>
                      <div className="flex gap-4 text-sm">
                        <span>مستحق: {entry.dueAmount.toLocaleString()} ر.س</span>
                        <span className="text-success">مدفوع: {entry.paidAmount.toLocaleString()} ر.س</span>
                        {entry.overdueAmount > 0 && (
                          <span className="text-destructive">متأخر: {entry.overdueAmount.toLocaleString()} ر.س</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            تصدير PDF
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير Excel
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};