import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  CalendarIcon,
  FileText,
  DollarSign,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { inventoryManager } from "@/utils/inventoryUtils";
import { businessIntegration } from "@/utils/businessIntegration";
import { storage } from "@/utils/storage";

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplier: string;
  date: Date;
  dueDate: Date;
  total: number;
  status: "pending" | "paid" | "overdue" | "cancelled";
  items: number;
  investorCode?: string;
  notes?: string;
}

const mockInvoices: PurchaseInvoice[] = [];

export default function PurchaseInvoices() {
  // جلب الموردين المسجلين من قاعدة البيانات
  const [suppliers, setSuppliers] = useState<string[]>(() => {
    const savedSuppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    return savedSuppliers.map((supplier: any) => supplier.name || supplier);
  });
  
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(() => {
    const saved = localStorage.getItem('purchase_invoices');
    return saved ? JSON.parse(saved) : [];
  });
  const [deletedInvoices, setDeletedInvoices] = useState<PurchaseInvoice[]>(() => {
    const saved = localStorage.getItem('deleted_purchase_invoices');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState({
    supplier: "",
    productName: "",
    category: "",
    quantity: 0,
    paymentType: "cash",
    paidAmount: 0,
    date: new Date(),
    dueDate: new Date(),
    total: 0,
    items: 0,
    notes: ""
  });
  const { toast } = useToast();

  // Form state for new invoice
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: "",
    supplier: "",
    productName: "",
    category: "",
    quantity: 0,
    paymentType: "cash", // "cash" للعاجل أو "credit" للآجل
    paidAmount: 0,
    date: new Date(),
    dueDate: new Date(),
    total: 0,
    items: 0,
    investorCode: "",
    notes: ""
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: "default",
      pending: "secondary", 
      overdue: "destructive",
      cancelled: "outline"
    };
    
    const labels = {
      paid: "مدفوعة",
      pending: "معلقة",
      overdue: "متأخرة",
      cancelled: "ملغية"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const handleAddInvoice = () => {
    if (!newInvoice.supplier || !newInvoice.productName || !newInvoice.quantity || !newInvoice.total) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const invoice: PurchaseInvoice = {
      id: Date.now().toString(),
      invoiceNumber: `PI-2024-${String(invoices.length + 1).padStart(3, '0')}`,
      supplier: newInvoice.supplier,
      date: newInvoice.date,
      dueDate: newInvoice.dueDate,
      total: newInvoice.total,
      status: newInvoice.paymentType === "cash" ? "paid" : "pending",
      items: newInvoice.items,
      notes: newInvoice.notes
    };

    // إنشاء أو العثور على المنتج
    const products = inventoryManager.getProducts();
    let productId = newInvoice.productName;
    
    // البحث عن المنتج الموجود
    const existingProduct = products.find(p => p.name === newInvoice.productName);
    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      // إنشاء منتج جديد إذا لم يكن موجوداً
      const newProduct = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: newInvoice.productName,
        code: `${newInvoice.category}-${Date.now()}`,
        category: newInvoice.category || 'عام',
        cost: newInvoice.total / newInvoice.quantity,
        price: (newInvoice.total / newInvoice.quantity) * 1.2, // 20% markup
        stock: 0,
        minStock: 5,
        status: 'active' as const,
        description: `منتج من فاتورة شراء ${invoice.invoiceNumber}`,
        ownerType: 'company' as const
      };
      
      const updatedProducts = [...products, newProduct];
      storage.setItem('products', updatedProducts);
      productId = newProduct.id;
    }

    // إنشاء فاتورة الشراء المتكاملة لنظام المخزون
    const integratedPurchaseInvoice = {
      id: invoice.id,
      supplier: invoice.supplier,
      date: invoice.date.toISOString(),
      items: [{
        id: Date.now().toString(),
        productId: productId,
        productName: newInvoice.productName,
        productCode: existingProduct?.code || `${newInvoice.category}-${Date.now()}`,
        quantity: newInvoice.quantity,
        cost: newInvoice.total / newInvoice.quantity,
        total: newInvoice.total
      }],
      total: newInvoice.total,
      status: invoice.status === "paid" ? "paid" as const : "pending" as const
    };

    // معالجة الفاتورة عبر نظام التكامل
    let success = true;
    try {
      success = businessIntegration.processPurchaseInvoice(integratedPurchaseInvoice);
    } catch (error) {
      console.error('Error processing purchase invoice:', error);
      success = false;
    }
    
    if (success) {
      // حفظ الفاتورة
      const updatedInvoices = [...invoices, invoice];
      setInvoices(updatedInvoices);
      localStorage.setItem('purchase_invoices', JSON.stringify(updatedInvoices));
      
      // تحديث قائمة الموردين
      updateSuppliersList(newInvoice.supplier);
      
      // إضافة المنتج إلى المخزون إذا لم يكن موجوداً
      addProductToInventoryIfNotExists();
      
      // Sync inventory data after successful purchase
      inventoryManager.syncProductsWithStock();
      
      // إغلاق النافذة فوراً بعد النجاح
      setIsAddDialogOpen(false);
      
      // إعادة تعيين النموذج
      resetForm();
      
      toast({
        title: "تم إضافة الفاتورة",
        description: "تم إضافة فاتورة الشراء وتحديث المخزون بنجاح",
      });
    } else {
      toast({
        title: "خطأ",
        description: "فشل في معالجة فاتورة الشراء",
        variant: "destructive",
      });
    }
  };

  const updateSuppliersList = (supplierName: string) => {
    const existingSuppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    const supplierExists = existingSuppliers.find((s: any) => 
      (s.name && s.name === supplierName) || s === supplierName
    );
    
    if (!supplierExists) {
      const newSupplier = {
        id: Date.now().toString(),
        name: supplierName,
        phone: "",
        address: "",
        totalOrders: 1,
        totalSpent: newInvoice.total,
        lastOrderDate: new Date().toISOString()
      };
      existingSuppliers.push(newSupplier);
      localStorage.setItem('suppliers', JSON.stringify(existingSuppliers));
      
      // تحديث قائمة الموردين في الواجهة
      setSuppliers(prevSuppliers => [...prevSuppliers, supplierName]);
    }
  };

  const addProductToInventoryIfNotExists = () => {
    const products = inventoryManager.getProducts();
    const productExists = products.find(p => p.name === newInvoice.productName);
    
    if (!productExists) {
      const newProduct = {
        id: `PRD${Date.now()}`,
        name: newInvoice.productName,
        code: `${newInvoice.category}-${Date.now()}`,
        category: newInvoice.category || "غير محدد",
        price: (newInvoice.total / newInvoice.quantity) * 1.2, // هامش ربح 20%
        cost: newInvoice.total / newInvoice.quantity,
        stock: newInvoice.quantity,
        minStock: Math.max(1, Math.floor(newInvoice.quantity * 0.1)),
        description: `منتج مضاف من فاتورة شراء ${newInvoice.supplier}`,
        status: 'active' as const,
        ownerType: newInvoice.investorCode ? 'investor' as const : 'company' as const,
        ownerId: newInvoice.investorCode || undefined
      };
      
      const updatedProducts = [...products, newProduct];
      localStorage.setItem('products', JSON.stringify(updatedProducts));
    }
  };

  const resetForm = () => {
    setNewInvoice({
      invoiceNumber: "",
      supplier: "",
      productName: "",
      category: "",
      quantity: 0,
      paymentType: "cash",
      paidAmount: 0,
      date: new Date(),
      dueDate: new Date(),
      total: 0,
      items: 0,
      investorCode: "",
      notes: ""
    });
  };

  const handleDeleteInvoice = (id: string) => {
    const invoiceToDelete = invoices.find(invoice => invoice.id === id);
    if (invoiceToDelete) {
      const updatedDeletedInvoices = [...deletedInvoices, invoiceToDelete];
      setDeletedInvoices(updatedDeletedInvoices);
      localStorage.setItem('deleted_purchase_invoices', JSON.stringify(updatedDeletedInvoices));
    }
    const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
    setInvoices(updatedInvoices);
    localStorage.setItem('purchase_invoices', JSON.stringify(updatedInvoices));
    toast({
      title: "تم حذف الفاتورة",
      description: "تم حذف فاتورة الشراء بنجاح",
    });
  };

  const handleDeleteAllInvoices = () => {
    const updatedDeletedInvoices = [...deletedInvoices, ...invoices];
    setDeletedInvoices(updatedDeletedInvoices);
    localStorage.setItem('deleted_purchase_invoices', JSON.stringify(updatedDeletedInvoices));
    
    setInvoices([]);
    localStorage.removeItem('purchase_invoices');
    toast({
      title: "تم حذف جميع الفواتير",
      description: "تم حذف جميع الفواتير بنجاح",
    });
  };

  const handleRestoreInvoices = () => {
    const updatedInvoices = [...invoices, ...deletedInvoices];
    setInvoices(updatedInvoices);
    localStorage.setItem('purchase_invoices', JSON.stringify(updatedInvoices));
    
    setDeletedInvoices([]);
    localStorage.removeItem('deleted_purchase_invoices');
    toast({
      title: "تم استعادة الفواتير",
      description: "تم استعادة جميع الفواتير المحذوفة",
    });
  };

  const handleViewInvoice = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleEditInvoice = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    setEditInvoice({
      supplier: invoice.supplier,
      productName: "",
      category: "",
      quantity: 0,
      paymentType: "cash",
      paidAmount: 0,
      date: invoice.date,
      dueDate: invoice.dueDate,
      total: invoice.total,
      items: invoice.items,
      notes: invoice.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateInvoice = () => {
    if (!selectedInvoice) return;

    const updatedInvoice: PurchaseInvoice = {
      ...selectedInvoice,
      supplier: editInvoice.supplier,
      date: editInvoice.date,
      dueDate: editInvoice.dueDate,
      total: editInvoice.total,
      items: editInvoice.items,
      notes: editInvoice.notes
    };

    const updatedInvoices = invoices.map(invoice => 
      invoice.id === selectedInvoice.id ? updatedInvoice : invoice
    );
    setInvoices(updatedInvoices);
    localStorage.setItem('purchase_invoices', JSON.stringify(updatedInvoices));
    setIsEditDialogOpen(false);
    setSelectedInvoice(null);
    
    toast({
      title: "تم تحديث الفاتورة",
      description: "تم تحديث فاتورة الشراء بنجاح",
    });
  };

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === "paid").reduce((sum, invoice) => sum + invoice.total, 0);
  const pendingAmount = filteredInvoices.filter(inv => inv.status === "pending").reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground font-tajawal">فواتير الشراء</h1>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-cairo">
                <Plus className="ml-2 h-4 w-4" />
                إضافة فاتورة جديدة
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="shrink-0">
              <DialogTitle>إضافة فاتورة شراء جديدة</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">رقم الفاتورة</Label>
                  <Input
                    id="invoiceNumber"
                    value={`PI-2024-${String(invoices.length + 1).padStart(3, '0')}`}
                    readOnly
                    className="bg-muted"
                    placeholder="PI-2024-004"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplier">المورد</Label>
                  <Select 
                    value={newInvoice.supplier} 
                    onValueChange={(value) => {
                      if (value === "new_supplier") {
                        // إذا اختار "مورد جديد"، نظف الحقل ليتمكن من الكتابة
                        setNewInvoice({...newInvoice, supplier: ""});
                      } else {
                        setNewInvoice({...newInvoice, supplier: value});
                      }
                    }}
                  >
                    <SelectTrigger className="bg-background border border-input">
                      <SelectValue placeholder="اختر من الموردين المسجلين أو أدخل مورد جديد" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-input shadow-lg z-50">
                      {suppliers.length > 0 && (
                        <>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier} value={supplier} className="hover:bg-accent">
                              {supplier}
                            </SelectItem>
                          ))}
                          <SelectItem value="new_supplier" className="hover:bg-accent font-medium text-primary">
                            + إضافة مورد جديد
                          </SelectItem>
                        </>
                      )}
                      {suppliers.length === 0 && (
                        <SelectItem value="new_supplier" className="hover:bg-accent">
                          + إضافة مورد جديد
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* حقل إدخال مورد جديد */}
                  {(newInvoice.supplier === "" || !suppliers.includes(newInvoice.supplier)) && (
                    <Input
                      placeholder="أدخل اسم المورد الجديد"
                      value={newInvoice.supplier}
                      onChange={(e) => setNewInvoice({...newInvoice, supplier: e.target.value})}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investorCode">كود المستثمر</Label>
                  <Input
                    id="investorCode"
                    value={newInvoice.investorCode || ""}
                    onChange={(e) => setNewInvoice({...newInvoice, investorCode: e.target.value})}
                    placeholder="أدخل كود المستثمر (اختياري)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productName">اسم المنتج</Label>
                  <Input
                    id="productName"
                    value={newInvoice.productName}
                    onChange={(e) => setNewInvoice({...newInvoice, productName: e.target.value})}
                    placeholder="أدخل اسم المنتج"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">الكمية</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newInvoice.quantity || ''}
                    onChange={(e) => setNewInvoice({...newInvoice, quantity: Number(e.target.value)})}
                    placeholder="أدخل الكمية"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">الصنف</Label>
                  <Input
                    id="category"
                    value={newInvoice.category}
                    onChange={(e) => setNewInvoice({...newInvoice, category: e.target.value})}
                    placeholder="أدخل الصنف"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentType">نوع الدفع</Label>
                  <Select value={newInvoice.paymentType} onValueChange={(value) => setNewInvoice({...newInvoice, paymentType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">عاجل (نقدي)</SelectItem>
                      <SelectItem value="credit">آجل (بالأجل)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ الفاتورة</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(newInvoice.date, "PPP", { locale: ar })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newInvoice.date}
                          onSelect={(date) => date && setNewInvoice({...newInvoice, date})}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>تاريخ الاستحقاق</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(newInvoice.dueDate, "PPP", { locale: ar })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newInvoice.dueDate}
                          onSelect={(date) => date && setNewInvoice({...newInvoice, dueDate: date})}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total">إجمالي المبلغ</Label>
                  <Input
                    id="total"
                    type="number"
                    value={newInvoice.total || ""}
                    onChange={(e) => setNewInvoice({...newInvoice, total: Number(e.target.value) || 0})}
                    placeholder="أدخل إجمالي المبلغ"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paidAmount">المبلغ المدفوع</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    value={newInvoice.paidAmount || ""}
                    onChange={(e) => setNewInvoice({...newInvoice, paidAmount: Number(e.target.value) || 0})}
                    placeholder="أدخل المبلغ المدفوع"
                    max={newInvoice.total}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="items">عدد الأصناف</Label>
                  <Input
                    id="items"
                    type="number"
                    value={newInvoice.items || ""}
                    onChange={(e) => setNewInvoice({...newInvoice, items: Number(e.target.value) || 0})}
                    placeholder="أدخل عدد الأصناف"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
                    placeholder="أدخل أي ملاحظات إضافية"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t shrink-0">
              <Button onClick={handleAddInvoice} className="w-full sm:w-auto">
                إضافة الفاتورة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Button 
          variant="destructive" 
          onClick={handleDeleteAllInvoices}
          disabled={invoices.length === 0}
          className="font-cairo"
        >
          <Trash2 className="ml-2 h-4 w-4" />
          حذف جميع الفواتير
        </Button>
        
        {deletedInvoices.length > 0 && (
          <Button 
            variant="outline" 
            onClick={handleRestoreInvoices}
            className="font-cairo"
          >
            استعادة الفواتير المحذوفة ({deletedInvoices.length})
          </Button>
        )}
        
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي الفواتير</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{filteredInvoices.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي المبلغ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{totalAmount.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">المبلغ المدفوع</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 font-tajawal">{paidAmount.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">المبلغ المعلق</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 font-tajawal">{pendingAmount.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في الفواتير..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-tajawal">جميع الحالات</SelectItem>
                <SelectItem value="paid" className="font-tajawal">مدفوعة</SelectItem>
                <SelectItem value="pending" className="font-tajawal">معلقة</SelectItem>
                <SelectItem value="overdue" className="font-tajawal">متأخرة</SelectItem>
                <SelectItem value="cancelled" className="font-tajawal">ملغية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-tajawal">رقم الفاتورة</TableHead>
                <TableHead className="font-tajawal">المورد</TableHead>
                <TableHead className="font-tajawal">التاريخ</TableHead>
                <TableHead className="font-tajawal">تاريخ الاستحقاق</TableHead>
                <TableHead className="font-tajawal">عدد الأصناف</TableHead>
                <TableHead className="font-tajawal">إجمالي المبلغ</TableHead>
                <TableHead className="font-tajawal">الحالة</TableHead>
                <TableHead className="font-tajawal">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.supplier}</TableCell>
                  <TableCell>{format(invoice.date, "yyyy/MM/dd")}</TableCell>
                  <TableCell>{format(invoice.dueDate, "yyyy/MM/dd")}</TableCell>
                  <TableCell>{invoice.items}</TableCell>
                  <TableCell>{invoice.total.toLocaleString()} ج.م</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditInvoice(invoice)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteInvoice(invoice.id)}
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

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تفاصيل فاتورة الشراء</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">رقم الفاتورة</Label>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">المورد</Label>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.supplier}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">تاريخ الفاتورة</Label>
                  <p className="text-sm text-muted-foreground">{format(selectedInvoice.date, "yyyy/MM/dd")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">تاريخ الاستحقاق</Label>
                  <p className="text-sm text-muted-foreground">{format(selectedInvoice.dueDate, "yyyy/MM/dd")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">عدد الأصناف</Label>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.items}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">إجمالي المبلغ</Label>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.total.toLocaleString()} ج.م</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">الحالة</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedInvoice.status)}
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <Label className="text-sm font-medium">ملاحظات</Label>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>تعديل فاتورة الشراء</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="overflow-y-auto flex-1 px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="editSupplier">المورد</Label>
                  <Input
                    id="editSupplier"
                    value={editInvoice.supplier}
                    onChange={(e) => setEditInvoice({...editInvoice, supplier: e.target.value})}
                    placeholder="اسم المورد"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editTotal">إجمالي المبلغ</Label>
                  <Input
                    id="editTotal"
                    type="number"
                    value={editInvoice.total}
                    onChange={(e) => setEditInvoice({...editInvoice, total: Number(e.target.value)})}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editItems">عدد الأصناف</Label>
                  <Input
                    id="editItems"
                    type="number"
                    value={editInvoice.items}
                    onChange={(e) => setEditInvoice({...editInvoice, items: Number(e.target.value)})}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editQuantity">الكمية</Label>
                  <Input
                    id="editQuantity"
                    type="number"
                    value={editInvoice.quantity}
                    onChange={(e) => setEditInvoice({...editInvoice, quantity: Number(e.target.value)})}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editProductName">اسم المنتج</Label>
                  <Input
                    id="editProductName"
                    value={editInvoice.productName}
                    onChange={(e) => setEditInvoice({...editInvoice, productName: e.target.value})}
                    placeholder="اسم المنتج"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editPaymentType">نوع الدفع</Label>
                  <Select value={editInvoice.paymentType} onValueChange={(value) => setEditInvoice({...editInvoice, paymentType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">عاجل (نقدي)</SelectItem>
                      <SelectItem value="credit">آجل (بالأجل)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>تاريخ الفاتورة</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(editInvoice.date, "PPP", { locale: ar })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editInvoice.date}
                        onSelect={(date) => date && setEditInvoice({...editInvoice, date})}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="editNotes">ملاحظات</Label>
                  <Textarea
                    id="editNotes"
                    value={editInvoice.notes}
                    onChange={(e) => setEditInvoice({...editInvoice, notes: e.target.value})}
                    placeholder="ملاحظات إضافية"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 pt-4 border-t shrink-0">
            <Button onClick={handleUpdateInvoice} className="flex-1">
              تحديث الفاتورة
            </Button>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}