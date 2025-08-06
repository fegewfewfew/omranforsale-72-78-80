import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Package, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { inventoryManager } from "@/utils/inventoryUtils";

interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  description: string;
  status: "active" | "inactive";
  profit?: number;
  profitPercentage?: number;
}

export default function Products() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [deletedProducts, setDeletedProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('deletedProducts');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing deletedProducts from localStorage:', error);
      return [];
    }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // تحديث المنتجات من inventoryManager عند تحميل الصفحة وعند العودة
  useEffect(() => {
    const loadProducts = () => {
      const inventoryProducts = inventoryManager.getProducts();
      // إزالة البيانات الافتراضية والتجريبية - فقط البيانات المحفوظة الفعلية
      const realProducts = inventoryProducts.filter(product => {
        // إزالة المنتجات التي تحتوي على كلمات دالة على البيانات التجريبية
        const testIndicators = [
          'تجريبي', 'مثال', 'demo', 'sample', 'test',
          'DEMO', 'SAMPLE', 'TEST', 'COMP001', 'PRINT001',
          'ACC001', 'ACC002', 'البيانات التجريبية',
          'كمبيوتر ديل', 'طابعة HP', 'ماوس لوجيتك', 'كيبورد ميكانيكي',
          'لابتوب ديل', 'هاتف سامسونج', 'شاشة سامسونج', 'كيبورد ميكانيكي RGB',
          'DELL001', 'SAM001', 'HP001', 'KEY001', 'LOG001', 'MOUSE001', 'LED001',
          'RICE001', 'OIL001', 'SUG001', 'كيس أرز', 'زيت زيتون', 'سكر أبيض',
          'Dell Inspiron', 'Samsung Galaxy', 'XPS 13', 'MX Master'
        ];
        
        return !testIndicators.some(indicator => 
          product.name.includes(indicator) || 
          product.code.includes(indicator) ||
          product.description?.includes(indicator)
        );
      });
      setProducts(realProducts);
    };

    loadProducts();
    
    // تحديث المنتجات عند العودة للصفحة
    const handleFocus = () => {
      loadProducts();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // تحديث كل 5 ثواني للتأكد من التزامن
    const interval = setInterval(loadProducts, 5000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);
  
  // Save to localStorage when products change
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('products', JSON.stringify(products));
    }
  }, [products]);

  // Save deleted products to localStorage when they change
  useEffect(() => {
    localStorage.setItem('deletedProducts', JSON.stringify(deletedProducts));
  }, [deletedProducts]);

  const filteredProducts = (products || []).filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: "نفدت الكمية", variant: "destructive" as const };
    if (stock <= minStock) return { label: "كمية قليلة", variant: "secondary" as const };
    return { label: "متوفر", variant: "default" as const };
  };

  const handleEditProduct = () => {
    if (editingProduct) {
      // Calculate profit and profit percentage
      const profit = editingProduct.price - editingProduct.cost;
      const profitPercentage = editingProduct.cost > 0 ? ((profit / editingProduct.cost) * 100) : 0;
      
      const updatedProduct = {
        ...editingProduct,
        profit: profit,
        profitPercentage: profitPercentage
      };
      
      setProducts((products || []).map(p => p.id === editingProduct.id ? updatedProduct : p));
      setEditingProduct(null);
    }
  };

  const handleEditInputChange = (field: string, value: string | number) => {
    if (editingProduct) {
      const updatedProduct = { ...editingProduct, [field]: value };
      
      // Recalculate profit when price or cost changes
      if (field === 'price' || field === 'cost') {
        const price = field === 'price' ? Number(value) : editingProduct.price;
        const cost = field === 'cost' ? Number(value) : editingProduct.cost;
        const profit = price - cost;
        const profitPercentage = cost > 0 ? ((profit / cost) * 100) : 0;
        
        updatedProduct.profit = profit;
        updatedProduct.profitPercentage = profitPercentage;
      }
      
      setEditingProduct(updatedProduct);
    }
  };

  const handleDeleteProduct = (id: string) => {
    const productToDelete = (products || []).find(p => p.id === id);
    if (productToDelete) {
      setDeletedProducts(prev => [...prev, productToDelete]);
      setProducts((products || []).filter(p => p.id !== id));
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج بنجاح"
      });
    }
  };

  const handleDeleteAllProducts = () => {
    if ((products || []).length > 0) {
      // حذف جميع المنتجات من الذاكرة المحلية أيضاً
      localStorage.removeItem('products');
      localStorage.removeItem('inventoryMovements');
      
      setDeletedProducts(prev => [...prev, ...products]);
      setProducts([]);
      toast({
        title: "تم الحذف",
        description: "تم حذف جميع المنتجات وإعادة تعيين النظام بنجاح"
      });
    }
  };

  const handleRestoreProducts = () => {
    if ((deletedProducts || []).length > 0) {
      setProducts(prev => [...prev, ...deletedProducts]);
      setDeletedProducts([]);
      toast({
        title: "تم الاستعادة",
        description: "تم استعادة جميع المنتجات المحذوفة"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mada-heading text-foreground">إدارة المنتجات</h1>
        <div className="flex gap-2">
          {(deletedProducts || []).length > 0 && (
            <Button variant="outline" onClick={handleRestoreProducts} className="font-cairo">
              <RotateCcw className="ml-2 h-4 w-4" />
              استعادة المنتجات المحذوفة ({(deletedProducts || []).length})
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={(products || []).length === 0} className="font-cairo">
                <Trash2 className="ml-2 h-4 w-4" />
                حذف جميع المنتجات
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد حذف جميع المنتجات</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من رغبتك في حذف جميع المنتجات؟ يمكنك استعادتها لاحقاً من خيار الاستعادة.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllProducts}>حذف الكل</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => navigate('/inventory/products/new')} className="font-cairo">
            <Plus className="ml-2 h-4 w-4" />
            إضافة منتج جديد
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Package className="h-5 w-5" />
            قائمة المنتجات
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في المنتجات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-tajawal">اسم المنتج</TableHead>
                <TableHead className="font-tajawal">الكود</TableHead>
                <TableHead className="font-tajawal">الفئة</TableHead>
                <TableHead className="font-tajawal">الكمية</TableHead>
                <TableHead className="font-tajawal">الحالة</TableHead>
                <TableHead className="font-tajawal">سعر البيع</TableHead>
                <TableHead className="font-tajawal">الحالة</TableHead>
                <TableHead className="font-tajawal">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock, product.minStock);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.variant}>
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.price} ج.م</TableCell>
                    <TableCell>
                      <Badge variant={product.status === "active" ? "default" : "secondary"}>
                        {product.status === "active" ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل المنتج</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">اسم المنتج</Label>
                  <Input
                    id="edit-name"
                    value={editingProduct.name}
                    onChange={(e) => handleEditInputChange("name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-stock">الكمية الحالية</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => handleEditInputChange("stock", Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-price">سعر البيع</Label>
                  <div className="relative">
                    <Input
                      id="edit-price"
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => handleEditInputChange("price", Number(e.target.value))}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ج.م</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-cost">سعر التكلفة</Label>
                  <div className="relative">
                    <Input
                      id="edit-cost"
                      type="number"
                      value={editingProduct.cost}
                      onChange={(e) => handleEditInputChange("cost", Number(e.target.value))}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ج.م</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-profit">ربح المنتج</Label>
                  <div className="relative">
                    <Input
                      id="edit-profit"
                      type="number"
                      value={(editingProduct.profit || 0).toFixed(2)}
                      readOnly
                      className="bg-muted"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ج.م</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-profit-percentage">نسبة الربح</Label>
                  <div className="relative">
                    <Input
                      id="edit-profit-percentage"
                      type="number"
                      value={(editingProduct.profitPercentage || 0).toFixed(2)}
                      readOnly
                      className="bg-muted"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleEditProduct} className="w-full">
                حفظ التغييرات
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}