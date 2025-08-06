import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInventory } from '@/hooks/useInventory';
import { toast } from 'sonner';

interface ProductFormProps {
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onClose }) => {
  const { addProduct, isAddingProduct } = useInventory();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    category: '',
    unit_price: '',
    cost_price: '',
    min_stock_level: '5'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sku || !formData.unit_price) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    try {
      await addProduct({
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        barcode: formData.barcode || undefined,
        category: formData.category,
        unit_price: parseFloat(formData.unit_price),
        cost_price: parseFloat(formData.cost_price) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 0,
        is_active: true
      });
      onClose();
    } catch (error) {
      // Error handled by the hook
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة منتج جديد</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل المنتج الجديد
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المنتج *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="أدخل اسم المنتج"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku">كود المنتج (SKU) *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder="مثال: PRD001"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="وصف المنتج"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">الباركود</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                placeholder="رقم الباركود"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">الفئة</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">إلكترونيات</SelectItem>
                  <SelectItem value="clothing">ملابس</SelectItem>
                  <SelectItem value="food">غذائية</SelectItem>
                  <SelectItem value="books">كتب</SelectItem>
                  <SelectItem value="home">منزلية</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_price">سعر البيع *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => handleChange('unit_price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cost_price">سعر التكلفة</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => handleChange('cost_price', e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min_stock_level">الحد الأدنى للمخزون</Label>
              <Input
                id="min_stock_level"
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => handleChange('min_stock_level', e.target.value)}
                placeholder="5"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isAddingProduct}>
              {isAddingProduct ? 'جاري الحفظ...' : 'حفظ المنتج'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;