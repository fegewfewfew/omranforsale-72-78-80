import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/utils/storage";
import { cashFlowManager } from "@/utils/cashFlowManager";
import { inventoryManager } from "@/utils/inventoryUtils";
import { 
  Plus, 
  Minus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  History,
  Calendar,
  Wallet,
  RefreshCw,
  Filter,
  Download,
  Search,
  AlertTriangle,
  BarChart3,
  PieChart,
  FileText,
  Calculator,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Target,
  Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
  paymentMethod?: string;
  referenceId?: string;
  notes?: string;
}

interface DateRange {
  from: Date;
  to: Date;
}

export default function CashRegister() {
  const { toast } = useToast();
  const [currentBalance, setCurrentBalance] = useState(() => {
    return storage.getItem<number>('currentBalance', 0);
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = storage.getItem<Transaction[]>('transactions', []);
    return saved.map((t: any) => ({
      ...t,
      date: new Date(t.date)
    }));
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [transactionForm, setTransactionForm] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    paymentMethod: 'cash',
    notes: ''
  });

  // مزامنة البيانات مع cashFlowManager
  const syncWithCashFlowManager = () => {
    setIsLoading(true);
    try {
      cashFlowManager.syncAllFinancialData();
      
      // تحديث الرصيد
      const newBalance = cashFlowManager.getCurrentBalance();
      setCurrentBalance(newBalance);
      storage.setItem('currentBalance', newBalance);
      
      // جلب المعاملات المحدثة
      const cashFlowTransactions = cashFlowManager.getTransactions();
      const convertedTransactions: Transaction[] = cashFlowTransactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        category: t.category,
        date: new Date(t.date),
        paymentMethod: t.paymentMethod,
        referenceId: t.referenceId,
        notes: t.notes
      }));
      
      setTransactions(convertedTransactions);
      storage.setItem('transactions', convertedTransactions);
    } catch (error) {
      console.error('خطأ في مزامنة البيانات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncWithCashFlowManager();
    
    // تحديث تلقائي كل دقيقة
    const interval = setInterval(syncWithCashFlowManager, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAddTransaction = () => {
    if (!transactionForm.amount || !transactionForm.description || !transactionForm.category) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(transactionForm.amount);
    if (amount <= 0) {
      toast({
        title: "خطأ",
        description: "يجب أن يكون المبلغ أكبر من صفر",
        variant: "destructive",
      });
      return;
    }

    const newTransaction: Transaction = {
      id: `TR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: transactionForm.type,
      amount,
      description: transactionForm.description,
      category: transactionForm.category,
      date: new Date(),
      paymentMethod: transactionForm.paymentMethod,
      notes: transactionForm.notes
    };

    // إضافة إلى النظام المحلي
    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    storage.setItem('transactions', updatedTransactions);
    
    // إضافة إلى cashFlowManager
    cashFlowManager.addTransaction({
      date: new Date().toISOString(),
      type: transactionForm.type,
      category: getCashFlowCategory(transactionForm.category),
      amount,
      description: transactionForm.description,
      referenceType: 'manual',
      paymentMethod: transactionForm.paymentMethod as any,
      notes: transactionForm.notes
    });

    // تحديث الرصيد
    const newBalance = transactionForm.type === 'income' 
      ? currentBalance + amount 
      : currentBalance - amount;
    setCurrentBalance(newBalance);
    storage.setItem('currentBalance', newBalance);

    // ربط مع الأنظمة الأخرى
    linkWithOtherSystems(newTransaction);

    // إعادة تعيين النموذج
    setTransactionForm({
      type: 'income',
      amount: '',
      description: '',
      category: '',
      paymentMethod: 'cash',
      notes: ''
    });
    setIsDialogOpen(false);

    toast({
      title: "تم بنجاح",
      description: `تم ${transactionForm.type === 'income' ? 'إضافة' : 'خصم'} ${amount.toLocaleString()} جنيه`,
    });
  };

  const getCashFlowCategory = (category: string) => {
    const categoryMap: { [key: string]: any } = {
      'sales': 'sales',
      'services': 'other',
      'other_income': 'other',
      'operational': 'utilities',
      'rent': 'rent',
      'utilities': 'utilities',
      'supplies': 'other',
      'other_expense': 'other'
    };
    return categoryMap[category] || 'other';
  };

  const linkWithOtherSystems = (transaction: Transaction) => {
    try {
      // ربط مع المبيعات
      if (transaction.type === 'income' && transaction.category === 'sales') {
        const salesData = storage.getItem('sales_invoices', []);
        if (salesData.length > 0) {
          const lastInvoice = salesData[salesData.length - 1];
          lastInvoice.cashRegisterLinked = true;
          lastInvoice.cashTransactionId = transaction.id;
          storage.setItem('sales_invoices', salesData);
        }
      }

      // ربط مع المشتريات
      if (transaction.type === 'expense' && transaction.category === 'operational') {
        const purchaseData = storage.getItem('purchase_invoices', []);
        if (purchaseData.length > 0) {
          const lastInvoice = purchaseData[purchaseData.length - 1];
          lastInvoice.cashRegisterLinked = true;
          lastInvoice.cashTransactionId = transaction.id;
          storage.setItem('purchase_invoices', purchaseData);
        }
      }

      // ربط مع المخزون
      inventoryManager.addMovement({
        productId: 'CASH_FLOW',
        productName: 'حركة نقدية',
        code: 'CASH',
        type: transaction.type === 'income' ? 'in' : 'out',
        quantity: 1,
        date: new Date().toISOString(),
        reason: transaction.description,
        value: transaction.amount,
        referenceType: 'adjustment',
        notes: `ربط الصندوق - ${transaction.category}`
      });
    } catch (error) {
      console.error('خطأ في ربط الأنظمة:', error);
    }
  };

  // فلترة المعاملات
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
    const matchesDateRange = transaction.date >= dateRange.from && transaction.date <= dateRange.to;
    
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  // إحصائيات
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netFlow = totalIncome - totalExpenses;

  // بيانات اليوم
  const todayTransactions = transactions.filter(
    t => t.date.toDateString() === new Date().toDateString()
  );

  const todayIncome = todayTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpenses = todayTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // بيانات الرسوم البيانية
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayTransactions = transactions.filter(
      t => t.date.toDateString() === date.toDateString()
    );
    
    const dayIncome = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const dayExpenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    chartData.push({
      date: format(date, 'dd/MM'),
      income: dayIncome,
      expenses: dayExpenses,
      net: dayIncome - dayExpenses
    });
  }

  // بيانات فئات المصروفات
  const categoryData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: { [key: string]: number }, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name: getCategoryDisplayName(name),
    value,
    percentage: ((value / totalExpenses) * 100).toFixed(1)
  }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryDisplayName = (category: string) => {
    const displayNames: { [key: string]: string } = {
      'sales': 'مبيعات',
      'services': 'خدمات',
      'other_income': 'دخل آخر',
      'operational': 'مصاريف تشغيلية',
      'rent': 'إيجار',
      'utilities': 'فواتير',
      'supplies': 'مواد',
      'other_expense': 'مصروف آخر'
    };
    return displayNames[category] || category;
  };

  const exportData = () => {
    const csvData = filteredTransactions.map(t => ({
      'التاريخ': format(t.date, 'yyyy-MM-dd HH:mm'),
      'النوع': t.type === 'income' ? 'دخل' : 'مصروف',
      'المبلغ': t.amount,
      'الوصف': t.description,
      'الفئة': getCategoryDisplayName(t.category),
      'طريقة الدفع': t.paymentMethod || 'نقدي',
      'ملاحظات': t.notes || ''
    }));

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(csvData[0] || {}).join(",") + "\n" +
      csvData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cash_register_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "تم التصدير",
      description: "تم تصدير البيانات بنجاح",
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-mada-heading text-foreground">مركز إدارة الصندوق</h1>
          <p className="text-muted-foreground mt-1">
            إدارة شاملة للتدفق النقدي والمعاملات المالية
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={syncWithCashFlowManager}
            disabled={isLoading}
            className="gap-2 font-cairo"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            مزامنة
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-cairo">
                <Plus className="h-4 w-4" />
                عملية جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة عملية مالية جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع العملية</Label>
                    <Select
                      value={transactionForm.type}
                      onValueChange={(value: 'income' | 'expense') =>
                        setTransactionForm({ ...transactionForm, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">دخل 💰</SelectItem>
                        <SelectItem value="expense">مصروف 💸</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>طريقة الدفع</Label>
                    <Select
                      value={transactionForm.paymentMethod}
                      onValueChange={(value) =>
                        setTransactionForm({ ...transactionForm, paymentMethod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="bank">بنكي</SelectItem>
                        <SelectItem value="credit">بطاقة ائتمان</SelectItem>
                        <SelectItem value="check">شيك</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>المبلغ (جنيه)</Label>
                  <Input
                    type="number"
                    value={transactionForm.amount}
                    onChange={(e) =>
                      setTransactionForm({ ...transactionForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Input
                    value={transactionForm.description}
                    onChange={(e) =>
                      setTransactionForm({ ...transactionForm, description: e.target.value })
                    }
                    placeholder="وصف تفصيلي للعملية"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الفئة</Label>
                  <Select
                    value={transactionForm.category}
                    onValueChange={(value) =>
                      setTransactionForm({ ...transactionForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {transactionForm.type === 'income' ? (
                        <>
                          <SelectItem value="sales">مبيعات 🛒</SelectItem>
                          <SelectItem value="services">خدمات 🔧</SelectItem>
                          <SelectItem value="other_income">دخل آخر ➕</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="operational">مصاريف تشغيلية ⚙️</SelectItem>
                          <SelectItem value="rent">إيجار 🏢</SelectItem>
                          <SelectItem value="utilities">فواتير ⚡</SelectItem>
                          <SelectItem value="supplies">مواد 📦</SelectItem>
                          <SelectItem value="other_expense">مصروف آخر ➖</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات (اختياري)</Label>
                  <Input
                    value={transactionForm.notes}
                    onChange={(e) =>
                      setTransactionForm({ ...transactionForm, notes: e.target.value })
                    }
                    placeholder="ملاحظات إضافية"
                  />
                </div>

                <Button onClick={handleAddTransaction} className="w-full" size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة العملية
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* بطاقات الملخص السريع */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">الرصيد الحالي</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-tajawal ${currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(currentBalance).replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9')}
            </div>
            <div className="flex items-center text-xs mt-1">
              {currentBalance >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              )}
              <span className={`font-tajawal ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentBalance >= 0 ? 'رصيد إيجابي' : 'تحذير: رصيد سالب'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">دخل اليوم</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 font-tajawal">
              {formatCurrency(todayIncome).replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9')}
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-tajawal">
              {todayTransactions.filter(t => t.type === 'income').length} عملية
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">مصاريف اليوم</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 font-tajawal">
              {formatCurrency(todayExpenses).replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9')}
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-tajawal">
              {todayTransactions.filter(t => t.type === 'expense').length} عملية
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">صافي اليوم</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-tajawal ${
              (todayIncome - todayExpenses) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(todayIncome - todayExpenses).replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9')}
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-tajawal">
              {(todayIncome - todayExpenses) >= 0 ? 'ربح' : 'خسارة'} صافية
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <History className="h-4 w-4" />
              المعاملات
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              التقارير
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <PieChart className="h-4 w-4" />
              التحليلات
            </TabsTrigger>
          </TabsList>
        </div>

        {/* تبويب النظرة العامة */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* رسم التدفق النقدي */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <TrendingUp className="h-5 w-5" />
                  التدفق النقدي - آخر 7 أيام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(label) => `التاريخ: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stackId="1" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                      name="الإيرادات"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stackId="2" 
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.6}
                      name="المصروفات"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* توزيع المصروفات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <PieChart className="h-5 w-5" />
                  توزيع المصروفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-cairo">ملخص الفترة الحالية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-tajawal">
                <div className="flex justify-between">
                  <span>إجمالي الدخل:</span>
                  <span className="font-bold text-green-600">{formatCurrency(totalIncome).replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9')}</span>
                </div>
                <div className="flex justify-between">
                  <span>إجمالي المصروفات:</span>
                  <span className="font-bold text-red-600">{formatCurrency(totalExpenses).replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9')}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">صافي التدفق:</span>
                    <span className={`font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netFlow).replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-cairo">معدل العمليات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-tajawal">
                <div className="flex justify-between">
                  <span>عمليات اليوم:</span>
                  <span className="font-bold">{todayTransactions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>إجمالي العمليات:</span>
                  <span className="font-bold">{transactions.length}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">متوسط المبلغ:</span>
                    <span className="font-bold">
                      {formatCurrency(transactions.length > 0 ? 
                        transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0
                      ).replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-cairo">
                  <AlertTriangle className="h-5 w-5" />
                  تنبيهات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-tajawal">
                {currentBalance < 1000 && (
                  <div className="p-2 bg-red-50 text-red-800 rounded text-sm">
                    تحذير: الرصيد منخفض
                  </div>
                )}
                {todayExpenses > todayIncome && (
                  <div className="p-2 bg-yellow-50 text-yellow-800 rounded text-sm">
                    تنبيه: مصروفات اليوم تتجاوز الدخل
                  </div>
                )}
                {todayTransactions.length === 0 && (
                  <div className="p-2 bg-blue-50 text-blue-800 rounded text-sm">
                    لم تتم أي عملية اليوم
                  </div>
                )}
                {currentBalance >= 1000 && todayIncome >= todayExpenses && todayTransactions.length > 0 && (
                  <div className="p-2 bg-green-50 text-green-800 rounded text-sm">
                    ✅ الوضع المالي جيد
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب المعاملات */}
        <TabsContent value="transactions" className="space-y-6">
          {/* أدوات الفلترة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-cairo">
                <Filter className="h-5 w-5" />
                فلترة وبحث المعاملات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label className="font-tajawal">بحث</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث في الوصف أو الفئة..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 font-tajawal"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-tajawal">الفئة</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="font-tajawal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="font-tajawal">
                      <SelectItem value="all">جميع الفئات</SelectItem>
                      <SelectItem value="sales">مبيعات</SelectItem>
                      <SelectItem value="services">خدمات</SelectItem>
                      <SelectItem value="operational">مصاريف تشغيلية</SelectItem>
                      <SelectItem value="rent">إيجار</SelectItem>
                      <SelectItem value="utilities">فواتير</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-tajawal">الفترة</Label>
                  <Select 
                    value="custom" 
                    onValueChange={(value) => {
                      const now = new Date();
                      switch(value) {
                        case 'today':
                          setDateRange({ from: now, to: now });
                          break;
                        case 'thisMonth':
                          setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
                          break;
                        case 'thisYear':
                          setDateRange({ from: startOfYear(now), to: endOfYear(now) });
                          break;
                      }
                    }}
                  >
                    <SelectTrigger className="font-tajawal">
                      <SelectValue placeholder="اختر الفترة" />
                    </SelectTrigger>
                    <SelectContent className="font-tajawal">
                      <SelectItem value="today">اليوم</SelectItem>
                      <SelectItem value="thisMonth">هذا الشهر</SelectItem>
                      <SelectItem value="thisYear">هذا العام</SelectItem>
                      <SelectItem value="custom">فترة مخصصة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-tajawal">تصدير</Label>
                  <Button onClick={exportData} variant="outline" className="w-full gap-2 font-tajawal">
                    <Download className="h-4 w-4" />
                    تصدير CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* قائمة المعاملات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  المعاملات ({filteredTransactions.length})
                </span>
                <Badge variant="outline">
                  صافي: {formatCurrency(netFlow)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                          : 'bg-red-100 text-red-600 dark:bg-red-900/20'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(transaction.date, 'yyyy/MM/dd HH:mm')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryDisplayName(transaction.category)}
                          </Badge>
                          {transaction.paymentMethod && (
                            <Badge variant="secondary" className="text-xs">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {transaction.paymentMethod}
                            </Badge>
                          )}
                        </div>
                        {transaction.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📝 {transaction.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                      {transaction.referenceId && (
                        <div className="text-xs text-muted-foreground">
                          <Eye className="h-3 w-3 inline mr-1" />
                          مرجع: {transaction.referenceId.slice(-6)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد معاملات مطابقة للفلاتر المحددة</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التقارير */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>تقرير الأداء المالي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>معدل الدخل اليومي:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(totalIncome / 30)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>معدل المصروفات اليومي:</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(totalExpenses / 30)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span>نسبة الربحية:</span>
                      <span className={`font-bold ${
                        totalIncome > 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {totalIncome > 0 ? 
                          ((netFlow / totalIncome) * 100).toFixed(1) + '%' : 
                          '0%'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>مؤشر الأداء العام</Label>
                  <Progress 
                    value={Math.max(0, Math.min(100, (netFlow / Math.max(totalIncome, 1)) * 100 + 50))} 
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>ضعيف</span>
                    <span>متوسط</span>
                    <span>ممتاز</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تحليل النشاط</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {transactions.filter(t => t.type === 'income').length}
                      </div>
                      <div className="text-sm text-blue-600">عمليات دخل</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {transactions.filter(t => t.type === 'expense').length}
                      </div>
                      <div className="text-sm text-red-600">عمليات مصروف</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>أكبر عملية دخل:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(Math.max(...transactions.filter(t => t.type === 'income').map(t => t.amount), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>أكبر عملية مصروف:</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(Math.max(...transactions.filter(t => t.type === 'expense').map(t => t.amount), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب التحليلات */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  مقارنة الدخل والمصروفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(label) => `التاريخ: ${label}`}
                    />
                    <Bar dataKey="income" fill="#10b981" name="الدخل" />
                    <Bar dataKey="expenses" fill="#ef4444" name="المصروفات" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات متقدمة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-blue-600">متوسط العملية</div>
                          <div className="text-lg font-bold text-blue-700">
                            {formatCurrency(
                              transactions.length > 0 ? 
                              transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0
                            )}
                          </div>
                        </div>
                        <Calculator className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-green-600">أفضل يوم</div>
                          <div className="text-lg font-bold text-green-700">
                            {formatCurrency(Math.max(...chartData.map(d => d.net)))}
                          </div>
                        </div>
                        <Zap className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>نسبة المبيعات من إجمالي الدخل</span>
                        <span className="font-medium">
                          {totalIncome > 0 ? 
                            ((transactions.filter(t => t.category === 'sales').reduce((sum, t) => sum + t.amount, 0) / totalIncome) * 100).toFixed(1) + '%' :
                            '0%'
                          }
                        </span>
                      </div>
                      <Progress 
                        value={totalIncome > 0 ? 
                          (transactions.filter(t => t.category === 'sales').reduce((sum, t) => sum + t.amount, 0) / totalIncome) * 100 : 0
                        } 
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>نسبة المصاريف التشغيلية</span>
                        <span className="font-medium">
                          {totalExpenses > 0 ? 
                            ((transactions.filter(t => t.category === 'operational').reduce((sum, t) => sum + t.amount, 0) / totalExpenses) * 100).toFixed(1) + '%' :
                            '0%'
                          }
                        </span>
                      </div>
                      <Progress 
                        value={totalExpenses > 0 ? 
                          (transactions.filter(t => t.category === 'operational').reduce((sum, t) => sum + t.amount, 0) / totalExpenses) * 100 : 0
                        } 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>توصيات ذكية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {netFlow < 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="font-medium text-red-800 mb-2">🚨 تحسين التدفق النقدي</div>
                        <div className="text-sm text-red-600">
                          يُنصح بمراجعة المصروفات وزيادة الإيرادات لتحسين التدفق النقدي.
                        </div>
                      </div>
                    )}

                    {currentBalance < 5000 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-yellow-800 mb-2">⚠️ بناء احتياطي نقدي</div>
                        <div className="text-sm text-yellow-600">
                          يُنصح ببناء احتياطي نقدي لا يقل عن 10,000 جنيه لضمان السيولة.
                        </div>
                      </div>
                    )}

                    {transactions.filter(t => t.type === 'expense' && t.category === 'operational').reduce((sum, t) => sum + t.amount, 0) / totalExpenses > 0.5 && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="font-medium text-orange-800 mb-2">📊 تحسين المصاريف</div>
                        <div className="text-sm text-orange-600">
                          المصاريف التشغيلية تشكل نسبة كبيرة. يمكن البحث عن طرق لتوفير التكاليف.
                        </div>
                      </div>
                    )}

                    {netFlow > 0 && currentBalance > 10000 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-medium text-green-800 mb-2">✅ أداء ممتاز</div>
                        <div className="text-sm text-green-600">
                          التدفق النقدي إيجابي والرصيد جيد. يمكن التفكير في الاستثمار أو التوسع.
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}