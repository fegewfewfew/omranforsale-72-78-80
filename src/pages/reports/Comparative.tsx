import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, BarChart3, Download, Calendar, Target, DollarSign, Package, AlertTriangle, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart, PieChart, Pie, Cell } from "recharts";
import { reportDataGenerator } from "@/utils/reportDataGenerator";
import { unifiedReportsManager } from "@/utils/unifiedReportsManager";

export default function ComparativeReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [salesData, setSalesData] = useState<any>({});
  const [purchaseData, setPurchaseData] = useState<any>({});
  const [profitData, setProfitData] = useState<any>({});
  const [inventoryData, setInventoryData] = useState<any>({});
  const [comparativeData, setComparativeData] = useState<any[]>([]);
  const [unifiedReport, setUnifiedReport] = useState<any>(null);
  const [integrationInsights, setIntegrationInsights] = useState<any>(null);

  useEffect(() => {
    // تحميل جميع البيانات من المصادر المختلفة
    const sales = reportDataGenerator.getSalesReportData();
    const purchases = reportDataGenerator.getPurchaseReportData();
    const profit = {
      totalRevenue: sales.totalSales || 0,
      totalCosts: purchases.totalPurchases || 0,
      totalProfit: (sales.totalSales || 0) - (purchases.totalPurchases || 0),
      profitMargin: sales.totalSales > 0 ? (((sales.totalSales - purchases.totalPurchases) / sales.totalSales) * 100) : 0,
      monthlyProfit: (sales.monthlySales || []).map((saleMonth: any) => {
        const purchaseMonth = (purchases.monthlyPurchases || []).find((p: any) => p.month === saleMonth.month);
        return {
          month: saleMonth.month,
          revenue: saleMonth.revenue || 0,
          costs: purchaseMonth?.purchases || 0,
          profit: (saleMonth.revenue || 0) - (purchaseMonth?.purchases || 0)
        };
      })
    };
    const inventory = reportDataGenerator.getInventoryReportData();
    
    // تحميل البيانات الموحدة
    const unified = unifiedReportsManager.getSystemIntegrationReport(
      getStartDate(selectedPeriod),
      getCurrentDate()
    );
    const insights = unifiedReportsManager.getIntegratedPerformanceReport();
    
    setSalesData(sales);
    setPurchaseData(purchases);
    setProfitData(profit);
    setInventoryData(inventory);
    setUnifiedReport(unified);
    setIntegrationInsights(insights);
    
    // إنشاء بيانات المقارنة المتكاملة
    const comparative = generateIntegratedComparativeData(sales, purchases, profit, inventory);
    setComparativeData(comparative);
  }, [selectedPeriod]);

  const generateIntegratedComparativeData = (sales: any, purchases: any, profit: any, inventory: any) => {
    const salesMonthly = sales.monthlySales || [];
    const purchasesMonthly = purchases.monthlyPurchases || [];
    const profitMonthly = profit.monthlyProfit || [];
    
    // دمج البيانات الشهرية من جميع المصادر
    const monthlyComparison = salesMonthly.map((saleMonth: any) => {
      const purchaseMonth = purchasesMonthly.find((p: any) => p.month === saleMonth.month);
      const profitMonth = profitMonthly.find((pr: any) => pr.month === saleMonth.month);
      
      const revenue = saleMonth.revenue || 0;
      const cost = purchaseMonth?.purchases || 0;
      const calculatedProfit = profitMonth?.profit || (revenue - cost);
      const profitMargin = revenue > 0 ? ((calculatedProfit / revenue) * 100).toFixed(1) : 0;
      
      return {
        month: saleMonth.month,
        sales: revenue,
        purchases: cost,
        profit: calculatedProfit,
        profitMargin,
        salesOrders: saleMonth.orders || 0,
        purchaseOrders: purchaseMonth?.orders || 0,
        efficiency: revenue > 0 ? ((calculatedProfit / revenue) * 100).toFixed(1) : 0
      };
    });
    
    return monthlyComparison;
  };

  // دوال مساعدة للتواريخ
  const getStartDate = (period: string): string => {
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '12months':
        startDate.setMonth(now.getMonth() - 12);
        break;
      case 'current-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'last-year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
    }
    
    return startDate.toISOString().split('T')[0];
  };

  const getCurrentDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  const exportReport = () => {
    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بفتح النوافذ المنبثقة لتصدير التقرير');
      return;
    }

    // حساب الإحصائيات
    const profitableMonths = comparativeData.filter(item => item.profit > 0).length;
    const lossMonths = comparativeData.filter(item => item.profit < 0).length;
    const bestMonth = comparativeData.reduce((max, month) => month.profit > max.profit ? month : max, comparativeData[0] || { month: 'غير محدد', profit: 0 });
    const averageMonthlyProfit = comparativeData.length > 0 ? totalProfit / comparativeData.length : 0;
    
    const periodLabels = {
      '6months': 'آخر 6 أشهر',
      '12months': 'آخر 12 شهر',
      'current-year': 'العام الحالي',
      'last-year': 'العام الماضي'
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>التقرير المقارن الشامل</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body { 
            font-family: 'Cairo', Arial, sans-serif; 
            direction: rtl; 
            margin: 20px;
            color: #333;
          }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 16px; color: #666; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          .section { margin: 30px 0; }
          .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            border-bottom: 2px solid #333; 
            padding-bottom: 5px; 
            margin-bottom: 15px; 
          }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
          .stat-item { display: flex; justify-content: space-between; padding: 5px 0; }
          .stat-label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
          .highlight { background-color: #e8f5e8; }
          .loss { background-color: #ffeaea; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">التقرير المقارن الشامل</h1>
          <div class="subtitle">مقارنة شاملة للمبيعات والمشتريات والأرباح</div>
          <div class="info">
            <div>تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</div>
            <div>الفترة: ${periodLabels[selectedPeriod as keyof typeof periodLabels] || selectedPeriod}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">الملخص التنفيذي</h2>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">إجمالي المبيعات:</span>
              <span>${totalSales.toLocaleString()} ج.م</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">إجمالي المشتريات:</span>
              <span>${totalPurchases.toLocaleString()} ج.م</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">صافي الربح:</span>
              <span>${totalProfit.toLocaleString()} ج.م</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">هامش الربح:</span>
              <span>${profitMargin}%</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">مؤشرات الأداء الرئيسية</h2>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">نمو المبيعات:</span>
              <span>+${salesGrowth}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">نمو المشتريات:</span>
              <span>+${purchaseGrowth}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">كفاءة الربحية:</span>
              <span>${totalProfit >= 0 ? 'إيجابية' : 'سلبية'}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">متوسط الربح الشهري:</span>
              <span>${averageMonthlyProfit.toLocaleString()} ج.م</span>
            </div>
          </div>
        </div>

        ${comparativeData.length > 0 ? `
        <div class="section">
          <h2 class="section-title">المقارنة الشهرية التفصيلية</h2>
          <table>
            <thead>
              <tr>
                <th>الشهر</th>
                <th>المبيعات (ج.م)</th>
                <th>المشتريات (ج.م)</th>
                <th>الربح (ج.م)</th>
                <th>هامش الربح (%)</th>
              </tr>
            </thead>
            <tbody>
              ${comparativeData.map(item => `
                <tr class="${item.profit >= 0 ? 'highlight' : 'loss'}">
                  <td>${item.month}</td>
                  <td>${item.sales.toLocaleString()}</td>
                  <td>${item.purchases.toLocaleString()}</td>
                  <td>${item.profit.toLocaleString()}</td>
                  <td>${item.profitMargin}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="section">
          <h2 class="section-title">تحليل الربحية</h2>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">عدد الأشهر المربحة:</span>
              <span>${profitableMonths} شهر</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">عدد أشهر الخسارة:</span>
              <span>${lossMonths} شهر</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">معدل النجاح:</span>
              <span>${comparativeData.length > 0 ? ((profitableMonths / comparativeData.length) * 100).toFixed(1) : 0}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">أفضل شهر:</span>
              <span>${bestMonth.month} (${bestMonth.profit.toLocaleString()} ج.م)</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">التوصيات الاستراتيجية</h2>
          <ul style="list-style-type: disc; padding-right: 20px;">
            ${Number(profitMargin) < 20 ? '<li>ينصح بمراجعة استراتيجية التسعير لتحسين هامش الربح</li>' : ''}
            ${totalProfit < 0 ? '<li>يجب اتخاذ إجراءات فورية لخفض التكاليف وزيادة المبيعات</li>' : ''}
            ${salesGrowth < 5 ? '<li>ينصح بتطوير استراتيجيات تسويقية جديدة لزيادة النمو</li>' : ''}
            ${Number(profitMargin) >= 20 && totalProfit >= 0 && salesGrowth >= 5 ? '<li>الأداء المالي ممتاز، يُنصح بالحفاظ على الاستراتيجية الحالية والتوسع</li>' : ''}
            <li>مراقبة الاتجاهات الشهرية واتخاذ قرارات سريعة للتحسين</li>
            <li>تحليل الأشهر المربحة وتطبيق نفس الاستراتيجيات</li>
          </ul>
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المبيعات</p>
          <p>تاريخ الإنشاء: ${new Date().toLocaleString('en-GB')}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    console.log("تم تصدير التقرير المقارن كـ PDF بنجاح");
  };

  const generateCSVReport = (data: any) => {
    let csv = '';
    
    csv += 'التقرير المقارن - المبيعات والمشتريات\n';
    csv += `تاريخ التصدير,${new Date().toLocaleDateString('en-GB')}\n`;
    csv += `الفترة,${getPeriodLabel(data.period)}\n\n`;
    
    // ملخص البيانات
    csv += 'ملخص الأداء\n';
    csv += `إجمالي المبيعات,${data.sales.totalSales || 0} ج.م\n`;
    csv += `إجمالي المشتريات,${data.purchases.totalPurchases || 0} ج.م\n`;
    csv += `صافي الربح,${(data.sales.totalSales || 0) - (data.purchases.totalPurchases || 0)} ج.م\n\n`;
    
    // البيانات الشهرية
    csv += 'البيانات الشهرية\n';
    csv += 'الشهر,المبيعات,المشتريات,الربح,هامش الربح\n';
    data.comparative.forEach((row: any) => {
      csv += `${row.month},${row.sales} ج.م,${row.purchases} ج.م,${row.profit} ج.م,${row.profitMargin}%\n`;
    });
    
    return csv;
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getPeriodLabel = (period: string) => {
    switch(period) {
      case '6months': return 'آخر 6 أشهر';
      case '12months': return 'آخر 12 شهر';
      case 'current-year': return 'العام الحالي';
      case 'last-year': return 'العام الماضي';
      default: return period;
    }
  };

  // حساب الإحصائيات المقارنة
  const totalSales = salesData.totalSales || 0;
  const totalPurchases = purchaseData.totalPurchases || 0;
  const totalProfit = totalSales - totalPurchases;
  const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0;
  const salesGrowth = 8.5; // نمو وهمي
  const purchaseGrowth = 5.2; // نمو وهمي

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">التقارير المقارنة</h1>
        <div className="flex gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">آخر 6 أشهر</SelectItem>
              <SelectItem value="12months">آخر 12 شهر</SelectItem>
              <SelectItem value="current-year">العام الحالي</SelectItem>
              <SelectItem value="last-year">العام الماضي</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalSales.toLocaleString()} ج.م</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{salesGrowth}% من الشهر الماضي</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشتريات</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalPurchases.toLocaleString()} ج.م</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{purchaseGrowth}% من الشهر الماضي</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfit.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              {totalProfit >= 0 ? 'ربح' : 'خسارة'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">هامش الربح</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${Number(profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin}%
            </div>
            <p className="text-xs text-muted-foreground">من إجمالي المبيعات</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="monthly">مقارنة شهرية</TabsTrigger>
          <TabsTrigger value="trends">اتجاهات الأداء</TabsTrigger>
          <TabsTrigger value="analysis">تحليل الربحية</TabsTrigger>
          <TabsTrigger value="inventory">تكامل المخزون</TabsTrigger>
          <TabsTrigger value="insights">رؤى متقدمة</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مقارنة المبيعات والمشتريات الشهرية</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={comparativeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} ج.م`]} />
                  <Bar dataKey="sales" fill="#10b981" name="المبيعات" />
                  <Bar dataKey="purchases" fill="#ef4444" name="المشتريات" />
                  <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="الربح" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>اتجاه المبيعات</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={comparativeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} ج.م`, 'المبيعات']} />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>اتجاه المشتريات</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={comparativeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} ج.م`, 'المشتريات']} />
                    <Area 
                      type="monotone" 
                      dataKey="purchases" 
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحليل الربحية الشهرية</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={comparativeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'profitMargin' ? `${value}%` : `${Number(value).toLocaleString()} ج.م`,
                      name === 'profitMargin' ? 'هامش الربح' : 'صافي الربح'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="profit"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profitMargin" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="profitMargin"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* جدول التفاصيل الشهرية */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الأداء الشهري</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">الشهر</th>
                      <th className="text-right p-2">المبيعات</th>
                      <th className="text-right p-2">المشتريات</th>
                      <th className="text-right p-2">صافي الربح</th>
                      <th className="text-right p-2">هامش الربح</th>
                      <th className="text-right p-2">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparativeData.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{row.month}</td>
                        <td className="p-2 text-green-600">{row.sales.toLocaleString()} ج.م</td>
                        <td className="p-2 text-red-600">{row.purchases.toLocaleString()} ج.م</td>
                        <td className={`p-2 font-bold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {row.profit.toLocaleString()} ج.م
                        </td>
                        <td className={`p-2 ${Number(row.profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {row.profitMargin}%
                        </td>
                        <td className="p-2">
                          <Badge variant={row.profit >= 0 ? "default" : "destructive"}>
                            {row.profit >= 0 ? "ربح" : "خسارة"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* تأثير المبيعات على المخزون */}
            <Card>
              <CardHeader>
                <CardTitle>تأثير المبيعات على المخزون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{inventoryData?.totalProducts || 0}</p>
                      <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{inventoryData?.lowStockItems || 0}</p>
                      <p className="text-sm text-muted-foreground">مخزون منخفض</p>
                    </div>
                  </div>
                  
                  {inventoryData?.categoryData && inventoryData.categoryData.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={inventoryData.categoryData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="total"
                          label={({ category, total }) => `${category}: ${total}`}
                        >
                          {inventoryData.categoryData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 137.5}, 70%, 50%)`} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* معدل دوران المخزون */}
            <Card>
              <CardHeader>
                <CardTitle>كفاءة إدارة المخزون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>قيمة المخزون:</span>
                    <span className="font-bold">{(inventoryData?.totalValue || 0).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>نسبة المخزون المنخفض:</span>
                    <span className="font-bold text-amber-600">
                      {inventoryData?.totalProducts > 0 ? 
                        ((inventoryData.lowStockItems / inventoryData.totalProducts) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>معدل التجديد المطلوب:</span>
                    <Badge variant={inventoryData?.lowStockItems > 5 ? "destructive" : "default"}>
                      {inventoryData?.lowStockItems > 5 ? "عاجل" : "طبيعي"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* جدول ربط المبيعات بالمخزون */}
          <Card>
            <CardHeader>
              <CardTitle>تحليل ربط المبيعات بالمخزون</CardTitle>
            </CardHeader>
            <CardContent>
              {unifiedReport?.integration && (
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold">{unifiedReport.integration.salesInventoryLinkRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">معدل ربط المبيعات بالمخزون</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold">{unifiedReport.integration.purchaseInventoryLinkRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">معدل ربط المشتريات بالمخزون</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold">{unifiedReport.integration.movementLinkRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">معدل ربط حركة المخزون</p>
                  </div>
                </div>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المؤشر</TableHead>
                    <TableHead>المبيعات</TableHead>
                    <TableHead>المشتريات</TableHead>
                    <TableHead>المخزون</TableHead>
                    <TableHead>درجة التكامل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>العمليات المربوطة</TableCell>
                    <TableCell>{unifiedReport?.integration?.salesLinkedToInventory || 0}</TableCell>
                    <TableCell>{unifiedReport?.integration?.purchasesLinkedToInventory || 0}</TableCell>
                    <TableCell>{unifiedReport?.integration?.linkedMovements || 0}</TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {unifiedReport?.integration?.movementLinkRate > 80 ? "ممتاز" : 
                         unifiedReport?.integration?.movementLinkRate > 60 ? "جيد" : "يحتاج تحسين"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* مؤشرات الأداء المتقدمة */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">كفاءة التحويل</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {comparativeData.length > 0 ? 
                    (comparativeData.filter(item => item.profit > 0).length / comparativeData.length * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">نسبة الأشهر المربحة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">استقرار الأداء</CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {comparativeData.length > 0 ? 
                    (comparativeData.reduce((sum, item) => sum + Math.abs(Number(item.profitMargin)), 0) / comparativeData.length).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">متوسط هامش الربح</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">توازن التكاليف</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalSales > 0 ? ((totalPurchases / totalSales) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">نسبة التكاليف للإيرادات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مخاطر المخزون</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {inventoryData?.lowStockItems + inventoryData?.outOfStockItems || 0}
                </div>
                <p className="text-xs text-muted-foreground">منتجات تحتاج انتباه</p>
              </CardContent>
            </Card>
          </div>

          {/* الرؤى التحليلية */}
          <Card>
            <CardHeader>
              <CardTitle>الرؤى التحليلية المتقدمة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-3">نقاط القوة</h4>
                  <ul className="space-y-2">
                    {Number(profitMargin) > 20 && (
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>هامش ربح جيد يتجاوز 20%</span>
                      </li>
                    )}
                    {salesGrowth > 10 && (
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>نمو قوي في المبيعات</span>
                      </li>
                    )}
                    {(inventoryData?.lowStockItems || 0) < 5 && (
                      <li className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-500" />
                        <span>إدارة جيدة للمخزون</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">فرص التحسين</h4>
                  <ul className="space-y-2">
                    {Number(profitMargin) < 15 && (
                      <li className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-amber-500" />
                        <span>تحسين هامش الربح المنخفض</span>
                      </li>
                    )}
                    {(inventoryData?.lowStockItems || 0) > 10 && (
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span>تحسين إدارة المخزون</span>
                      </li>
                    )}
                    {purchaseGrowth > salesGrowth && (
                      <li className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                        <span>ضبط معدل نمو التكاليف</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* توصيات استراتيجية */}
          <Card>
            <CardHeader>
              <CardTitle>التوصيات الاستراتيجية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrationInsights?.customers && (
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-semibold mb-2">إدارة العملاء</h5>
                    <p>لديك {integrationInsights.customers.totalCustomers} عميل، مع {integrationInsights.customers.riskCustomers.length} عميل في وضع خطر.</p>
                  </div>
                )}
                
                {integrationInsights?.suppliers && (
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-semibold mb-2">إدارة الموردين</h5>
                    <p>تعمل مع {integrationInsights.suppliers.totalSuppliers} مورد، مع تركيز على أفضل {integrationInsights.suppliers.topPerformers.length} موردين.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}