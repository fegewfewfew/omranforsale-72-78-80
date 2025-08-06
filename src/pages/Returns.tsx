import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, RotateCcw, AlertCircle, CheckCircle, Package, Receipt, Calendar, Printer, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { returnsManager, Return as ReturnManagerType } from "@/utils/returnsManager";
import { ReturnsAnalytics } from "@/components/inventory/ReturnsAnalytics";
import { ReturnsSmartAlerts } from "@/components/inventory/ReturnsSmartAlerts";
import { ReturnsPrintManager } from "@/components/inventory/ReturnsPrintManager";

interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  reason: string;
}

// Use the Return type from returnsManager
type Return = ReturnManagerType;

export default function Returns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [isNewReturnOpen, setIsNewReturnOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [returnToPrint, setReturnToPrint] = useState<Return | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    // Load returns using returnsManager
    setReturns(returnsManager.getReturns());
  }, []);

  // Form states for new return
  const [newReturn, setNewReturn] = useState({
    customerName: "",
    originalInvoiceNumber: "",
    reason: "",
    notes: "",
    items: [] as ReturnItem[]
  });

  // Remove this useEffect as we're using returnsManager now

  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = 
      returnItem.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.originalInvoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || returnItem.status === statusFilter;
    const matchesDate = !dateFilter || returnItem.date.startsWith(dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleCreateReturn = () => {
    if (!newReturn.customerName || !newReturn.originalInvoiceNumber || !newReturn.reason || newReturn.items.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة وإضافة عنصر واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = newReturn.items.reduce((sum, item) => sum + item.total, 0);
    
    const returnData = {
      customerName: newReturn.customerName,
      originalInvoiceNumber: newReturn.originalInvoiceNumber,
      date: format(new Date(), 'yyyy-MM-dd'),
      items: newReturn.items,
      totalAmount,
      reason: newReturn.reason,
      notes: newReturn.notes,
    };

    // Create a temporary return object for validation
    const tempReturn: ReturnManagerType = {
      ...returnData,
      id: 'temp',
      returnNumber: 'temp',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // Validate return before creating
    const validation = returnsManager.validateReturnAgainstInvoice(tempReturn);
    
    if (!validation.valid) {
      toast({
        title: "خطأ في التحقق",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    // Use returnsManager to add return
    const success = returnsManager.addReturn(returnData);
    
    if (success) {
      setReturns(returnsManager.getReturns());
      setNewReturn({
        customerName: "",
        originalInvoiceNumber: "",
        reason: "",
        notes: "",
        items: []
      });
      setIsNewReturnOpen(false);

      toast({
        title: "تم إنشاء المرتجع",
        description: "تم إنشاء المرتجع بنجاح والتحقق من صحة البيانات",
      });
    } else {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء المرتجع",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = (returnId: string, newStatus: Return['status']) => {
    // Use returnsManager to update status
    returnsManager.updateReturnStatus(returnId, newStatus, 'المستخدم الحالي');
    setReturns(returnsManager.getReturns());

    toast({
      title: "تم تحديث الحالة",
      description: "تم تحديث حالة المرتجع بنجاح",
    });
  };

  const addReturnItem = () => {
    const newItem: ReturnItem = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
      reason: ""
    };
    setNewReturn(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateReturnItem = (index: number, field: keyof ReturnItem, value: any) => {
    setNewReturn(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeReturnItem = (index: number) => {
    setNewReturn(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const getStatusBadge = (status: Return['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />في الانتظار</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />موافق عليه</Badge>;
      case 'processed':
        return <Badge variant="outline" className="gap-1 text-green-600 border-green-600"><Package className="h-3 w-3" />تم المعالجة</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1">مرفوض</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalReturns = returns.length;
  const pendingReturns = returns.filter(r => r.status === 'pending').length;
  const processedReturns = returns.filter(r => r.status === 'processed').length;
  const totalAmount = filteredReturns.reduce((sum, r) => sum + r.totalAmount, 0);

  const handlePrintReturn = (returnData: Return) => {
    setReturnToPrint(returnData);
    setIsPrintDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <RotateCcw className="h-6 w-6" />
            إدارة المرتجعات المتطورة
          </h1>
          <p className="text-muted-foreground">إدارة ذكية لجميع عمليات إرجاع المنتجات مع التحليلات والتنبيهات</p>
        </div>
        <Dialog open={isNewReturnOpen} onOpenChange={setIsNewReturnOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء مرتجع جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء مرتجع جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل المرتجع الجديد
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">اسم العميل</Label>
                <Input
                  id="customerName"
                  value={newReturn.customerName}
                  onChange={(e) => setNewReturn(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="اسم العميل"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalInvoice">رقم الفاتورة الأصلية</Label>
                <Input
                  id="originalInvoice"
                  value={newReturn.originalInvoiceNumber}
                  onChange={(e) => setNewReturn(prev => ({ ...prev, originalInvoiceNumber: e.target.value }))}
                  placeholder="رقم الفاتورة"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">سبب الإرجاع</Label>
              <Select onValueChange={(value) => setNewReturn(prev => ({ ...prev, reason: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر سبب الإرجاع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defective">منتج معيب</SelectItem>
                  <SelectItem value="wrong_item">منتج خطأ</SelectItem>
                  <SelectItem value="damaged">منتج تالف</SelectItem>
                  <SelectItem value="customer_change">تغيير رأي العميل</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={newReturn.notes}
                onChange={(e) => setNewReturn(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="ملاحظات إضافية"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>العناصر المرتجعة</Label>
                <Button type="button" variant="outline" size="sm" onClick={addReturnItem}>
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة عنصر
                </Button>
              </div>

              {newReturn.items.map((item, index) => (
                <Card key={item.id} className="p-4">
                  <div className="grid grid-cols-6 gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">اسم المنتج</Label>
                      <Input
                        value={item.productName}
                        onChange={(e) => updateReturnItem(index, 'productName', e.target.value)}
                        placeholder="اسم المنتج"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الكمية</Label>
                      <Input
                        type="number"
                        value={item.quantity.toString()}
                        onChange={(e) => updateReturnItem(index, 'quantity', Number(e.target.value) || 0)}
                        placeholder="الكمية"
                        min="1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">السعر</Label>
                      <Input
                        type="number"
                        value={item.unitPrice.toString()}
                        onChange={(e) => updateReturnItem(index, 'unitPrice', Number(e.target.value) || 0)}
                        placeholder="السعر"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">المجموع</Label>
                      <Input
                        value={item.total.toFixed(2)}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">السبب</Label>
                      <Input
                        value={item.reason}
                        onChange={(e) => updateReturnItem(index, 'reason', e.target.value)}
                        placeholder="سبب الإرجاع"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeReturnItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      حذف
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewReturnOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateReturn}>
                إنشاء المرتجع
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            التحليلات
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            التنبيهات الذكية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Smart Alerts Summary */}
          <ReturnsSmartAlerts />

          {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المرتجعات</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReturns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">في الانتظار</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingReturns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تم المعالجة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{processedReturns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القيمة</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString()} ر.س</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في المرتجعات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="approved">موافق عليه</SelectItem>
                <SelectItem value="processed">تم المعالجة</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[180px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المرتجعات</CardTitle>
          <CardDescription>
            جميع عمليات الإرجاع مع تفاصيلها وحالاتها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم المرتجع</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>الفاتورة الأصلية</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>السبب</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReturns.map((returnItem) => (
                <TableRow key={returnItem.id}>
                  <TableCell className="font-medium">{returnItem.returnNumber}</TableCell>
                  <TableCell>{returnItem.customerName}</TableCell>
                  <TableCell>{returnItem.originalInvoiceNumber}</TableCell>
                  <TableCell>
                    {format(new Date(returnItem.date), 'dd/MM/yyyy', { locale: ar })}
                  </TableCell>
                  <TableCell>{returnItem.totalAmount.toLocaleString()} ر.س</TableCell>
                  <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                  <TableCell>{returnItem.reason}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {returnItem.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(returnItem.id, 'approved')}
                          >
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(returnItem.id, 'rejected')}
                          >
                            رفض
                          </Button>
                        </>
                      )}
                      {returnItem.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(returnItem.id, 'processed')}
                        >
                          تمت المعالجة
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReturn(returnItem)}
                      >
                        عرض
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintReturn(returnItem)}
                        className="gap-1"
                      >
                        <Printer className="h-3 w-3" />
                        طباعة
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <ReturnsAnalytics />
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>التنبيهات الذكية المفصلة</CardTitle>
              <CardDescription>
                تنبيهات متقدمة لمساعدتك في تحسين إدارة المرتجعات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReturnsSmartAlerts />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Return Details Dialog */}
      {selectedReturn && (
        <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>تفاصيل المرتجع - {selectedReturn.returnNumber}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">العميل</Label>
                  <p className="text-sm text-muted-foreground">{selectedReturn.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">الفاتورة الأصلية</Label>
                  <p className="text-sm text-muted-foreground">{selectedReturn.originalInvoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">التاريخ</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedReturn.date), 'dd/MM/yyyy', { locale: ar })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">الحالة</Label>
                  <div className="mt-1">{getStatusBadge(selectedReturn.status)}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">سبب الإرجاع</Label>
                <p className="text-sm text-muted-foreground">{selectedReturn.reason}</p>
              </div>

              {selectedReturn.notes && (
                <div>
                  <Label className="text-sm font-medium">ملاحظات</Label>
                  <p className="text-sm text-muted-foreground">{selectedReturn.notes}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">العناصر المرتجعة</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>المجموع</TableHead>
                      <TableHead>السبب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedReturn.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unitPrice.toFixed(2)} ر.س</TableCell>
                        <TableCell>{item.total.toFixed(2)} ر.س</TableCell>
                        <TableCell>{item.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-medium">المجموع الكلي:</span>
                <span className="text-lg font-bold">{selectedReturn.totalAmount.toLocaleString()} ر.س</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReturn(null)}>
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Print Manager Dialog */}
      {returnToPrint && (
        <ReturnsPrintManager
          returnData={returnToPrint}
          isOpen={isPrintDialogOpen}
          onClose={() => {
            setIsPrintDialogOpen(false);
            setReturnToPrint(null);
          }}
        />
      )}
    </div>
  );
}