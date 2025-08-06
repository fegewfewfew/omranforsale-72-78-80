import { useState, useEffect } from "react";
import { ShoppingBag, Truck, TrendingUp, Users, Package, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { LocalDataManager } from "@/utils/localData";
import jsPDF from 'jspdf';

export default function PurchasesReport() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [purchasesAnalytics, setPurchasesAnalytics] = useState<any>(null);

  useEffect(() => {
    // تحميل البيانات الحقيقية من localStorage
    const loadRealPurchasesData = () => {
      try {
        const purchaseInvoices = JSON.parse(localStorage.getItem('purchase_invoices') || '[]');
        const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
        
        // حساب إجمالي المشتريات
        const totalPurchases = purchaseInvoices.length;
        const totalCost = purchaseInvoices.reduce((sum: number, invoice: any) => {
          return sum + (invoice.total || 0);
        }, 0);
        
        const totalOrders = purchaseInvoices.length;
        const avgOrderValue = totalOrders > 0 ? totalCost / totalOrders : 0;
        
        // تجميع البيانات الشهرية
        const monthlyData: { [key: string]: { purchases: number, cost: number, orders: number } } = {};
        
        purchaseInvoices.forEach((invoice: any) => {
          if (invoice.date) {
            const date = new Date(invoice.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { purchases: 0, cost: 0, orders: 0 };
            }
            
            monthlyData[monthKey].purchases += 1;
            monthlyData[monthKey].cost += invoice.total || 0;
            monthlyData[monthKey].orders += 1;
          }
        });
        
        // تحويل البيانات الشهرية
        const monthlyDataArray = Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6)
          .map(([month, data]) => ({
            month: new Date(month + '-01').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
            purchases: data.purchases,
            cost: data.cost,
            orders: data.orders
          }));
        
        // أفضل الموردين
        const supplierData: { [key: string]: { orders: number, totalSpent: number, lastOrder: string, rating: number } } = {};
        purchaseInvoices.forEach((invoice: any) => {
          const supplierName = invoice.supplierName || 'مورد غير محدد';
          if (!supplierData[supplierName]) {
            supplierData[supplierName] = { orders: 0, totalSpent: 0, lastOrder: invoice.date, rating: 4.5 };
          }
          supplierData[supplierName].orders++;
          supplierData[supplierName].totalSpent += invoice.total || 0;
          if (new Date(invoice.date) > new Date(supplierData[supplierName].lastOrder)) {
            supplierData[supplierName].lastOrder = invoice.date;
          }
        });
        
        const topSuppliers = Object.entries(supplierData)
          .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
          .slice(0, 10)
          .map(([name, data]) => ({
            name,
            orders: data.orders,
            totalSpent: data.totalSpent,
            lastOrder: data.lastOrder,
            rating: data.rating
          }));
        
        return {
          totalPurchases,
          totalCost,
          totalOrders,
          avgOrderValue,
          monthlyData: monthlyDataArray,
          topSuppliers
        };
      } catch (error) {
        console.error('خطأ في تحميل بيانات المشتريات:', error);
        return {
          totalPurchases: 0,
          totalCost: 0,
          totalOrders: 0,
          avgOrderValue: 0,
          monthlyData: [],
          topSuppliers: []
        };
      }
    };
    
    const analytics = loadRealPurchasesData();
    setPurchasesAnalytics(analytics);
  }, [selectedPeriod]);

  if (!purchasesAnalytics) {
    return <div>جاري التحميل...</div>;
  }

  const { totalPurchases, totalCost, totalOrders, avgOrderValue, monthlyData, topSuppliers } = purchasesAnalytics;
  
  // الحصول على المشتريات الأخيرة من localStorage
  const getRecentPurchases = () => {
    try {
      const purchaseInvoices = JSON.parse(localStorage.getItem('purchase_invoices') || '[]');
      return purchaseInvoices.slice(-10).reverse(); // آخر 10 فواتير
    } catch (error) {
      console.error('خطأ في تحميل المشتريات الأخيرة:', error);
      return [];
    }
  };
  
  const recentPurchases = getRecentPurchases();

  const exportReport = async () => {
    try {
      // إنشاء نافذة جديدة للطباعة
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('يرجى السماح بفتح النوافذ المنبثقة لتصدير التقرير');
        return;
      }

      const periodLabels = {
        '6months': 'آخر 6 أشهر',
        '12months': 'آخر 12 شهر',
        'current-year': 'العام الحالي',
        'last-year': 'العام الماضي'
      };

      // حساب إحصائيات إضافية
      const averageMonthlyPurchases = monthlyData.length > 0 ? totalCost / monthlyData.length : 0;
      const bestMonth = monthlyData.reduce((max, month) => month.cost > max.cost ? month : max, monthlyData[0] || { month: 'غير محدد', cost: 0 });
      const purchaseGrowth = monthlyData.length > 1 ? 
        ((monthlyData[monthlyData.length - 1].cost - monthlyData[0].cost) / Math.abs(monthlyData[0].cost || 1) * 100).toFixed(1) : '0';

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>تقرير المشتريات</title>
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
            <h1 class="title">تقرير المشتريات الشامل</h1>
            <div class="subtitle">تحليل مفصل لأداء المشتريات والموردين</div>
            <div class="info">
              <div>تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</div>
              <div>الفترة: ${periodLabels[selectedPeriod as keyof typeof periodLabels] || selectedPeriod}</div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">الملخص التنفيذي</h2>
            <div class="stats">
              <div class="stat-item">
                <span class="stat-label">إجمالي المشتريات:</span>
                <span>${(totalPurchases || 0).toLocaleString()} وحدة</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">إجمالي التكلفة:</span>
                <span>${(totalCost || 0).toLocaleString()} ج.م</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">عدد أوامر الشراء:</span>
                <span>${(totalOrders || 0).toLocaleString()} أمر</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">متوسط قيمة الأمر:</span>
                <span>${Math.round(avgOrderValue || 0).toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>

          ${monthlyData && monthlyData.length > 0 ? `
          <div class="section">
            <h2 class="section-title">المشتريات الشهرية</h2>
            <table>
              <thead>
                <tr>
                  <th>الشهر</th>
                  <th>المشتريات (وحدة)</th>
                  <th>التكلفة (ج.م)</th>
                  <th>عدد الأوامر</th>
                </tr>
              </thead>
              <tbody>
                ${monthlyData.map(item => `
                  <tr>
                    <td>${item.month}</td>
                    <td>${(item.purchases || 0).toLocaleString()}</td>
                    <td>${(item.cost || 0).toLocaleString()}</td>
                    <td>${(item.orders || 0).toString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${topSuppliers && topSuppliers.length > 0 ? `
          <div class="section">
            <h2 class="section-title">أفضل الموردين</h2>
            <table>
              <thead>
                <tr>
                  <th>اسم المورد</th>
                  <th>إجمالي المشتريات (ج.م)</th>
                  <th>عدد الأوامر</th>
                  <th>آخر طلب</th>
                </tr>
              </thead>
              <tbody>
                ${topSuppliers.slice(0, 10).map(supplier => `
                  <tr>
                    <td>${supplier.name}</td>
                    <td>${supplier.totalSpent.toLocaleString()}</td>
                    <td>${supplier.orders?.toString() || '0'}</td>
                    <td>${supplier.lastOrder ? new Date(supplier.lastOrder).toLocaleDateString('en-GB') : 'غير محدد'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${recentPurchases.length > 0 ? `
          <div class="section">
            <h2 class="section-title">المشتريات الأخيرة</h2>
            <table>
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>المورد</th>
                  <th>التاريخ</th>
                  <th>المبلغ (ج.م)</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                ${recentPurchases.slice(0, 10).map(purchase => `
                  <tr>
                    <td>${purchase.invoiceNumber || 'غير محدد'}</td>
                    <td>${purchase.supplierName || 'غير محدد'}</td>
                    <td>${new Date(purchase.date).toLocaleDateString('en-GB')}</td>
                    <td>${(purchase.total || 0).toLocaleString()}</td>
                    <td>${purchase.status === 'paid' ? 'مدفوع' : purchase.status === 'pending' ? 'معلق' : 'غير مدفوع'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="section">
            <h2 class="section-title">تحليل الأداء</h2>
            <ul style="list-style-type: disc; padding-right: 20px;">
              <li>متوسط المشتريات الشهرية: ${averageMonthlyPurchases.toLocaleString()} ج.م</li>
              <li>أفضل شهر: ${bestMonth.month} بمشتريات ${bestMonth.cost.toLocaleString()} ج.م</li>
              <li>نمو المشتريات: ${purchaseGrowth}%</li>
              <li>${parseFloat(purchaseGrowth) > 0 ? 'زيادة في المشتريات، تأكد من تحسين التخزين' : 'انخفاض في المشتريات، قد يدل على تحسن في إدارة المخزون'}</li>
              <li>عدد الموردين النشطين: ${topSuppliers.length} مورد</li>
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

      console.log("تم تصدير تقرير المشتريات بنجاح مع دعم كامل للنص العربي");
    } catch (error) {
      console.error("خطأ في تصدير التقرير:", error);
      alert(`خطأ في تصدير التقرير: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'مستلم':
        return <Badge variant="default">مستلم</Badge>;
      case 'قيد التوصيل':
        return <Badge variant="secondary">قيد التوصيل</Badge>;
      case 'معلق':
        return <Badge variant="destructive">معلق</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">تقرير المشتريات</h1>
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشتريات</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalPurchases || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalPurchases === 0 ? "لا توجد مشتريات" : "إجمالي المشتريات للفترة المحددة"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التكلفة</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalCost || 0).toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground">
              {totalCost === 0 ? "لا توجد تكاليف" : "إجمالي التكلفة للفترة المحددة"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد أوامر الشراء</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalOrders || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalOrders === 0 ? "لا توجد أوامر شراء" : "عدد أوامر الشراء للفترة المحددة"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط قيمة الأمر</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgOrderValue || 0).toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground">
              {avgOrderValue === 0 ? "لا يوجد متوسط" : "متوسط قيمة الأمر للفترة المحددة"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Purchases Trend */}
        <Card>
          <CardHeader>
            <CardTitle>اتجاه المشتريات الشهرية</CardTitle>
            <CardDescription>
              تطور المشتريات والتكاليف خلال الأشهر الماضية
            </CardDescription>
          </CardHeader>
           <CardContent>
             {monthlyData && monthlyData.length > 0 ? (
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'cost' ? `${Number(value).toLocaleString()} ج.م` : Number(value).toLocaleString(),
                      name === 'cost' ? 'التكلفة' : 'المشتريات'
                    ]}
                  />
                  <Bar dataKey="cost" fill="#3b82f6" name="cost" />
                  <Bar dataKey="purchases" fill="#10b981" name="purchases" />
                </BarChart>
              </ResponsiveContainer>
             ) : (
               <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                 لا توجد بيانات مشتريات متاحة
               </div>
             )}
           </CardContent>
        </Card>

        {/* Purchases by Category */}
        <Card>
          <CardHeader>
            <CardTitle>المشتريات حسب الفئة</CardTitle>
            <CardDescription>
              توزيع المشتريات على الفئات المختلفة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              لا توجد بيانات فئات متاحة
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle>أفضل الموردين</CardTitle>
          <CardDescription>
            الموردين الأكثر تعاملاً والأعلى قيمة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المورد</TableHead>
                <TableHead>عدد الطلبات</TableHead>
                <TableHead>إجمالي المشتريات</TableHead>
                <TableHead>التقييم</TableHead>
                <TableHead>آخر طلب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSuppliers && topSuppliers.length > 0 ? topSuppliers.map((supplier, index) => (
                <TableRow key={supplier.name}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium">{supplier.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{supplier.orders} طلب</TableCell>
                  <TableCell className="font-medium">{supplier.totalSpent.toLocaleString()} ج.م</TableCell>
                  <TableCell>
                    <Badge variant="default">
                      ⭐ {supplier.rating}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(supplier.lastOrder).toLocaleDateString('en-GB')}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    لا توجد بيانات موردين متاحة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle>أوامر الشراء الأخيرة</CardTitle>
          <CardDescription>
            آخر أوامر الشراء المنفذة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الأمر</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>عدد الأصناف</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPurchases && recentPurchases.length > 0 ? recentPurchases.map((purchase) => (
                 <TableRow key={purchase.id}>
                   <TableCell className="font-medium">{purchase.id}</TableCell>
                   <TableCell>{purchase.supplierName}</TableCell>
                   <TableCell>{new Date(purchase.date).toLocaleDateString('en-GB')}</TableCell>
                   <TableCell className="font-medium">{purchase.total.toLocaleString()} ج.م</TableCell>
                   <TableCell>{purchase.items.length} صنف</TableCell>
                   <TableCell>{getStatusBadge(purchase.status === 'received' ? 'مستلم' : purchase.status === 'pending' ? 'قيد التوصيل' : 'معلق')}</TableCell>
                 </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    لا توجد أوامر شراء متاحة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Purchase Orders Trend */}
      <Card>
        <CardHeader>
          <CardTitle>منحنى أوامر الشراء</CardTitle>
          <CardDescription>
            تطور عدد أوامر الشراء عبر الزمن
          </CardDescription>
        </CardHeader>
        <CardContent>
             {monthlyData && monthlyData.length > 0 ? (
               <ResponsiveContainer width="100%" height={300}>
                 <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [Number(value).toLocaleString(), 'عدد الأوامر']}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ fill: "#f59e0b", strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
             ) : (
               <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                 لا توجد بيانات أوامر متاحة
               </div>
             )}
        </CardContent>
      </Card>
    </div>
  );
}