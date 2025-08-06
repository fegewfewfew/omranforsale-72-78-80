import { useState } from "react";
import { Calendar, ShoppingCart, TrendingUp, Users, Package, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { useEffect } from "react";

// استيراد المدراء المحليين للبيانات
const getSalesData = () => {
  try {
    const salesInvoices = JSON.parse(localStorage.getItem('sales_invoices') || '[]');
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    
    // حساب إجمالي المبيعات
    const totalSales = salesInvoices.reduce((sum: number, invoice: any) => {
      return sum + (invoice.total || 0);
    }, 0);
    
    const totalOrders = salesInvoices.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // تجميع المبيعات حسب الشهر
    const monthlyData: { [key: string]: number } = {};
    const dailyData: { [key: string]: number } = {};
    
    salesInvoices.forEach((invoice: any) => {
      if (invoice.date) {
        const date = new Date(invoice.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const dayKey = date.toLocaleDateString('en-GB', { weekday: 'long' });
        
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (invoice.total || 0);
        dailyData[dayKey] = (dailyData[dayKey] || 0) + (invoice.total || 0);
      }
    });
    
    // تحويل البيانات الشهرية
    const monthlySales = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, revenue]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        revenue,
        orders: salesInvoices.filter((inv: any) => {
          const invMonth = new Date(inv.date).toISOString().substring(0, 7);
          return invMonth === month;
        }).length
      }));
    
    // تحويل البيانات اليومية
    const dailySales = Object.entries(dailyData).map(([day, sales]) => ({
      day,
      sales
    }));
    
    // أفضل العملاء
    const customerData: { [key: string]: { orders: number, totalSpent: number, lastOrder: string } } = {};
    salesInvoices.forEach((invoice: any) => {
      const customerName = invoice.customerName || 'عميل غير محدد';
      if (!customerData[customerName]) {
        customerData[customerName] = { orders: 0, totalSpent: 0, lastOrder: invoice.date };
      }
      customerData[customerName].orders++;
      customerData[customerName].totalSpent += invoice.total || 0;
      if (new Date(invoice.date) > new Date(customerData[customerName].lastOrder)) {
        customerData[customerName].lastOrder = invoice.date;
      }
    });
    
    const topCustomers = Object.entries(customerData)
      .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        orders: data.orders,
        totalSpent: data.totalSpent,
        lastOrder: data.lastOrder
      }));
    
    // أفضل المنتجات
    const productData: { [key: string]: { quantity: number, revenue: number } } = {};
    salesInvoices.forEach((invoice: any) => {
      if (invoice.itemsDetails && Array.isArray(invoice.itemsDetails)) {
        invoice.itemsDetails.forEach((item: any) => {
          const productName = item.productName || 'منتج غير محدد';
          if (!productData[productName]) {
            productData[productName] = { quantity: 0, revenue: 0 };
          }
          productData[productName].quantity += item.quantity || 0;
          productData[productName].revenue += (item.price * item.quantity) || 0;
        });
      }
    });
    
    const topProducts = Object.entries(productData)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue
      }));
    
    return {
      totalSales,
      totalRevenue: totalSales,
      totalOrders,
      avgOrderValue,
      monthlySales,
      dailySales,
      topCustomers,
      topProducts
    };
  } catch (error) {
    console.error('خطأ في تحميل بيانات المبيعات:', error);
    return {
      totalSales: 0,
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      monthlySales: [],
      dailySales: [],
      topCustomers: [],
      topProducts: []
    };
  }
};

