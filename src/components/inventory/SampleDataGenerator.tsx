import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inventoryManager } from "@/utils/inventoryUtils";
import { useToast } from "@/hooks/use-toast";
import { Package } from "lucide-react";

export function SampleDataGenerator() {
  const { toast } = useToast();

  const generateSampleData = () => {
    // تم إلغاء إنشاء البيانات التجريبية
    // المنتجات ستتم إضافتها يدوياً فقط من قبل المستخدم
    
    toast({
      title: "تم إلغاء البيانات التجريبية",
      description: "يرجى إضافة المنتجات يدوياً من خلال نموذج 'إضافة منتج جديد'",
      variant: "destructive"
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          بيانات تجريبية للاختبار
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          انقر على الزر أدناه لإضافة بيانات تجريبية (منتجات وحركات مخزون) لاختبار النظام
        </p>
        <Button onClick={generateSampleData} variant="outline">
          إنشاء بيانات تجريبية
        </Button>
      </CardContent>
    </Card>
  );
}