import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  FileBarChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Target,
  Calendar,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  X
} from "lucide-react";
import { unifiedReporting, UnifiedReport, FinancialOverview, OperationalMetrics, PerformanceAnalysis } from "@/utils/unifiedReporting";
import { enhancedIntegrationManager } from "@/utils/enhancedIntegrationManager";
import { useEnhancedCustomers } from "@/hooks/useEnhancedCustomers";

export function UnifiedReportsManager() {
  const { enhancedCustomers, isLoading: customersLoading } = useEnhancedCustomers();
  const [reports, setReports] = useState<UnifiedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<UnifiedReport | null>(null);
  const [reportType, setReportType] = useState<'financial' | 'operational' | 'performance' | 'comprehensive' | 'integration'>('comprehensive');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [integrationMetrics, setIntegrationMetrics] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadReports();
    loadIntegrationMetrics();
  }, []);

  const loadIntegrationMetrics = () => {
    const metrics = enhancedIntegrationManager.getSystemIntegrationMetrics();
    setIntegrationMetrics(metrics);
  };

  const loadReports = () => {
    const savedReports = unifiedReporting.getReports();
    setReports(savedReports);
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return;
    }

    setIsGenerating(true);
    try {
      let report: UnifiedReport;

      switch (reportType) {
        case 'financial':
          const financial = unifiedReporting.generateFinancialOverview(startDate, endDate);
          report = {
            id: `financial_${Date.now()}`,
            title: `التقرير المالي للفترة من ${startDate} إلى ${endDate}`,
            type: 'financial',
            period: { start: startDate, end: endDate },
            data: financial,
            generatedAt: new Date().toISOString()
          };
          unifiedReporting.saveReport(report);
          break;
        case 'operational':
          const operational = unifiedReporting.generateOperationalMetrics(startDate, endDate);
          report = {
            id: `operational_${Date.now()}`,
            title: `التقرير التشغيلي للفترة من ${startDate} إلى ${endDate}`,
            type: 'operational',
            period: { start: startDate, end: endDate },
            data: operational,
            generatedAt: new Date().toISOString()
          };
          unifiedReporting.saveReport(report);
          break;
        case 'performance':
          const performance = unifiedReporting.generatePerformanceAnalysis(startDate, endDate);
          report = {
            id: `performance_${Date.now()}`,
            title: `تقرير الأداء للفترة من ${startDate} إلى ${endDate}`,
            type: 'performance',
            period: { start: startDate, end: endDate },
            data: performance,
            generatedAt: new Date().toISOString()
          };
          unifiedReporting.saveReport(report);
          break;
        case 'comprehensive':
          report = unifiedReporting.generateComprehensiveReport(startDate, endDate);
          break;
        case 'integration':
          const integrationData = generateIntegrationReport(startDate, endDate);
          report = {
            id: `integration_${Date.now()}`,
            title: `تقرير التكامل الشامل للفترة من ${startDate} إلى ${endDate}`,
            type: 'integration',
            period: { start: startDate, end: endDate },
            data: integrationData,
            generatedAt: new Date().toISOString()
          };
          unifiedReporting.saveReport(report);
          break;
      }

      loadReports();
      toast.success('تم إنشاء التقرير بنجاح');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('حدث خطأ أثناء إنشاء التقرير');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteReport = (reportId: string) => {
    if (unifiedReporting.deleteReport(reportId)) {
      loadReports();
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
      toast.success('تم حذف التقرير بنجاح');
    } else {
      toast.error('حدث خطأ أثناء حذف التقرير');
    }
  };

  const viewReport = (report: UnifiedReport) => {
    setSelectedReport(report);
  };

  const getReportTypeLabel = (type: string) => {
    const labels = {
      financial: 'مالي',
      operational: 'تشغيلي',
      performance: 'أداء',
      comprehensive: 'شامل',
      integration: 'تكامل'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getReportTypeColor = (type: string) => {
    const colors = {
      financial: 'bg-green-100 text-green-800',
      operational: 'bg-blue-100 text-blue-800',
      performance: 'bg-purple-100 text-purple-800',
      comprehensive: 'bg-orange-100 text-orange-800',
      integration: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  // إنشاء تقرير التكامل
  const generateIntegrationReport = (startDate: string, endDate: string) => {
    const metrics = enhancedIntegrationManager.getSystemIntegrationMetrics();
    const alerts = enhancedIntegrationManager.generateSmartAlerts();
    const overdueCustomers = enhancedCustomers.filter(c => c.overdueAmount > 0);
    const vipCustomers = enhancedCustomers.filter(c => c.customerRank === 'vip' || c.customerRank === 'premium');
    
    return {
      metrics,
      alerts: alerts.slice(0, 10), // أحدث 10 تنبيهات
      overdueCustomers: overdueCustomers.slice(0, 10),
      vipCustomers: vipCustomers.slice(0, 10),
      customerInsights: {
        totalCustomers: enhancedCustomers.length,
        newCustomers: enhancedCustomers.filter(c => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return new Date(c.createdAt) >= thirtyDaysAgo;
        }).length,
        loyaltyPointsTotal: enhancedCustomers.reduce((sum, c) => sum + c.loyaltyPoints, 0),
        averagePaymentReliability: enhancedCustomers.length > 0 
          ? enhancedCustomers.reduce((sum, c) => sum + c.paymentReliability, 0) / enhancedCustomers.length 
          : 100
      }
    };
  };

  // مكون عرض تقرير التكامل
  const IntegrationReportViewer = ({ report, onClose }: { report: any; onClose: () => void }) => {
    const data = report.data;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-background rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
          <div className="p-6 border-b border-border">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{report.title}</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* المقاييس الأساسية */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{data.metrics?.totalCustomers || 0}</div>
                  <div className="text-sm text-muted-foreground">إجمالي العملاء</div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{data.metrics?.activeInstallments || 0}</div>
                  <div className="text-sm text-muted-foreground">أقساط نشطة</div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.metrics?.pendingChecks || 0}</div>
                  <div className="text-sm text-muted-foreground">شيكات معلقة</div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{data.metrics?.overdueCustomers || 0}</div>
                  <div className="text-sm text-muted-foreground">عملاء متأخرين</div>
                </div>
              </Card>
            </div>

            {/* التنبيهات المهمة */}
            {data.alerts && data.alerts.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">التنبيهات الهامة</h3>
                <div className="space-y-3">
                  {data.alerts.slice(0, 5).map((alert: any, index: number) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                      alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground">{alert.message}</div>
                        </div>
                        {alert.amount && (
                          <div className="text-sm font-medium">
                            {alert.amount.toLocaleString()} ج.م
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* العملاء المتأخرين */}
            {data.overdueCustomers && data.overdueCustomers.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">العملاء المتأخرين</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-right p-2">اسم العميل</th>
                        <th className="text-right p-2">المبلغ المتأخر</th>
                        <th className="text-right p-2">نقاط الولاء</th>
                        <th className="text-right p-2">موثوقية الدفع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.overdueCustomers.map((customer: any, index: number) => (
                        <tr key={index} className="border-b border-border hover:bg-muted/50">
                          <td className="p-2 font-medium">{customer.name}</td>
                          <td className="p-2 text-red-600">{customer.overdueAmount?.toLocaleString()} ج.م</td>
                          <td className="p-2">{customer.loyaltyPoints || 0}</td>
                          <td className="p-2">
                            <div className={`inline-block px-2 py-1 rounded text-xs ${
                              customer.paymentReliability >= 80 ? 'bg-green-100 text-green-800' :
                              customer.paymentReliability >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {customer.paymentReliability || 100}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* العملاء VIP */}
            {data.vipCustomers && data.vipCustomers.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">العملاء المميزين</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.vipCustomers.map((customer: any, index: number) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.phone}</div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          customer.customerRank === 'premium' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {customer.customerRank === 'premium' ? 'مميز جداً' : 'مميز'}
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <div>إجمالي المشتريات: {customer.totalSpent?.toLocaleString()} ج.م</div>
                        <div>نقاط الولاء: {customer.loyaltyPoints || 0}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* إحصائيات العملاء */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">تحليلات العملاء</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.customerInsights?.newCustomers || 0}</div>
                  <div className="text-sm text-muted-foreground">عملاء جدد (30 يوم)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.customerInsights?.loyaltyPointsTotal?.toLocaleString() || 0}</div>
                  <div className="text-sm text-muted-foreground">إجمالي نقاط الولاء</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{Math.round(data.customerInsights?.averagePaymentReliability || 100)}%</div>
                  <div className="text-sm text-muted-foreground">متوسط موثوقية الدفع</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{Math.round(data.metrics?.averageCustomerValue || 0).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">متوسط قيمة العميل</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">التقارير الموحدة</h1>
          <p className="text-muted-foreground mt-2">
            إنشاء وإدارة التقارير الشاملة لجميع أنشطة الشركة
          </p>
        </div>
        <Button onClick={loadReports} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">إنشاء تقرير جديد</TabsTrigger>
          <TabsTrigger value="manage">إدارة التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5" />
                إنشاء تقرير جديد
              </CardTitle>
              <CardDescription>
                اختر نوع التقرير والفترة الزمنية لإنشاء تقرير شامل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">نوع التقرير</Label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع التقرير" />
                    </SelectTrigger>
                     <SelectContent>
                      <SelectItem value="comprehensive">تقرير شامل</SelectItem>
                      <SelectItem value="integration">تقرير التكامل</SelectItem>
                      <SelectItem value="financial">تقرير مالي</SelectItem>
                      <SelectItem value="operational">تقرير تشغيلي</SelectItem>
                      <SelectItem value="performance">تقرير أداء</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">تاريخ البداية</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">تاريخ النهاية</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={generateReport}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    جاري إنشاء التقرير...
                  </>
                ) : (
                  <>
                    <FileBarChart className="mr-2 h-4 w-4" />
                    إنشاء التقرير
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {!selectedReport ? (
            <Card>
              <CardHeader>
                <CardTitle>التقارير المحفوظة</CardTitle>
                <CardDescription>
                  إدارة وعرض التقارير المنشأة مسبقاً
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileBarChart className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>لا توجد تقارير محفوظة</p>
                    <p className="text-sm">قم بإنشاء تقرير جديد من التبويب الأول</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{report.title}</h3>
                            <Badge className={getReportTypeColor(report.type)}>
                              {getReportTypeLabel(report.type)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(report.period.start)} - {formatDate(report.period.end)}
                            </span>
                            <span>
                              تم الإنشاء: {formatDate(report.generatedAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewReport(report)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            عرض
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteReport(report.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <ReportViewer 
              report={selectedReport} 
              onBack={() => setSelectedReport(null)}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Report Viewer Component
interface ReportViewerProps {
  report: UnifiedReport;
  onBack: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

function ReportViewer({ report, onBack, formatCurrency, formatDate }: ReportViewerProps) {
  const renderFinancialReport = (data: FinancialOverview) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.salesRevenue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التكاليف</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.purchaseCosts + data.operatingExpenses)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">صافي الربح</p>
                <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.netProfit)}
                </p>
              </div>
              <DollarSign className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الأداء المالي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">هامش الربح الإجمالي</p>
              <p className="text-lg font-semibold">{data.grossProfitMargin.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">هامش الربح الصافي</p>
              <p className="text-lg font-semibold">{data.netProfitMargin.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">التدفق النقدي الصافي</p>
              <p className={`text-lg font-semibold ${data.cashFlow.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.cashFlow.netFlow)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الحسابات المستحقة</p>
              <p className="text-lg font-semibold">{formatCurrency(data.accountsReceivable)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOperationalReport = (data: OperationalMetrics) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
                <p className="text-2xl font-bold">{data.inventory.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيمة المخزون</p>
                <p className="text-2xl font-bold">{formatCurrency(data.inventory.totalValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عدد الموظفين</p>
                <p className="text-2xl font-bold">{data.employees.totalCount}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">معدل دوران المخزون</p>
                <p className="text-2xl font-bold">{data.inventory.turnoverRate.toFixed(2)}</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>تحليل المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>منتجات منخفضة المخزون</span>
                <Badge variant="destructive">{data.inventory.lowStockItems}</Badge>
              </div>
              <div className="flex justify-between">
                <span>منتجات نفدت من المخزون</span>
                <Badge variant="destructive">{data.inventory.outOfStockItems}</Badge>
              </div>
              <div className="flex justify-between">
                <span>معدل دوران المخزون</span>
                <span className="font-semibold">{data.inventory.turnoverRate.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مؤشرات المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>إجمالي الفواتير</span>
                <span className="font-semibold">{data.sales.totalInvoices}</span>
              </div>
              <div className="flex justify-between">
                <span>متوسط قيمة الطلب</span>
                <span className="font-semibold">{formatCurrency(data.sales.averageOrderValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>إجمالي المشتريات</span>
                <span className="font-semibold">{data.purchases.totalOrders}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPerformanceReport = (data: PerformanceAnalysis) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>تحليل التكاليف</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">التكاليف المباشرة</p>
              <p className="text-lg font-semibold">{formatCurrency(data.costAnalysis.directCosts)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">التكاليف غير المباشرة</p>
              <p className="text-lg font-semibold">{formatCurrency(data.costAnalysis.indirectCosts)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">التكاليف المتغيرة</p>
              <p className="text-lg font-semibold">{formatCurrency(data.costAnalysis.variableCosts)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">التكاليف الثابتة</p>
              <p className="text-lg font-semibold">{formatCurrency(data.costAnalysis.fixedCosts)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>مؤشرات الكفاءة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">دوران المخزون</p>
              <p className="text-lg font-semibold">{data.efficiency.inventoryTurnover.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">دوران المستحقات</p>
              <p className="text-lg font-semibold">{data.efficiency.receivablesTurnover.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">دوران المدفوعات</p>
              <p className="text-lg font-semibold">{data.efficiency.payablesTurnover.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">استخدام الأصول</p>
              <p className="text-lg font-semibold">{data.efficiency.assetUtilization.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.profitabilityByProduct && data.profitabilityByProduct.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الربحية حسب المنتج (أفضل 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.profitabilityByProduct.slice(0, 5).map((product, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="font-medium">{product.product}</span>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(product.profit)}</p>
                    <p className="text-sm text-muted-foreground">{product.margin.toFixed(2)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderComprehensiveReport = (data: any) => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(data.summary.totalRevenue)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">صافي الربح</p>
                <p className={`text-xl font-bold ${data.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.summary.totalProfit)}
                </p>
              </div>
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عدد المنتجات</p>
                <p className="text-xl font-bold">{data.summary.productCount}</p>
              </div>
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عدد الموظفين</p>
                <p className="text-xl font-bold">{data.summary.employeeCount}</p>
              </div>
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financial">المالي</TabsTrigger>
          <TabsTrigger value="operational">التشغيلي</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          {renderFinancialReport(data.financial)}
        </TabsContent>

        <TabsContent value="operational">
          {renderOperationalReport(data.operational)}
        </TabsContent>

        <TabsContent value="performance">
          {renderPerformanceReport(data.performance)}
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← العودة
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{report.title}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <Badge className={getReportTypeColor(report.type)}>
                {getReportTypeLabel(report.type)}
              </Badge>
              <span>
                الفترة: {formatDate(report.period.start)} - {formatDate(report.period.end)}
              </span>
              <span>
                تم الإنشاء: {formatDate(report.generatedAt)}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          تصدير
        </Button>
      </div>

      <Separator />

      {/* Report Content */}
      {report.type === 'financial' && renderFinancialReport(report.data)}
      {report.type === 'operational' && renderOperationalReport(report.data)}
      {report.type === 'performance' && renderPerformanceReport(report.data)}
      {report.type === 'comprehensive' && renderComprehensiveReport(report.data)}
    </div>
  );
}

function getReportTypeColor(type: string) {
  const colors = {
    financial: 'bg-green-100 text-green-800',
    operational: 'bg-blue-100 text-blue-800',
    performance: 'bg-purple-100 text-purple-800',
    comprehensive: 'bg-orange-100 text-orange-800'
  };
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}

function getReportTypeLabel(type: string) {
  const labels = {
    financial: 'مالي',
    operational: 'تشغيلي',
    performance: 'أداء',
    comprehensive: 'شامل'
  };
  return labels[type as keyof typeof labels] || type;
}