export default function SalesReport() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [salesData, setSalesData] = useState<any>(null);

  useEffect(() => {
    const data = getSalesData();
    setSalesData(data);
  }, [selectedPeriod]);

  if (!salesData) {
    return <div className="flex items-center justify-center h-64">جاري تحميل بيانات المبيعات...</div>;
  }

  const {
    totalSales,
    totalRevenue,
    totalOrders,
    avgOrderValue,
    monthlySales,
    dailySales,
    topCustomers,
    topProducts
  } = salesData;

  const exportReport = async () => {
    try {
      console.log('بدء تصدير تقرير المبيعات...');
      
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
      const averageMonthlySales = monthlySales.length > 0 ? totalSales / monthlySales.length : 0;
      const bestMonth = monthlySales.reduce((max, month) => month.revenue > max.revenue ? month : max, monthlySales[0] || { month: 'غير محدد', revenue: 0 });
      const salesGrowth = monthlySales.length > 1 ? 
        ((monthlySales[monthlySales.length - 1].revenue - monthlySales[0].revenue) / Math.abs(monthlySales[0].revenue || 1) * 100).toFixed(1) : '0';

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>تقرير المبيعات</title>
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
            <h1 class="title">تقرير المبيعات الشامل</h1>
            <div class="subtitle">تحليل مفصل لأداء المبيعات والعملاء</div>
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
                <span class="stat-label">عدد الفواتير:</span>
                <span>${totalOrders.toLocaleString()} فاتورة</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">متوسط قيمة الفاتورة:</span>
                <span>${Math.round(avgOrderValue).toLocaleString()} ج.م</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">متوسط المبيعات الشهرية:</span>
                <span>${averageMonthlySales.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>

          ${monthlySales.length > 0 ? `
          <div class="section">
            <h2 class="section-title">المبيعات الشهرية</h2>
            <table>
              <thead>
                <tr>
                  <th>الشهر</th>
                  <th>الإيرادات (ج.م)</th>
                  <th>عدد الطلبات</th>
                  <th>متوسط قيمة الطلب</th>
                </tr>
              </thead>
              <tbody>
                ${monthlySales.map(item => `
                  <tr>
                    <td>${item.month}</td>
                    <td>${item.revenue.toLocaleString()}</td>
                    <td>${item.orders.toLocaleString()}</td>
                    <td>${item.orders > 0 ? Math.round(item.revenue / item.orders).toLocaleString() : 0} ج.م</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${topCustomers.length > 0 ? `
          <div class="section">
            <h2 class="section-title">أفضل العملاء</h2>
            <table>
              <thead>
                <tr>
                  <th>اسم العميل</th>
                  <th>عدد الطلبات</th>
                  <th>إجمالي المشتريات (ج.م)</th>
                  <th>آخر طلب</th>
                </tr>
              </thead>
              <tbody>
                ${topCustomers.slice(0, 10).map(customer => `
                  <tr>
                    <td>${customer.name}</td>
                    <td>${customer.orders}</td>
                    <td>${customer.totalSpent.toLocaleString()}</td>
                    <td>${new Date(customer.lastOrder).toLocaleDateString('en-GB')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${topProducts.length > 0 ? `
          <div class="section">
            <h2 class="section-title">أفضل المنتجات مبيعاً</h2>
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الكمية المباعة</th>
                  <th>الإيرادات (ج.م)</th>
                  <th>متوسط السعر</th>
                </tr>
              </thead>
              <tbody>
                ${topProducts.slice(0, 10).map(product => `
                  <tr>
                    <td>${product.name}</td>
                    <td>${product.quantity} وحدة</td>
                    <td>${product.revenue.toLocaleString()}</td>
                    <td>${product.quantity > 0 ? Math.round(product.revenue / product.quantity).toLocaleString() : 0} ج.م</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="section">
            <h2 class="section-title">تحليل الأداء</h2>
            <ul style="list-style-type: disc; padding-right: 20px;">
              <li>متوسط المبيعات الشهرية: ${averageMonthlySales.toLocaleString()} ج.م</li>
              <li>أفضل شهر: ${bestMonth.month} بمبيعات ${bestMonth.revenue.toLocaleString()} ج.م</li>
              <li>نمو المبيعات: ${salesGrowth}%</li>
              <li>${parseFloat(salesGrowth) > 0 ? 'أداء ممتاز في النمو، استمر في نفس الاستراتيجية' : 'ينصح بمراجعة استراتيجية التسويق والمبيعات'}</li>
              <li>عدد العملاء النشطين: ${topCustomers.length} عميل</li>
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

      console.log("تم تصدير تقرير المبيعات بنجاح مع نفس تصميم تقرير الأرباح");
    } catch (error) {
      console.error("خطأ في تصدير التقرير:", error);
      alert(`خطأ في تصدير التقرير: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">تقرير المبيعات</h1>
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
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{totalSales.toLocaleString()} ج.م</div>
             <p className="text-xs text-muted-foreground">
               من {totalOrders} فاتورة
             </p>
           </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} ج.م</div>
             <p className="text-xs text-muted-foreground">
               إجمالي المبيعات
             </p>
           </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الطلبات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{totalOrders.toLocaleString()}</div>
             <p className="text-xs text-muted-foreground">
               فاتورة مبيعات
             </p>
           </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط قيمة الطلب</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{Math.round(avgOrderValue).toLocaleString()} ج.م</div>
             <p className="text-xs text-muted-foreground">
               متوسط قيمة الفاتورة
             </p>
           </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>اتجاه المبيعات الشهرية</CardTitle>
            <CardDescription>
              تطور المبيعات والإيرادات خلال الأشهر الماضية
            </CardDescription>
          </CardHeader>
           <CardContent>
             <ResponsiveContainer width="100%" height={300}>
               <AreaChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                 <Tooltip 
                   formatter={(value, name) => [
                     name === 'revenue' ? `${Number(value).toLocaleString()} ج.م` : Number(value).toLocaleString(),
                     name === 'revenue' ? 'الإيرادات' : 'المبيعات'
                   ]}
                 />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Sales */}
        <Card>
          <CardHeader>
            <CardTitle>المبيعات اليومية</CardTitle>
            <CardDescription>
              أداء المبيعات خلال أيام الأسبوع
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'المبيعات']} />
                <Bar dataKey="sales" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>أفضل المنتجات مبيعاً</CardTitle>
          <CardDescription>
            المنتجات الأكثر مبيعاً والأعلى إيراداً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المنتج</TableHead>
                <TableHead>الكمية المباعة</TableHead>
                <TableHead>الإيرادات</TableHead>
                <TableHead>النمو</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {topProducts.map((product, index) => (
                 <TableRow key={product.name}>
                   <TableCell>
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                         {index + 1}
                       </div>
                       <span className="font-medium">{product.name}</span>
                     </div>
                   </TableCell>
                   <TableCell>{product.quantity} وحدة</TableCell>
                   <TableCell className="font-medium">{product.revenue.toLocaleString()} ج.م</TableCell>
                   <TableCell>
                     <Badge variant="default" className="text-green-600">
                       +15%
                     </Badge>
                   </TableCell>
                 </TableRow>
               ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>أفضل العملاء</CardTitle>
          <CardDescription>
            العملاء الأكثر شراءً والأعلى إنفاقاً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم العميل</TableHead>
                <TableHead>عدد الطلبات</TableHead>
                <TableHead>إجمالي المشتريات</TableHead>
                <TableHead>آخر طلب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCustomers.map((customer, index) => (
                <TableRow key={customer.name}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{customer.orders} طلب</TableCell>
                  <TableCell className="font-medium">{customer.totalSpent.toLocaleString()} ج.م</TableCell>
                  <TableCell>{new Date(customer.lastOrder).toLocaleDateString('en-GB')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sales Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>منحنى نمو المبيعات</CardTitle>
          <CardDescription>
            تطور عدد الطلبات عبر الزمن
          </CardDescription>
        </CardHeader>
         <CardContent>
           <ResponsiveContainer width="100%" height={300}>
             <LineChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [Number(value).toLocaleString(), 'عدد الطلبات']}
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
        </CardContent>
      </Card>
    </div>
  );
}