import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cashFlowManager } from '@/utils/cashFlowManager';
import { storage } from '@/utils/storage';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function CashFlowDashboard() {
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = () => {
    setIsLoading(true);
    try {
      // مزامنة البيانات المالية
      cashFlowManager.syncAllFinancialData();
      
      // جلب الملخص المالي
      const summary = cashFlowManager.getFinancialSummary();
      setFinancialSummary(summary);
    } catch (error) {
      console.error('خطأ في تحديث البيانات المالية:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    
    // تحديث تلقائي كل دقيقتين
    const interval = setInterval(refreshData, 120000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="h-4 w-4" />;
    if (growth < 0) return <ArrowDownRight className="h-4 w-4" />;
    return null;
  };

  if (isLoading || !financialSummary) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  // بيانات الرسم البياني
  const now = new Date();
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayTransactions = cashFlowManager.getTransactionsByDateRange(
      date.toISOString(),
      new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString()
    );
    
    const dayIncome = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const dayExpenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    chartData.push({
      date: date.toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', numberingSystem: 'latn' }),
      income: dayIncome,
      expenses: dayExpenses,
      net: dayIncome - dayExpenses
    });
  }

  return (
    <div className="space-y-6">
      {/* بطاقات الملخص المالي */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* الرصيد الحالي */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">الرصيد الحالي</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">
              {formatCurrency(financialSummary.currentBalance)}
            </div>
            <div className={`flex items-center text-xs mt-1 font-tajawal ${
              financialSummary.currentBalance > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {financialSummary.currentBalance > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {financialSummary.currentBalance > 0 ? 'رصيد إيجابي' : 'رصيد سالب'}
            </div>
          </CardContent>
        </Card>

        {/* إيرادات الشهر */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إيرادات الشهر</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 font-tajawal">
              {formatCurrency(financialSummary.thisMonthIncome)}
            </div>
            <div className={`flex items-center text-xs mt-1 font-tajawal ${getGrowthColor(financialSummary.incomeGrowth)}`}>
              {getGrowthIcon(financialSummary.incomeGrowth)}
              {Math.abs(financialSummary.incomeGrowth).toLocaleString('en-US', { maximumFractionDigits: 1 })}% من الشهر الماضي
            </div>
          </CardContent>
        </Card>

        {/* مصروفات الشهر */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">مصروفات الشهر</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 font-tajawal">
              {formatCurrency(financialSummary.thisMonthExpenses)}
            </div>
            <div className={`flex items-center text-xs mt-1 font-tajawal ${getGrowthColor(-financialSummary.expenseGrowth)}`}>
              {getGrowthIcon(financialSummary.expenseGrowth)}
              {Math.abs(financialSummary.expenseGrowth).toLocaleString('en-US', { maximumFractionDigits: 1 })}% من الشهر الماضي
            </div>
          </CardContent>
        </Card>

        {/* صافي التدفق */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">صافي التدفق</CardTitle>
            <div className="flex items-center gap-2">
              {financialSummary.thisMonthNetFlow > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-tajawal ${
              financialSummary.thisMonthNetFlow > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(financialSummary.thisMonthNetFlow)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-tajawal">
              {financialSummary.thisMonthNetFlow > 0 ? 'ربح هذا الشهر' : 'خسارة هذا الشهر'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية والتفاصيل */}
      <Tabs defaultValue="flow" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="flow" className="font-cairo">نظرة عامة</TabsTrigger>
            <TabsTrigger value="transactions" className="font-cairo">التقارير</TabsTrigger>
            <TabsTrigger value="alerts" className="font-cairo">التحليلات</TabsTrigger>
          </TabsList>
          
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>

        <TabsContent value="flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-cairo">التدفق النقدي - آخر 7 أيام</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `التاريخ: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="الإيرادات"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="المصروفات"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="صافي التدفق"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-cairo">المعاملات (0)</CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="space-y-4 font-cairo">
                    <div className="text-center text-muted-foreground py-8">
                      <div className="text-lg font-bold font-tajawal">لا توجد معاملات مطابقة للفلاتر المحددة</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold font-tajawal">0</div>
                        <div className="text-sm text-muted-foreground font-cairo">عمليات مصروف</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold font-tajawal">0</div>
                        <div className="text-sm text-muted-foreground font-cairo">عمليات دخل</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm font-tajawal">
                      <div className="flex justify-between">
                        <span>أكبر عملية دخل:</span>
                        <span>‏٠ ج.م.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>أكبر عملية مصروف:</span>
                        <span>‏٠ ج.م.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>معدل الدخل اليومي:</span>
                        <span>‏٠ ج.م.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>معدل المصروفات اليومي:</span>
                        <span>‏٠ ج.م.‏</span>
                      </div>
                      <div className="flex justify-between">
                        <span>نسبة الربحية:</span>
                        <span>0%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-bold font-cairo">مؤشر الأداء العام</h4>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-cairo">ضعيف</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs font-cairo">متوسط</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs font-cairo">ممتاز</span>
                      </div>
                      
                      <div className="space-y-2 text-sm font-tajawal">
                        <div className="flex justify-between">
                          <span>نسبة المبيعات من إجمالي الدخل</span>
                          <span>0%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>نسبة المصاريف التشغيلية</span>
                          <span>0%</span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800 font-tajawal">
                          <span>⚠️</span>
                          <span className="font-bold">بناء احتياطي نقدي</span>
                        </div>
                        <div className="text-sm text-yellow-600 mt-1 font-tajawal">
                          يُنصح ببناء احتياطي نقدي لا يقل عن 10,000 جنيه لضمان السيولة.
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm font-tajawal">
                        <div className="text-center">
                          <div className="text-lg font-bold">‏٠ ج.م.</div>
                          <div className="text-muted-foreground">أفضل يوم</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">‏٠ ج.م.</div>
                          <div className="text-muted-foreground">متوسط العملية</div>
                        </div>
                      </div>
                    </div>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-cairo">
                <AlertTriangle className="h-5 w-5" />
                تحليل النشاط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 font-cairo">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-bold text-lg mb-3">تقرير الأداء المالي</h4>
                    <div className="text-sm text-muted-foreground">تحليل شامل للوضع المالي الحالي</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-bold text-lg mb-3">مقارنة الدخل والمصروفات</h4>
                    <div className="text-sm text-muted-foreground">رسوم بيانية تفاعلية للمقارنة</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-bold text-lg mb-3">إحصائيات متقدمة</h4>
                    <div className="text-sm text-muted-foreground">تحليل عميق للبيانات المالية</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-bold text-lg mb-3">توصيات ذكية</h4>
                    <div className="text-sm text-muted-foreground">نصائح لتحسين الأداء المالي</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}