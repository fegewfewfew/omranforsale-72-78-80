import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Package, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { inventoryManager } from "@/utils/inventoryUtils";

// قائمة المستثمرين مع أكوادهم
const investors: { id: string; name: string }[] = [];

export default function NewProduct() {
  // Development logging removed for production
  const navigate = useNavigate();
  const { toast } = useToast();

  // Generate next product code
  const getNextProductCode = () => {
    const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const nextId = existingProducts.length + 1;
    return `PRD${nextId.toString().padStart(3, '0')}`;
  };

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    barcode: getNextProductCode(),
    category: "",
    buyingPrice: "",
    sellingPrice: "",
    quantity: "",
    minQuantity: "",
    unit: "",
    profit: "",
    profitPercentage: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setProductData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Calculate profit and profit percentage when prices change
      if (field === 'buyingPrice' || field === 'sellingPrice') {
        const buying = parseFloat(field === 'buyingPrice' ? value : prev.buyingPrice) || 0;
        const selling = parseFloat(field === 'sellingPrice' ? value : prev.sellingPrice) || 0;
        const profit = selling - buying;
        const profitPercentage = buying > 0 ? ((profit / buying) * 100) : 0;
        
        updated.profit = profit.toFixed(2);
        updated.profitPercentage = profitPercentage.toFixed(2);
      }
      
      return updated;
    });
  };


  const handleSubmit = () => {
    console.log("Submit button clicked", productData);
    
    // التحقق من الحقول المطلوبة
    if (!productData.name) {
      console.log("Product name is missing");
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    console.log("Creating new product...");
    
    // إنشاء المنتج الجديد
    const newProduct = {
      id: Date.now().toString(),
      name: productData.name,
      code: productData.barcode || `PRD${Date.now()}`,
      category: productData.category,
      stock: parseInt(productData.quantity) || 0,
      minStock: parseInt(productData.minQuantity) || 0,
      price: parseFloat(productData.sellingPrice) || 0,
      cost: parseFloat(productData.buyingPrice) || 0,
      description: productData.description,
      status: "active" as const,
      profit: parseFloat(productData.profit) || 0,
      profitPercentage: parseFloat(productData.profitPercentage) || 0,
      barcode: productData.barcode,
      ownerType: "company" as const
    };

    console.log("New product created:", newProduct);

    try {
      // حفظ المنتج في localStorage مع تحديث inventoryManager
      const existingProducts = inventoryManager.getProducts();
      const updatedProducts = [...existingProducts, newProduct];
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // تحديث بيانات المخزون
      inventoryManager.syncProductsWithStock();
      
      // إضافة حركة دخول للمخزون
      if (newProduct.stock > 0) {
        inventoryManager.addMovement({
          productId: newProduct.id,
          productName: newProduct.name,
          code: newProduct.code,
          type: 'in',
          quantity: newProduct.stock,
          date: new Date().toISOString(),
          reason: 'رصيد افتتاحي',
          value: newProduct.stock * newProduct.cost,
          referenceType: 'adjustment',
          notes: 'إضافة منتج جديد - رصيد افتتاحي',
          ownerType: 'company'
        });
      }
      
      console.log("Product saved to localStorage:", updatedProducts);

      // حفظ المنتج (يمكن إضافة التكامل مع قاعدة البيانات لاحقاً)
      toast({
        title: "تم الحفظ",
        description: "تم إضافة المنتج بنجاح وتحديث المخزون"
      });

      console.log("Navigating back...");
      // العودة للصفحة السابقة
      navigate(-1);
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ المنتج",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen max-h-screen overflow-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-4 sticky top-0 bg-background z-10 pb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-mada-heading">منتج جديد</h1>
          <p className="text-muted-foreground">إضافة منتج جديد إلى المخزون</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            بيانات المنتج
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* معلومات المنتج الأساسية */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName">اسم المنتج *</Label>
              <Input
                id="productName"
                value={productData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="أدخل اسم المنتج"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">كود المنتج</Label>
              <Input
                id="barcode"
                value={productData.barcode}
                readOnly
                className="bg-muted"
                placeholder="يتم إنشاؤه تلقائياً"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف المنتج</Label>
            <Textarea
              id="description"
              value={productData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="أدخل وصف المنتج"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">الفئة</Label>
              <Input
                id="category"
                placeholder="أدخل فئة المنتج"
                value={productData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">الوحدة</Label>
              <Select value={productData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">قطعة</SelectItem>
                  <SelectItem value="kg">كيلوجرام</SelectItem>
                  <SelectItem value="liter">لتر</SelectItem>
                  <SelectItem value="meter">متر</SelectItem>
                  <SelectItem value="box">علبة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* الأسعار والأرباح */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyingPrice">سعر التكلفة</Label>
              <div className="relative">
                <Input
                  id="buyingPrice"
                  type="number"
                  value={productData.buyingPrice}
                  onChange={(e) => handleInputChange("buyingPrice", e.target.value)}
                  placeholder=""
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ج.م</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">سعر البيع</Label>
              <div className="relative">
                <Input
                  id="sellingPrice"
                  type="number"
                  value={productData.sellingPrice}
                  onChange={(e) => handleInputChange("sellingPrice", e.target.value)}
                  placeholder=""
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ج.م</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profit">ربح المنتج (ج.م)</Label>
              <Input
                id="profit"
                value={productData.profit}
                readOnly
                className="bg-muted"
                placeholder="يتم حسابه تلقائياً"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profitPercentage">نسبة الربح (%)</Label>
              <Input
                id="profitPercentage"
                value={productData.profitPercentage}
                readOnly
                className="bg-muted"
                placeholder="يتم حسابها تلقائياً"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية الحالية</Label>
              <Input
                id="quantity"
                type="number"
                value={productData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minQuantity">الحد الأدنى للكمية</Label>
              <Input
                id="minQuantity"
                type="number"
                value={productData.minQuantity}
                onChange={(e) => handleInputChange("minQuantity", e.target.value)}
                placeholder=""
              />
            </div>
          </div>

          {/* أزرار الحفظ */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              <Save className="h-4 w-4 ml-2" />
              حفظ المنتج
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}