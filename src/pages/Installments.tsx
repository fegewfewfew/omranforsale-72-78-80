import { useState, useEffect } from "react";
import { Plus, Search, Calendar, DollarSign, FileText, Trash2, Edit, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { installmentsManager } from "@/utils/installmentsManager";

interface Installment {
  id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installmentAmount: number;
  startDate: string;
  dueDate: string;
  status: 'active' | 'completed' | 'overdue' | 'cancelled';
  notes?: string;
  paymentHistory: PaymentRecord[];
}

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export default function Installments() {
  const { toast } = useToast();
  const [installments, setInstallments] = useState<Installment[]>([]);

  useEffect(() => {
    // Load installments using installmentsManager
    setInstallments(installmentsManager.getInstallments());
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    totalAmount: "",
    installmentAmount: "",
    startDate: "",
    notes: ""
  });

  const [paymentData, setPaymentData] = useState({
    amount: "",
    notes: ""
  });

  const handleAddInstallment = () => {
    if (!formData.customerName || !formData.customerPhone || !formData.totalAmount || !formData.installmentAmount || !formData.startDate) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const totalAmount = parseFloat(formData.totalAmount);
    const installmentAmount = parseFloat(formData.installmentAmount);
    
    const installmentData = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      totalAmount,
      installmentAmount,
      installmentPeriod: 12, // Default period
      startDate: formData.startDate,
      dueDate: formData.startDate,
      notes: formData.notes,
    };

    if (editingInstallment) {
      // Use installmentsManager for updating
      installmentsManager.updateInstallment(editingInstallment.id, installmentData);
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات القسط بنجاح"
      });
    } else {
      // Use installmentsManager for adding
      installmentsManager.addInstallment(installmentData);
      toast({
        title: "تم الإضافة",
        description: "تم إضافة القسط بنجاح"
      });
    }
    
    setInstallments(installmentsManager.getInstallments());

    resetForm();
  };

  const handleAddPayment = () => {
    if (!selectedInstallment || !paymentData.amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء مبلغ الدفع",
        variant: "destructive"
      });
      return;
    }

    const paymentAmount = parseFloat(paymentData.amount);
    
    if (paymentAmount > selectedInstallment.remainingAmount) {
      toast({
        title: "خطأ",
        description: "مبلغ الدفع أكبر من المبلغ المتبقي",
        variant: "destructive"
      });
      return;
    }

    const newPaymentData = {
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      notes: paymentData.notes,
      paymentMethod: 'cash' as const
    };

    // Use installmentsManager for adding payment
    installmentsManager.addPayment(selectedInstallment.id, newPaymentData);
    setInstallments(installmentsManager.getInstallments());

    toast({
      title: "تم التسجيل",
      description: "تم تسجيل الدفعة بنجاح"
    });

    setPaymentData({ amount: "", notes: "" });
    setIsPaymentDialogOpen(false);
    setSelectedInstallment(null);
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerPhone: "",
      totalAmount: "",
      installmentAmount: "",
      startDate: "",
      notes: ""
    });
    setEditingInstallment(null);
    setIsDialogOpen(false);
  };

  const handleEditInstallment = (installment: Installment) => {
    setEditingInstallment(installment);
    setFormData({
      customerName: installment.customerName,
      customerPhone: installment.customerPhone,
      totalAmount: installment.totalAmount.toString(),
      installmentAmount: installment.installmentAmount.toString(),
      startDate: installment.startDate,
      notes: installment.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDeleteInstallment = (id: string) => {
    // Use installmentsManager for deletion
    installmentsManager.deleteInstallment(id);
    setInstallments(installmentsManager.getInstallments());
    toast({
      title: "تم الحذف",
      description: "تم حذف القسط بنجاح"
    });
  };

  const openPaymentDialog = (installment: Installment) => {
    setSelectedInstallment(installment);
    setPaymentData({ amount: installment.installmentAmount.toString(), notes: "" });
    setIsPaymentDialogOpen(true);
  };

  const filteredInstallments = installments.filter(installment => {
    const matchesSearch = installment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         installment.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || installment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = installments.reduce((sum, installment) => sum + installment.totalAmount, 0);
  const totalPaid = installments.reduce((sum, installment) => sum + installment.paidAmount, 0);
  const totalRemaining = installments.reduce((sum, installment) => sum + installment.remainingAmount, 0);
  const overdueCount = installments.filter(i => i.status === 'overdue').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary">نشط</Badge>;
      case 'completed':
        return <Badge variant="default">مكتمل</Badge>;
      case 'overdue':
        return <Badge variant="destructive">متأخر</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mada-heading">الأقساط</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingInstallment(null)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة قسط جديد
            </Button>
          </DialogTrigger>
           <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingInstallment ? "تعديل القسط" : "إضافة قسط جديد"}</DialogTitle>
              <DialogDescription>
                {editingInstallment ? "تعديل بيانات القسط" : "أدخل تفاصيل القسط الجديد"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="customerName">اسم العميل *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  placeholder="اسم العميل"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customerPhone">رقم الهاتف *</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  placeholder="05xxxxxxxx"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="totalAmount">المبلغ الإجمالي *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="installmentAmount">مبلغ القسط *</Label>
                <Input
                  id="installmentAmount"
                  type="number"
                  value={formData.installmentAmount}
                  onChange={(e) => setFormData({...formData, installmentAmount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startDate">تاريخ البداية *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="ملاحظات إضافية"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>إلغاء</Button>
              <Button onClick={handleAddInstallment}>
                {editingInstallment ? "تحديث" : "إضافة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبالغ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبالغ المحصلة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبالغ المتبقية</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalRemaining.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأقساط المتأخرة</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث بالاسم أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="overdue">متأخر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Installments Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأقساط</CardTitle>
          <CardDescription>
            عرض جميع الأقساط ({filteredInstallments.length} قسط)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>المبلغ المدفوع</TableHead>
                <TableHead>المبلغ المتبقي</TableHead>
                <TableHead>قيمة القسط</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstallments.map((installment) => (
                <TableRow key={installment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{installment.customerName}</div>
                      <div className="text-sm text-muted-foreground">{installment.customerPhone}</div>
                    </div>
                  </TableCell>
                   <TableCell className="font-medium">{installment.totalAmount.toLocaleString()} ج.م</TableCell>
                   <TableCell className="text-green-600">{installment.paidAmount.toLocaleString()} ج.م</TableCell>
                   <TableCell className="text-amber-600">{installment.remainingAmount.toLocaleString()} ج.م</TableCell>
                   <TableCell>{installment.installmentAmount.toLocaleString()} ج.م</TableCell>
                  <TableCell>{getStatusBadge(installment.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {installment.status !== 'completed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openPaymentDialog(installment)}
                        >
                          دفع
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditInstallment(installment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteInstallment(installment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
            <DialogDescription>
              تسجيل دفعة جديدة للعميل {selectedInstallment?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>المبلغ المتبقي: {selectedInstallment?.remainingAmount.toLocaleString()} ج.م</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentAmount">مبلغ الدفع *</Label>
              <Input
                id="paymentAmount"
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                placeholder="0.00"
                max={selectedInstallment?.remainingAmount}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentNotes">ملاحظات</Label>
              <Textarea
                id="paymentNotes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                placeholder="ملاحظات على الدفعة"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddPayment}>تسجيل الدفعة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}