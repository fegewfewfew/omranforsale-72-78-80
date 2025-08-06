import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Plus, Trash2, Search, Calculator, StickyNote, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { inventoryManager } from "@/utils/inventoryUtils";
import { businessIntegration } from "@/utils/businessIntegration";
import { cashFlowManager } from "@/utils/cashFlowManager";

interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
  total: number;
}

interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export default function NewPurchase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invoiceNumber, setInvoiceNumber] = useState(`PUR-${Date.now()}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentStatus, setPaymentStatus] = useState<string>("paid");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [cost, setCost] = useState<number>(0);
  const [productSearchOpen, setProductSearchOpen] = useState<boolean>(false);
  const [productSearchValue, setProductSearchValue] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  
  // Supplier management
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('suppliers');
    return saved ? JSON.parse(saved) : [];
  });
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [supplierSearchValue, setSupplierSearchValue] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");

  // Product management
  const [products, setProducts] = useState(() => inventoryManager.getProducts());
  const [filteredProducts, setFilteredProducts] = useState(products);

  // Filter products based on search
  useEffect(() => {
    const filtered = (products || []).filter(product =>
      product.name.toLowerCase().includes(productSearchValue.toLowerCase()) ||
      product.code.toLowerCase().includes(productSearchValue.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [productSearchValue, products]);

  const addItem = () => {
    if (!selectedProduct) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار منتج",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0 || cost <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كمية وتكلفة صحيحة",
        variant: "destructive",
      });
      return;
    }

    const product = filteredProducts.find(p => p.name === selectedProduct);
    if (!product) return;

    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      quantity,
      cost,
      total: quantity * cost,
    };

    setItems([...items, newItem]);
    setSelectedProduct("");
    setProductSearchValue("");
    setQuantity(1);
    setCost(0);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.cost }
        : item
    ));
  };

  const updateCost = (id: string, newCost: number) => {
    if (newCost < 0) return;
    
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, cost: newCost, total: item.quantity * newCost }
        : item
    ));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal;

  const handleSave = async () => {
    if (!selectedSupplier && !newSupplierName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مورد أو إدخال اسم مورد جديد",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إضافة منتج واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    let supplier = suppliers.find(s => s.id.toString() === selectedSupplier);
    
    // If no supplier selected but new supplier name provided, create new supplier
    if (!supplier && newSupplierName.trim()) {
      const newSupplier = {
        id: Date.now().toString(),
        name: newSupplierName.trim(),
        phone: "",
        email: "",
        address: ""
      };
      const updatedSuppliers = [...suppliers, newSupplier];
      setSuppliers(updatedSuppliers);
      localStorage.setItem('suppliers', JSON.stringify(updatedSuppliers));
      supplier = newSupplier;
    }
    
    const purchaseData = {
      id: invoiceNumber,
      supplier: supplier?.name || 'مورد غير محدد',
      date: invoiceDate,
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productCode: products.find(p => p.id === item.productId)?.code || '',
        quantity: item.quantity,
        cost: item.cost,
        total: item.total
      })),
      total: total,
      status: paymentStatus === 'paid' ? 'paid' : 'pending',
      paymentMethod,
      notes,
      itemsDetails: items
    };

    // Save purchase invoice to localStorage
    const existingPurchases = localStorage.getItem('purchase_invoices');
    let purchasesArray = [];
    
    if (existingPurchases) {
      try {
        purchasesArray = JSON.parse(existingPurchases);
      } catch (error) {
        console.error('Error parsing existing purchases:', error);
        purchasesArray = [];
      }
    }
    
    purchasesArray.push(purchaseData);
    localStorage.setItem('purchase_invoices', JSON.stringify(purchasesArray));

    // Process through business integration to update inventory
    const integratedPurchaseInvoice = {
      id: purchaseData.id,
      supplier: purchaseData.supplier,
      date: new Date(purchaseData.date).toISOString(),
      items: purchaseData.items,
      total: purchaseData.total,
      status: purchaseData.status as 'paid' | 'pending'
    };

    const success = businessIntegration.processPurchaseInvoice(integratedPurchaseInvoice);
    
    if (success && paymentStatus === 'paid') {
      // ربط مع الصندوق - إضافة مصروف من المشتريات
      cashFlowManager.addTransaction({
        date: new Date().toISOString(),
        type: 'expense',
        category: 'purchases',
        amount: total,
        description: `مشتريات - فاتورة رقم ${invoiceNumber}`,
        referenceId: invoiceNumber,
        referenceType: 'purchase_invoice',
        paymentMethod: 'cash',
        notes: `ربط تلقائي مع الصندوق - مورد: ${purchaseData.supplier}`
      });
      
      // Update products list to show updated stock
      setProducts(inventoryManager.getProducts());
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ فاتورة الشراء وتحديث المخزون والصندوق بنجاح",
      });
    } else if (success) {
      toast({
        title: "تم الحفظ",
        description: "تم حفظ فاتورة الشراء بنجاح",
      });
    } else {
      toast({
        title: "تحذير",
        description: "تم حفظ الفاتورة لكن فشل في تحديث المخزون",
        variant: "destructive",
      });
    }
    
    console.log("Purchase saved:", purchaseData);
    navigate('/purchases/invoices');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/purchases/invoices')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة
            </Button>
            <div>
              <h1 className="text-3xl font-mada-heading text-foreground">فاتورة شراء جديدة</h1>
              <p className="text-muted-foreground mt-1">
                إضافة فاتورة شراء جديدة وتحديث المخزون
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="gap-2">
              <FileText className="h-4 w-4" />
              حفظ الفاتورة
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchase Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  بيانات الفاتورة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم الفاتورة</Label>
                    <Input
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="رقم الفاتورة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ الفاتورة</Label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المورد</Label>
                    <Popover open={supplierSearchOpen} onOpenChange={setSupplierSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={supplierSearchOpen}
                          className="w-full justify-between"
                        >
                          {selectedSupplier
                            ? suppliers.find(s => s.id === selectedSupplier)?.name
                            : "اختر المورد..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="البحث عن مورد..." 
                            value={supplierSearchValue}
                            onValueChange={setSupplierSearchValue}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2">
                                <p className="text-sm text-muted-foreground mb-2">لا يوجد مورد بهذا الاسم</p>
                                <Input
                                  placeholder="إضافة مورد جديد..."
                                  value={newSupplierName}
                                  onChange={(e) => setNewSupplierName(e.target.value)}
                                  className="mb-2"
                                />
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {suppliers.map((supplier) => (
                                <CommandItem
                                  key={supplier.id}
                                  value={supplier.name}
                                  onSelect={() => {
                                    setSelectedSupplier(supplier.id);
                                    setSupplierSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedSupplier === supplier.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {supplier.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>طريقة الدفع</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقداً</SelectItem>
                        <SelectItem value="credit">آجل</SelectItem>
                        <SelectItem value="bank">تحويل بنكي</SelectItem>
                        <SelectItem value="check">شيك</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>حالة الدفع</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">مدفوعة</SelectItem>
                      <SelectItem value="pending">معلقة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Add Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  إضافة منتجات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>المنتج</Label>
                    <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={productSearchOpen}
                          className="w-full justify-between"
                        >
                          {selectedProduct || "اختر المنتج..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="البحث عن منتج..." 
                            value={productSearchValue}
                            onValueChange={setProductSearchValue}
                          />
                          <CommandList>
                            <CommandEmpty>لا يوجد منتج بهذا الاسم</CommandEmpty>
                            <CommandGroup>
                              {filteredProducts.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.name}
                                  onSelect={() => {
                                    setSelectedProduct(product.name);
                                    setProductSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedProduct === product.name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{product.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {product.code} - المخزون: {product.stock}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>الكمية</Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      min="1"
                      placeholder="الكمية"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>تكلفة الوحدة</Label>
                    <Input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      placeholder="السعر"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="opacity-0">إضافة</Label>
                    <Button onClick={addItem} className="w-full">
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  المنتجات المضافة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المنتج</TableHead>
                        <TableHead>الكمية</TableHead>
                        <TableHead>التكلفة</TableHead>
                        <TableHead>الإجمالي</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                              className="w-20"
                              min="1"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.cost}
                              onChange={(e) => updateCost(item.id, Number(e.target.value))}
                              className="w-24"
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>{item.total.toFixed(2)} ج.م</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    لم يتم إضافة أي منتجات بعد
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary and Notes */}
          <div className="space-y-6">
            {/* Purchase Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  ملخص الفاتورة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{subtotal.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>الإجمالي:</span>
                    <span>{total.toFixed(2)} ج.م</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>عدد المنتجات:</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>إجمالي الكمية:</span>
                    <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Badge variant={paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {paymentStatus === 'paid' ? 'مدفوعة' : 'معلقة'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  ملاحظات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أضف أي ملاحظات خاصة بالفاتورة..."
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}