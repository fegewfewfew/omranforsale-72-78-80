import { useState, useEffect } from "react";
import { Calendar, DollarSign, TrendingUp, TrendingDown, BarChart3, Download, FileText, Filter, Target, AlertTriangle, Zap, Calculator, PieChart as PieChartIcon, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { businessIntegration } from "@/utils/businessIntegration";
import { inventoryManager } from "@/utils/inventoryUtils";

interface ProfitData {
  month: string;
  revenue: number;
  costs: number;
  profit: number;
}

interface CategoryProfit {
  name: string;
  value: number;
  color: string;
}

interface TopProduct {
  name: string;
  profit: number;
  sales: number;
  margin: string;
  revenue: number;
  cost: number;
}

export default function ProfitReport() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [monthlyData, setMonthlyData] = useState<ProfitData[]>([]);
  const [profitByCategory, setProfitByCategory] = useState<CategoryProfit[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Load and process data
  useEffect(() => {
    loadProfitData();
  }, [selectedPeriod, selectedCategory]);

  const loadProfitData = () => {
    try {
      console.log('بدء تحميل بيانات الأرباح...');
      
      // Get business analytics - تحقق من وجود البيانات
      let businessAnalytics = null;
      try {
        // تحقق من توفر جميع المكونات المطلوبة
        if (typeof businessIntegration?.getBusinessAnalytics === 'function') {
          businessAnalytics = businessIntegration.getBusinessAnalytics();
          console.log('تم تحميل تحليلات الأعمال:', businessAnalytics);
        } else {
          console.warn('businessIntegration.getBusinessAnalytics غير متوفر');
        }
      } catch (error) {
        console.warn('تعذر تحميل تحليلات الأعمال، سيتم استخدام بيانات افتراضية:', error);
        businessAnalytics = {
          totalProducts: 0,
          salesRevenue: 0,
          purchaseCosts: 0,
          grossProfit: 0,
          grossProfitMargin: 0
        };
      }
      setAnalytics(businessAnalytics);

      // Get sales and purchase data with fallback
      let salesInvoices = [];
      let purchaseInvoices = [];
      let products = [];

      try {
        salesInvoices = JSON.parse(localStorage.getItem('sales_invoices') || '[]');
        console.log('تم تحميل فواتير المبيعات:', salesInvoices.length);
      } catch (error) {
        console.warn('خطأ في تحميل فواتير المبيعات:', error);
        salesInvoices = [];
      }

      try {
        purchaseInvoices = JSON.parse(localStorage.getItem('purchase_invoices') || '[]');
        console.log('تم تحميل فواتير المشتريات:', purchaseInvoices.length);
      } catch (error) {
        console.warn('خطأ في تحميل فواتير المشتريات:', error);
        purchaseInvoices = [];
      }

      try {
        products = inventoryManager.getProducts();
        console.log('تم تحميل المنتجات:', products.length);
      } catch (error) {
        console.warn('خطأ في تحميل المنتجات:', error);
        products = [];
      }

      // Process monthly data
      console.log('معالجة البيانات الشهرية...');
      const monthlyProfitData = generateMonthlyData(salesInvoices, purchaseInvoices, selectedPeriod);
      setMonthlyData(monthlyProfitData);
      console.log('تم إنشاء البيانات الشهرية:', monthlyProfitData);

      // Process category profits
      console.log('معالجة أرباح الفئات...');
      const categoryProfitData = generateCategoryData(salesInvoices, products);
      setProfitByCategory(categoryProfitData);
      console.log('تم إنشاء بيانات الفئات:', categoryProfitData);

      // Process top products
      console.log('معالجة أفضل المنتجات...');
      const topProductsData = generateTopProductsData(salesInvoices, products);
      setTopProducts(topProductsData);
      console.log('تم إنشاء بيانات أفضل المنتجات:', topProductsData);

      console.log('تم تحميل جميع البيانات بنجاح');

    } catch (error) {
      console.error('خطأ في تحميل بيانات الأرباح:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: `حدث خطأ أثناء تحميل بيانات الأرباح: ${error.message}`,
        variant: "destructive",
      });
      
      // تعيين بيانات افتراضية في حالة الخطأ
      setMonthlyData([]);
      setProfitByCategory([]);
      setTopProducts([]);
      setAnalytics(null);
    }
  };

  const generateMonthlyData = (salesInvoices: any[], purchaseInvoices: any[], period: string): ProfitData[] => {
    const months = getMonthsForPeriod(period);
    const monthlyStats: { [key: string]: { revenue: number; costs: number } } = {};

    // Initialize months
    months.forEach(month => {
      monthlyStats[month] = { revenue: 0, costs: 0 };
    });

    // Process sales (revenue) - تحقق من أن البيانات array
    if (Array.isArray(salesInvoices)) {
      salesInvoices.forEach(invoice => {
        if (invoice && invoice.paymentStatus === 'paid' && invoice.date) {
          const invoiceMonth = getMonthKey(invoice.date);
          if (monthlyStats[invoiceMonth]) {
            monthlyStats[invoiceMonth].revenue += invoice.total || 0;
          }
        }
      });
    }

    // Process purchases (costs) - تحقق من أن البيانات array
    if (Array.isArray(purchaseInvoices)) {
      purchaseInvoices.forEach(purchase => {
        if (purchase && purchase.status === 'paid' && purchase.date) {
          const purchaseMonth = getMonthKey(purchase.date);
          if (monthlyStats[purchaseMonth]) {
            monthlyStats[purchaseMonth].costs += purchase.total || 0;
          }
        }
      });
    }

    return months.map(month => ({
      month: getMonthDisplayName(month),
      revenue: monthlyStats[month].revenue,
      costs: monthlyStats[month].costs,
      profit: monthlyStats[month].revenue - monthlyStats[month].costs
    }));
  };

  const generateCategoryData = (salesInvoices: any[], products: any[]): CategoryProfit[] => {
    const categoryProfit: { [key: string]: number } = {};
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    // تحقق من أن البيانات arrays
    if (!Array.isArray(salesInvoices) || !Array.isArray(products)) {
      return [];
    }

    salesInvoices.forEach(invoice => {
      if (invoice && invoice.paymentStatus === 'paid' && Array.isArray(invoice.itemsDetails)) {
        invoice.itemsDetails.forEach((item: any) => {
          if (item && item.productName) {
            const product = products.find(p => p && p.name === item.productName);
            const category = product?.category || 'غير محدد';
            const profit = ((item.price || 0) - (item.cost || 0)) * (item.quantity || 0);
            
            categoryProfit[category] = (categoryProfit[category] || 0) + profit;
          }
        });
      }
    });

    return Object.entries(categoryProfit)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  const generateTopProductsData = (salesInvoices: any[], products: any[]): TopProduct[] => {
    // تحقق من أن البيانات arrays
    if (!Array.isArray(salesInvoices)) {
      return [];
    }

    const productStats: { [key: string]: { revenue: number; cost: number; quantity: number } } = {};

    salesInvoices.forEach(invoice => {
      if (invoice && invoice.paymentStatus === 'paid' && Array.isArray(invoice.itemsDetails)) {
        invoice.itemsDetails.forEach((item: any) => {
          if (item && item.productName) {
            const productName = item.productName;
            if (!productStats[productName]) {
              productStats[productName] = { revenue: 0, cost: 0, quantity: 0 };
            }
            
            productStats[productName].revenue += item.total || 0;
            productStats[productName].cost += (item.cost || 0) * (item.quantity || 0);
            productStats[productName].quantity += item.quantity || 0;
          }
        });
      }
    });

    return Object.entries(productStats)
      .map(([name, stats]) => ({
        name,
        profit: stats.revenue - stats.cost,
        sales: stats.quantity,
        margin: stats.revenue > 0 ? ((stats.revenue - stats.cost) / stats.revenue * 100).toFixed(1) + '%' : '0%',
        revenue: stats.revenue,
        cost: stats.cost
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);
  };

  const getMonthsForPeriod = (period: string): string[] => {
    const now = new Date();
    const months: string[] = [];
    
    let monthsCount = 6;
    if (period === '12months') monthsCount = 12;
    else if (period === 'current-year') monthsCount = now.getMonth() + 1;
    else if (period === 'last-year') monthsCount = 12;

    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      if (period === 'last-year') {
        date.setFullYear(now.getFullYear() - 1);
      }
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }

    return months;
  };

  const getMonthKey = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthDisplayName = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  const totalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
  const totalCosts = monthlyData.reduce((sum, item) => sum + item.costs, 0);
  const totalProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  const exportToPDF = () => {
    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بفتح النوافذ المنبثقة لتصدير التقرير');
      return;
    }

    // حساب الإحصائيات
    const averageMonthlyProfit = monthlyData.length > 0 ? totalProfit / monthlyData.length : 0;
    const bestMonth = monthlyData.reduce((max, month) => month.profit > max.profit ? month : max, monthlyData[0] || { month: 'غير محدد', profit: 0 });
    const profitGrowth = monthlyData.length > 1 ? 
      ((monthlyData[monthlyData.length - 1].profit - monthlyData[0].profit) / Math.abs(monthlyData[0].profit || 1) * 100).toFixed(1) : '0';

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الأرباح</title>
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
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">تقرير الأرباح المتقدم</h1>
          <div class="subtitle">تحليل شامل لأداء الأرباح والربحية</div>
          <div class="info">
            <div>تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</div>
            <div>الفترة: آخر ${monthlyData.length} أشهر</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">الملخص التنفيذي</h2>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">إجمالي الإيرادات:</span>
              <span>${totalRevenue.toLocaleString()} ج.م</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">إجمالي التكاليف:</span>
              <span>${totalCosts.toLocaleString()} ج.م</span>
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

        ${monthlyData.length > 0 ? `
        <div class="section">
          <h2 class="section-title">البيانات الشهرية</h2>
          <table>
            <thead>
              <tr>
                <th>الشهر</th>
                <th>الإيرادات (ج.م)</th>
                <th>التكاليف (ج.م)</th>
                <th>الربح (ج.م)</th>
                <th>هامش الربح (%)</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyData.map(item => `
                <tr>
                  <td>${item.month}</td>
                  <td>${item.revenue.toLocaleString()}</td>
                  <td>${item.costs.toLocaleString()}</td>
                  <td>${item.profit.toLocaleString()}</td>
                  <td>${item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${topProducts.length > 0 ? `
        <div class="section">
          <h2 class="section-title">أفضل المنتجات ربحية</h2>
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الربح (ج.م)</th>
                <th>المبيعات</th>
                <th>هامش الربح</th>
              </tr>
            </thead>
            <tbody>
              ${topProducts.slice(0, 10).map(product => `
                <tr>
                  <td>${product.name}</td>
                  <td>${product.profit.toLocaleString()}</td>
                  <td>${product.sales}</td>
                  <td>${product.margin}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="section">
          <h2 class="section-title">تحليل الأداء</h2>
          <ul style="list-style-type: disc; padding-right: 20px;">
            <li>متوسط الربح الشهري: ${averageMonthlyProfit.toLocaleString()} ج.م</li>
            <li>أفضل شهر: ${bestMonth.month} بربح ${bestMonth.profit.toLocaleString()} ج.م</li>
            <li>نمو الربح: ${profitGrowth}%</li>
            <li>${profitMargin > '20' ? 'هامش ربح ممتاز، استمر في نفس الاستراتيجية' : 'ينصح بمراجعة استراتيجية التسعير'}</li>
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
            }
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    toast({
      title: "جاري التصدير",
      description: "سيتم فتح نافذة الطباعة لحفظ التقرير كـ PDF",
    });
  };

  const exportToExcel = async () => {
    try {
      const { ArabicExcelExporter } = await import('@/utils/arabicExcelExporter');
      const exporter = new ArabicExcelExporter();

      // إنشاء ورقة التقرير الرئيسية
      exporter.addWorksheet('تقرير الأرباح');
      
      let currentRow = 0;
      
      // إضافة العنوان
      currentRow = exporter.addTitle('تقرير الأرباح', 'تقرير الأرباح المتقدم - تحليل شامل لأداء الأرباح والربحية', currentRow);
      
      const periodLabels = {
        '6months': 'آخر 6 أشهر',
        '12months': 'آخر 12 شهر',
        'current-year': 'العام الحالي',
        'last-year': 'العام الماضي'
      };
      
      // إضافة معلومات التقرير
      currentRow = exporter.addReportInfo(
        'تقرير الأرباح',
        new Date().toLocaleDateString('ar-SA'),
        periodLabels[selectedPeriod as keyof typeof periodLabels] || selectedPeriod,
        currentRow
      );

       // حساب الإحصائيات المطلوبة للتصدير
       const excelAverageMonthlyProfit = monthlyData.length > 0 ? totalProfit / monthlyData.length : 0;
       const excelProfitGrowth = monthlyData.length > 1 ? 
         ((monthlyData[monthlyData.length - 1].profit - monthlyData[0].profit) / Math.abs(monthlyData[0].profit || 1) * 100).toFixed(1) : '0';

       // إضافة الملخص التنفيذي
       currentRow = exporter.addSummaryStats('تقرير الأرباح', {
         'إجمالي الإيرادات (ج.م)': totalRevenue,
         'إجمالي التكاليف (ج.م)': totalCosts,
         'صافي الربح (ج.م)': totalProfit,
         'هامش الربح (%)': `${profitMargin}%`,
         'متوسط الربح الشهري (ج.م)': Math.round(excelAverageMonthlyProfit),
         'نمو الربح (%)': `${excelProfitGrowth}%`
       }, currentRow);

      // إضافة البيانات الشهرية
      if (monthlyData.length > 0) {
        currentRow = exporter.addSection('تقرير الأرباح', 'البيانات الشهرية', currentRow);
        const tableHeaders = ['الشهر', 'الإيرادات (ج.م)', 'التكاليف (ج.م)', 'الربح (ج.م)', 'هامش الربح (%)'];
        const tableRows = monthlyData.map(item => [
          item.month,
          item.revenue,
          item.costs,
          item.profit,
          item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) + '%' : '0%'
        ]);
        currentRow = exporter.addTable('تقرير الأرباح', tableHeaders, tableRows, currentRow);
      }

      // إضافة أفضل المنتجات
      if (topProducts.length > 0) {
        currentRow = exporter.addSection('تقرير الأرباح', 'أفضل المنتجات ربحية', currentRow);
        const productHeaders = ['المنتج', 'الربح (ج.م)', 'المبيعات', 'الإيرادات (ج.م)', 'هامش الربح'];
        const productRows = topProducts.slice(0, 15).map(product => [
          product.name,
          product.profit,
          product.sales,
          product.revenue,
          product.margin
        ]);
        currentRow = exporter.addTable('تقرير الأرباح', productHeaders, productRows, currentRow);
      }

      // إضافة أرباح الفئات
      if (profitByCategory.length > 0) {
        currentRow = exporter.addSection('تقرير الأرباح', 'الأرباح حسب الفئة', currentRow);
        const categoryHeaders = ['الفئة', 'الربح (ج.م)', 'النسبة المئوية'];
        const totalCategoryProfit = profitByCategory.reduce((sum, cat) => sum + cat.value, 0);
        const categoryRows = profitByCategory.map(category => [
          category.name,
          category.value,
          totalCategoryProfit > 0 ? `${((category.value / totalCategoryProfit) * 100).toFixed(1)}%` : '0%'
        ]);
        currentRow = exporter.addTable('تقرير الأرباح', categoryHeaders, categoryRows, currentRow);
      }

      // إضافة التوصيات
      const excelBestMonth = monthlyData.reduce((max, month) => month.profit > max.profit ? month : max, monthlyData[0] || { month: 'غير محدد', profit: 0 });
      const excelProfitGoalProgress = Math.min((totalProfit / 100000) * 100, 100);
      
      const recommendations = [
        `متوسط الربح الشهري: ${excelAverageMonthlyProfit.toLocaleString()} ج.م`,
        `أفضل شهر: ${excelBestMonth.month} بربح ${excelBestMonth.profit.toLocaleString()} ج.م`,
        `نمو الربح: ${excelProfitGrowth}% مقارنة بالفترة السابقة`,
        `تقدم تحقيق الهدف: ${excelProfitGoalProgress.toFixed(1)}%`,
        profitMargin > '20' ? 'هامش ربح ممتاز، استمر في نفس الاستراتيجية' : 'ينصح بمراجعة استراتيجية التسعير لتحسين الربحية',
        excelBestMonth.profit > excelAverageMonthlyProfit * 1.5 ? `شهر ${excelBestMonth.month} حقق أداءً استثنائياً، ادرس العوامل المؤثرة` : 'الأداء مستقر عبر الأشهر'
      ];
      
      exporter.addRecommendations('تقرير الأرباح', recommendations, currentRow);

      // حفظ الملف
      exporter.save(`تقرير_الأرباح_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "تم التصدير",
        description: "تم تصدير تقرير الأرباح كـ Excel بنجاح",
      });
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير ملف Excel",
        variant: "destructive",
      });
    }
  };

  // حساب مؤشرات الأداء الإضافية مع حماية من القيم الفارغة
  const averageMonthlyProfit = monthlyData.length > 0 ? totalProfit / monthlyData.length : 0;
  const bestMonth = monthlyData.length > 0 ? 
    monthlyData.reduce((max, month) => month.profit > max.profit ? month : max, monthlyData[0]) : 
    { profit: 0, month: '' };
  const worstMonth = monthlyData.length > 0 ? 
    monthlyData.reduce((min, month) => month.profit < min.profit ? month : min, monthlyData[0]) : 
    { profit: 0, month: '' };
  const profitGrowth = monthlyData.length >= 2 ? 
    ((monthlyData[monthlyData.length - 1].profit - monthlyData[0].profit) / Math.abs(monthlyData[0].profit || 1) * 100).toFixed(1) : '0';

  const targetProfit = totalRevenue * 0.3; // هدف 30% هامش ربح
  const profitGoalProgress = targetProfit > 0 ? (totalProfit / targetProfit) * 100 : 0;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تقرير الأرباح المتقدم</h1>
          <p className="text-muted-foreground mt-1">تحليل شامل لأداء الأرباح والربحية</p>
        </div>
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
          <Button onClick={exportToExcel} variant="default">
            <Download className="h-4 w-4 ml-2" />
            تصدير Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="goals">الأهداف</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* بطاقات الملخص المحسنة */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{totalRevenue.toLocaleString()} ج.م</div>
                <p className="text-xs text-blue-600 mt-1">
                  متوسط شهري: {(totalRevenue / (monthlyData.length || 1)).toLocaleString()} ج.م
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي التكاليف</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{totalCosts.toLocaleString()} ج.م</div>
                <p className="text-xs text-red-600 mt-1">
                  {((totalCosts / totalRevenue) * 100).toFixed(1)}% من الإيرادات
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{totalProfit.toLocaleString()} ج.م</div>
                <Badge variant="default" className="bg-green-600 text-white mt-1">
                  <TrendingUp className="h-3 w-3 ml-1" />
                  نمو {profitGrowth}%
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">هامش الربح</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{profitMargin}%</div>
                <p className="text-xs text-purple-600 mt-1">
                  الهدف: 30%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* مؤشرات الأداء الرئيسية */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  مؤشرات الأداء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">متوسط الربح الشهري</span>
                  <span className="font-bold">{averageMonthlyProfit.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">أفضل شهر</span>
                  <span className="font-bold text-green-600">{bestMonth.month}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">أقل شهر</span>
                  <span className="font-bold text-red-600">{worstMonth.month}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  هدف الربحية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>التقدم نحو الهدف</span>
                    <span>{Math.min(profitGoalProgress, 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(profitGoalProgress, 100)} className="h-2" />
                </div>
                <div className="text-sm text-muted-foreground">
                  الهدف: {targetProfit.toLocaleString()} ج.م
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  تنبيهات الأداء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {parseFloat(profitMargin) < 20 && (
                  <Badge variant="destructive" className="w-full justify-center">
                    هامش ربح منخفض
                  </Badge>
                )}
                {totalProfit < 0 && (
                  <Badge variant="destructive" className="w-full justify-center">
                    خسائر في الفترة
                  </Badge>
                )}
                {parseFloat(profitMargin) >= 30 && (
                  <Badge variant="default" className="w-full justify-center bg-green-600">
                    أداء ممتاز
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* الرسوم البيانية الرئيسية */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>التطور الشهري للأرباح</CardTitle>
                <CardDescription>مقارنة الإيرادات والتكاليف والأرباح</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${Number(value).toLocaleString()} ج.م`,
                        name === 'revenue' ? 'الإيرادات' : 
                        name === 'costs' ? 'التكاليف' : 'الربح'
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" name="revenue" />
                    <Bar dataKey="costs" fill="#ef4444" name="costs" />
                    <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} name="profit" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع الأرباح حسب الفئات</CardTitle>
                <CardDescription>أداء فئات المنتجات المختلفة</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={profitByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {profitByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} ج.م`, 'الربح']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>تحليل الاتجاهات</CardTitle>
                <CardDescription>منحنى نمو الأرباح مع المناطق</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} ج.م`, 'الربح']} />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>مقارنة الفترات</CardTitle>
                <CardDescription>إيرادات vs تكاليف</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${Number(value).toLocaleString()} ج.م`,
                        name === 'revenue' ? 'الإيرادات' : 'التكاليف'
                      ]}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>أفضل المنتجات ربحاً</CardTitle>
              <CardDescription>تحليل مفصل لأداء المنتجات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{product.name}</h3>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{product.sales} وحدة مباعة</span>
                          <span>إيرادات: {product.revenue.toLocaleString()} ج.م</span>
                          <span>تكلفة: {product.cost.toLocaleString()} ج.م</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xl text-green-600">{product.profit.toLocaleString()} ج.م</div>
                      <Badge variant="secondary" className="mt-1">{product.margin} هامش ربح</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  أهداف الربحية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>هدف هامش الربح (30%)</span>
                    <span>{profitMargin}%</span>
                  </div>
                  <Progress value={Math.min(parseFloat(profitMargin) / 30 * 100, 100)} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span>هدف الربح الشهري</span>
                    <span>{(targetProfit / 12).toLocaleString()} ج.م</span>
                  </div>
                  <Progress value={Math.min(averageMonthlyProfit / (targetProfit / 12) * 100, 100)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  حاسبة الأهداف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>لتحقيق هامش ربح 30%:</div>
                  <div className="font-bold">الهدف: {targetProfit.toLocaleString()} ج.م</div>
                  <div>المطلوب إضافياً: {Math.max(targetProfit - totalProfit, 0).toLocaleString()} ج.م</div>
                </div>
                
                <div className="text-sm space-y-2">
                  <div>لتحقيق نمو 20% في الأرباح:</div>
                  <div className="font-bold">الهدف: {(totalProfit * 1.2).toLocaleString()} ج.م</div>
                  <div>الزيادة المطلوبة: {(totalProfit * 0.2).toLocaleString()} ج.م</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}