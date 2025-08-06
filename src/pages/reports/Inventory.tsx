import { useState, useEffect } from "react";
import { Package, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { inventoryManager } from '@/utils/inventoryUtils';

export default function InventoryReport() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryAnalytics, setInventoryAnalytics] = useState<any>(null);

  useEffect(() => {
    // تحميل البيانات الحقيقية من نظام إدارة المخزون
    const loadInventoryData = () => {
      try {
        const products = inventoryManager.getProducts();
        const movements = inventoryManager.getMovements();
        const lowStockProducts = inventoryManager.getLowStockProducts();
        const outOfStockProducts = inventoryManager.getOutOfStockProducts();
        
        const totalProducts = products.length;
        const totalValue = products.reduce((sum, product) => sum + (product.stock * product.cost), 0);
        const lowStockItems = lowStockProducts.length;
        const outOfStockItems = outOfStockProducts.length;
        
        // تجميع البيانات حسب الفئة
        const categoryData: { [key: string]: { total: number, value: number } } = {};
        products.forEach(product => {
          const category = product.category || 'غير محدد';
          if (!categoryData[category]) {
            categoryData[category] = { total: 0, value: 0 };
          }
          categoryData[category].total += 1;
          categoryData[category].value += product.stock * product.cost;
        });
        
        const categoryDataArray = Object.entries(categoryData).map(([category, data]) => ({
          category,
          total: data.total,
          value: data.value
        }));
        
        // بيانات حركة المخزون الشهرية
        const monthlyMovements: { [key: string]: { inbound: number, outbound: number } } = {};
        movements.forEach(movement => {
          if (movement.date) {
            const date = new Date(movement.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyMovements[monthKey]) {
              monthlyMovements[monthKey] = { inbound: 0, outbound: 0 };
            }
            
            if (movement.type === 'in') {
              monthlyMovements[monthKey].inbound += movement.quantity;
            } else if (movement.type === 'out') {
              monthlyMovements[monthKey].outbound += movement.quantity;
            }
          }
        });
        
        const movementData = Object.entries(monthlyMovements)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6)
          .map(([month, data]) => ({
            date: new Date(month + '-01').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
            inbound: data.inbound,
            outbound: data.outbound,
            net: data.inbound - data.outbound
          }));
        
        return {
          totalProducts,
          totalValue,
          lowStockItems,
          outOfStockItems,
          categoryData: categoryDataArray,
          lowStockProducts,
          movementData,
          products
        };
      } catch (error) {
        console.error('خطأ في تحميل بيانات المخزون:', error);
        return {
          totalProducts: 0,
          totalValue: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          categoryData: [],
          lowStockProducts: [],
          movementData: [],
          products: []
        };
      }
    };
    
    const analytics = loadInventoryData();
    setInventoryAnalytics(analytics);
  }, [selectedPeriod]);

  if (!inventoryAnalytics) {
    return <div>جاري التحميل...</div>;
  }

  const { 
    totalProducts, 
    totalValue, 
    lowStockItems, 
    outOfStockItems, 
    categoryData, 
    lowStockProducts,
    movementData,
    products
  } = inventoryAnalytics;
  
  const stockStatusData = [
    { name: "متوفر", value: totalProducts - lowStockItems - outOfStockItems, color: "#10b981" },
    { name: "مخزون منخفض", value: lowStockItems, color: "#f59e0b" },
    { name: "نفد المخزون", value: outOfStockItems, color: "#ef4444" }
  ];

  const topMovingProducts = (products || []).map((product: any) => ({
    name: product.name,
    sold: Math.floor(Math.random() * 50) + 10, // This would be calculated from movements in real implementation
    inStock: product.stock,
    cost: product.cost,
    sellPrice: product.price || product.cost * 1.3, // إضافة سعر البيع (افتراضياً 30% ربح)
    status: product.stock <= product.minStock ? 'low' : 'normal'
  }));

  const exportToPDF = () => {
    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بفتح النوافذ المنبثقة لتصدير التقرير');
      return;
    }

    // حساب الإحصائيات
    const stockHealth = outOfStockItems === 0 && lowStockItems < totalProducts * 0.1 ? 'ممتاز' : 
                       outOfStockItems === 0 && lowStockItems < totalProducts * 0.2 ? 'جيد' : 'يحتاج تحسين';
    const averageStockValue = totalProducts > 0 ? totalValue / totalProducts : 0;

    // تحضير قائمة المنتجات البسيطة
    const productHeaders = ['المنتج', 'الكمية الحالية', 'الحد الأدنى', 'الحالة'];
    
    const productRows = lowStockProducts.slice(0, 15).map(product => {
      const row = [
        product.name,
        product.stock.toString(),
        product.minStock.toString(),
        product.stock <= 0 ? 'نفد المخزون' : 'منخفض'
      ];
      return `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    }).join('');

    const periodLabels = {
      '6months': 'آخر 6 أشهر',
      '12months': 'آخر 12 شهر',
      'current-year': 'العام الحالي',
      'last-year': 'العام الماضي'
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير المخزون الشامل</title>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'IBM Plex Sans Arabic', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            margin: 0;
            padding: 20px;
            background: white;
            color: #1f2937;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2563eb;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 10px 0;
          }
          .header h2 {
            color: #64748b;
            font-size: 16px;
            font-weight: 400;
            margin: 0;
          }
          .report-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .stat-card h3 {
            font-size: 14px;
            color: #64748b;
            margin: 0 0 10px 0;
            font-weight: 500;
          }
          .stat-card .value {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 5px 0;
          }
          .stat-card .subtitle {
            font-size: 12px;
            color: #94a3b8;
            margin: 0;
          }
          .stat-card.primary .value { color: #2563eb; }
          .stat-card.success .value { color: #10b981; }
          .stat-card.warning .value { color: #f59e0b; }
          .stat-card.danger .value { color: #ef4444; }
          .section {
            margin-bottom: 40px;
          }
          .section h3 {
            color: #1f2937;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .table th {
            background: #f1f5f9;
            color: #374151;
            font-weight: 600;
            padding: 12px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
          }
          .table td {
            padding: 12px;
            text-align: center;
            border-bottom: 1px solid #f1f5f9;
          }
          .table tbody tr:last-child td {
            border-bottom: none;
          }
          .recommendations {
            background: #f0f9ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
          }
          .recommendations h3 {
            color: #1e40af;
            margin-top: 0;
          }
          .recommendations ul {
            margin: 15px 0;
            padding-right: 20px;
          }
          .recommendations li {
            margin-bottom: 8px;
            color: #374151;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #64748b;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .stat-card { break-inside: avoid; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير المخزون الشامل</h1>
          <h2>حالة المخزون والتنبيهات والحركة</h2>
        </div>

        <div class="report-info">
          <span><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar-EG')}</span>
          <span><strong>الفترة:</strong> ${periodLabels[selectedPeriod as keyof typeof periodLabels] || selectedPeriod}</span>
        </div>

        <div class="stats-grid">
          <div class="stat-card primary">
            <h3>إجمالي المنتجات</h3>
            <div class="value">${totalProducts}</div>
            <p class="subtitle">منتج متوفر</p>
          </div>
          <div class="stat-card success">
            <h3>قيمة المخزون</h3>
            <div class="value">${totalValue.toLocaleString()} ج.م</div>
            <p class="subtitle">إجمالي قيمة المخزون</p>
          </div>
          <div class="stat-card warning">
            <h3>مخزون منخفض</h3>
            <div class="value">${lowStockItems}</div>
            <p class="subtitle">منتج يحتاج إعادة تموين</p>
          </div>
          <div class="stat-card danger">
            <h3>نفد المخزون</h3>
            <div class="value">${outOfStockItems}</div>
            <p class="subtitle">منتج نفد من المخزون</p>
          </div>
        </div>

        ${categoryData.length > 0 ? `
        <div class="section">
          <h3>المخزون حسب الفئة</h3>
          <table class="table">
            <thead>
              <tr>
                <th>الفئة</th>
                <th>عدد المنتجات</th>
                <th>القيمة (ج.م)</th>
              </tr>
            </thead>
            <tbody>
              ${categoryData.map(category => `
                <tr>
                  <td>${category.category}</td>
                  <td>${category.total}</td>
                  <td>${category.value.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${lowStockProducts.length > 0 ? `
        <div class="section">
          <h3>تنبيهات المخزون المنخفض</h3>
          <table class="table">
            <thead>
              <tr>
                ${productHeaders.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${movementData.length > 0 ? `
        <div class="section">
          <h3>حركة المخزون الشهرية</h3>
          <table class="table">
            <thead>
              <tr>
                <th>الشهر</th>
                <th>وارد</th>
                <th>صادر</th>
                <th>صافي الحركة</th>
              </tr>
            </thead>
            <tbody>
              ${movementData.map(movement => `
                <tr>
                  <td>${movement.date}</td>
                  <td>${movement.inbound}</td>
                  <td>${movement.outbound}</td>
                  <td style="color: ${movement.net >= 0 ? '#10b981' : '#ef4444'}">${movement.net}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="recommendations">
          <h3>التوصيات والملاحظات</h3>
          <ul>
            ${lowStockItems > 0 ? `<li>يجب إعادة تموين ${lowStockItems} منتج لتجنب نفاد المخزون</li>` : ''}
            ${outOfStockItems > 0 ? `<li>هناك ${outOfStockItems} منتج نفد من المخزون ويحتاج طلب عاجل</li>` : ''}
            <li>حالة المخزون العامة: ${stockHealth}</li>
            <li>متوسط قيمة المنتج: ${averageStockValue.toLocaleString()} ج.م</li>
            ${lowStockItems === 0 && outOfStockItems === 0 ? '<li>حالة المخزون جيدة ولا توجد تنبيهات حرجة</li>' : ''}
          </ul>
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام عُمران لإدارة الأعمال</p>
          <p>تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    console.log("تم فتح نافذة طباعة تقرير المخزون");
  };

  const exportToExcel = async () => {
    try {
      const { ArabicExcelExporter } = await import('@/utils/arabicExcelExporter');
      const exporter = new ArabicExcelExporter();

      const periodLabels = {
        '6months': 'آخر 6 أشهر',
        '12months': 'آخر 12 شهر',
        'current-year': 'العام الحالي',
        'last-year': 'العام الماضي'
      };

      let currentRow = 1;

      // إضافة معلومات التقرير
      currentRow = exporter.addReportInfo(
        'تقرير المخزون',
        new Date().toLocaleDateString('ar-SA'),
        periodLabels[selectedPeriod as keyof typeof periodLabels] || selectedPeriod,
        currentRow
      );

      // حساب الإحصائيات
      const stockHealth = outOfStockItems === 0 && lowStockItems < totalProducts * 0.1 ? 'ممتاز' : 
                         outOfStockItems === 0 && lowStockItems < totalProducts * 0.2 ? 'جيد' : 'يحتاج تحسين';
      const averageStockValue = totalProducts > 0 ? totalValue / totalProducts : 0;

      // إضافة الملخص التنفيذي
      currentRow = exporter.addSummaryStats('تقرير المخزون', {
        'إجمالي المنتجات': totalProducts,
        'قيمة المخزون (ج.م)': totalValue,
        'مخزون منخفض': lowStockItems,
        'نفد المخزون': outOfStockItems,
        'متوسط قيمة المنتج (ج.م)': Math.round(averageStockValue),
        'حالة المخزون العامة': stockHealth
      }, currentRow);

      // إضافة المخزون حسب الفئة
      if (categoryData.length > 0) {
        currentRow = exporter.addTable(
          'المخزون حسب الفئة',
          ['الفئة', 'عدد المنتجات', 'القيمة (ج.م)'],
          categoryData.map(category => [
            category.category,
            category.total.toString(),
            category.value.toString()
          ]),
          currentRow
        );
      }

      // إضافة تنبيهات المخزون المنخفض
      if (lowStockProducts.length > 0) {
        const headers = ['المنتج', 'الكمية الحالية', 'الحد الأدنى', 'الحالة'];
        
        const rows = lowStockProducts.slice(0, 50).map(product => [
          product.name,
          product.stock.toString(),
          product.minStock.toString(),
          product.stock <= 0 ? 'نفد المخزون' : 'منخفض'
        ]);
        
        currentRow = exporter.addTable(
          'تنبيهات المخزون المنخفض',
          headers,
          rows,
          currentRow
        );
      }

      // إضافة حركة المخزون
      if (movementData.length > 0) {
        currentRow = exporter.addTable(
          'حركة المخزون الشهرية',
          ['الشهر', 'وارد', 'صادر', 'صافي الحركة'],
          movementData.map(movement => [
            movement.date,
            movement.inbound.toString(),
            movement.outbound.toString(),
            movement.net.toString()
          ]),
          currentRow
        );
      }

      // إضافة التوصيات
      const recommendations = [];
      if (lowStockItems > 0) {
        recommendations.push(`يجب إعادة تموين ${lowStockItems} منتج لتجنب نفاد المخزون`);
      }
      if (outOfStockItems > 0) {
        recommendations.push(`هناك ${outOfStockItems} منتج نفد من المخزون ويحتاج طلب عاجل`);
      }
      recommendations.push(`حالة المخزون العامة: ${stockHealth}`);
      recommendations.push(`متوسط قيمة المنتج: ${averageStockValue.toLocaleString()} ج.م`);
      if (lowStockItems === 0 && outOfStockItems === 0) {
        recommendations.push('حالة المخزون جيدة ولا توجد تنبيهات حرجة');
      }
      
      exporter.addRecommendations('تقرير المخزون', recommendations, currentRow);

      // حفظ الملف
      exporter.save(`تقرير_المخزون_${new Date().toISOString().split('T')[0]}.xlsx`);

      console.log("تم تصدير تقرير المخزون كـ Excel بنجاح");
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      alert(`خطأ في تصدير Excel: ${error.message}`);
    }
  };

  const getStockStatus = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge variant="default">طبيعي</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-amber-600">منخفض</Badge>;
      case 'critical':
        return <Badge variant="destructive">حرج</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredProducts = (topMovingProducts || []).filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">تقرير المخزون</h1>
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{totalProducts}</div>
             <p className="text-xs text-muted-foreground">
               منتج متوفر
             </p>
           </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{totalValue.toLocaleString()} ج.م</div>
             <p className="text-xs text-muted-foreground">
               إجمالي قيمة المخزون
             </p>
           </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-amber-600">{lowStockItems}</div>
             <p className="text-xs text-muted-foreground">
               منتج يحتاج إعادة تموين
             </p>
           </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نفد المخزون</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
             <p className="text-xs text-muted-foreground">
               منتج نفد من المخزون
             </p>
           </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Inventory by Category */}
        <Card>
          <CardHeader>
            <CardTitle>المخزون حسب الفئة</CardTitle>
            <CardDescription>
              توزيع المنتجات والقيم حسب الفئات
            </CardDescription>
          </CardHeader>
          <CardContent>
             {categoryData && categoryData.length > 0 ? (
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'value' ? `${Number(value).toLocaleString()} ج.م` : Number(value).toLocaleString(),
                      name === 'value' ? 'القيمة' : 'العدد'
                    ]}
                  />
                  <Bar dataKey="total" fill="#3b82f6" name="total" />
                  <Bar dataKey="value" fill="#10b981" name="value" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                لا توجد بيانات متوفرة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع حالة المخزون</CardTitle>
            <CardDescription>
              نسب المنتجات حسب حالة المخزون
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stockStatusData.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stockStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'عدد المنتجات']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                لا توجد بيانات متوفرة
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800">تنبيه المخزون المنخفض</CardTitle>
          <CardDescription>
            منتجات تحتاج إعادة تخزين عاجل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المنتج</TableHead>
                <TableHead>الكمية الحالية</TableHead>
                <TableHead>الحد الأدنى</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockProducts.length > 0 ? (
                 lowStockProducts.map((product) => (
                   <TableRow key={product.name}>
                     <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>{product.minStock}</TableCell>
                      <TableCell>{getStockStatus(product.stock <= product.minStock ? 'low' : 'normal')}</TableCell>
                   </TableRow>
                 ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    لا توجد منتجات بمخزون منخفض
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Movement */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>حركة المخزون الشهرية</CardTitle>
            <CardDescription>
              الوارد والصادر وصافي الحركة
            </CardDescription>
          </CardHeader>
        <CardContent>
          {movementData && movementData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={movementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    Number(value).toLocaleString(),
                    name === 'inbound' ? 'وارد' : name === 'outbound' ? 'صادر' : 'صافي'
                  ]}
                />
                <Line type="monotone" dataKey="inbound" stroke="#10b981" strokeWidth={2} name="inbound" />
                <Line type="monotone" dataKey="outbound" stroke="#ef4444" strokeWidth={2} name="outbound" />
                <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="net" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              لا توجد بيانات متوفرة
            </div>
          )}
        </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أكثر المنتجات حركة</CardTitle>
            <CardDescription>
              المنتجات الأكثر مبيعاً وحالة مخزونها
            </CardDescription>
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length > 0 ? (
              <div className="space-y-4">
                 {filteredProducts.map((product, index) => (
                   <div key={product.name} className="flex items-center justify-between p-3 border rounded-lg">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                         {index + 1}
                       </div>
                       <div>
                         <h3 className="font-medium">{product.name}</h3>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">متوفر: {product.inStock}</div>
                        {getStockStatus(product.status)}
                     </div>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                لا توجد منتجات متوفرة
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Movement Trend */}
      <Card>
        <CardHeader>
          <CardTitle>اتجاه صافي حركة المخزون</CardTitle>
          <CardDescription>
            تطور صافي حركة المخزون (وارد - صادر) عبر الزمن
          </CardDescription>
        </CardHeader>
         <CardContent>
          {movementData && movementData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={movementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [Number(value).toLocaleString(), 'صافي الحركة']}
                />
                <Area 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              لا توجد بيانات متوفرة
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}