import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProductDisplayTable } from "@/components/product-display/ProductDisplayTable";
import { ProductDisplayProvider } from "@/contexts/ProductDisplayContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, Calendar, User } from "lucide-react";

const SharedProducts = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [shareData, setShareData] = useState<any>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (shareId) {
      try {
        const data = localStorage.getItem(`share_${shareId}`);
        if (data) {
          const parsed = JSON.parse(data);
          const now = new Date();
          const expiresAt = new Date(parsed.expiresAt);
          
          if (now > expiresAt || (parsed.maxViews && parsed.views >= parsed.maxViews)) {
            setIsExpired(true);
          } else {
            // زيادة عدد المشاهدات
            parsed.views = (parsed.views || 0) + 1;
            localStorage.setItem(`share_${shareId}`, JSON.stringify(parsed));
            setShareData(parsed);
          }
        } else {
          setShareData(null);
        }
      } catch (error) {
        console.error('خطأ في تحميل بيانات المشاركة:', error);
        setShareData(null);
      }
    }
    setIsLoading(false);
  }, [shareId]);

  const exportToPDF = () => {
    if (!shareData) return;

    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بفتح النوافذ المنبثقة لتصدير التقرير');
      return;
    }

    const titles = {
      selling: "قائمة أسعار البيع للمنتجات",
      purchase: "قائمة أسعار الشراء للمنتجات", 
      stock: "قائمة المخزون والكميات"
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${shareData.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body { 
            font-family: 'Cairo', Arial, sans-serif; 
            direction: rtl; 
            margin: 20px;
            color: #333;
          }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 16px; color: #666; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          .section { margin: 30px 0; }
          .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            border-bottom: 2px solid #333; 
            padding-bottom: 5px; 
            margin-bottom: 15px; 
          }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${shareData.name}</h1>
          <div class="subtitle">${titles[shareData.displayOption] || 'قائمة المنتجات'}</div>
          <div class="info">
            <div>تاريخ الإنشاء: ${new Date(shareData.createdAt).toLocaleDateString('en-GB')}</div>
            <div>عدد المنتجات: ${shareData.products?.length || 0}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">قائمة المنتجات</h2>
          <table>
            <thead>
              <tr>
                <th>اسم المنتج</th>
                <th>الفئة</th>
                <th>الكمية المتاحة</th>
                <th>${shareData.displayOption === "selling" ? "سعر البيع" : shareData.displayOption === "purchase" ? "سعر الشراء" : "الباركود"}</th>
              </tr>
            </thead>
            <tbody>
              ${shareData.products?.map((product: any) => `
                <tr>
                  <td>${product.name}</td>
                  <td>${product.category || "غير محدد"}</td>
                  <td>${product.stock}</td>
                  <td>
                    ${shareData.displayOption === "selling" ? `${product.price.toLocaleString()} ج.م` : 
                      shareData.displayOption === "purchase" ? `${product.cost.toLocaleString()} ج.م` : 
                      (product.barcode || "غير محدد")}
                  </td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المبيعات</p>
          <p>تاريخ الطباعة: ${new Date().toLocaleDateString('en-GB')} - ${new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل البيانات...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-red-500 text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold mb-4 text-red-600">انتهت صلاحية الرابط</h2>
            <p className="text-muted-foreground">هذا الرابط لم يعد صالحاً للاستخدام أو تم استنفاد عدد المشاهدات المسموحة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shareData || !shareData.products || shareData.products.length === 0) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4 text-yellow-600">رابط غير صحيح</h2>
            <p className="text-muted-foreground">لم يتم العثور على البيانات المطلوبة أو أن الرابط غير صحيح</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* معلومات القائمة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl font-bold">{shareData.name}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {shareData.products?.length || 0} منتج
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {shareData.views || 0} مشاهدة
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>تم إنشاؤه: {new Date(shareData.createdAt).toLocaleDateString('en-GB')}</span>
            </div>
            <div>
              <span>نوع العرض: {
                shareData.displayOption === "selling" ? "أسعار البيع" :
                shareData.displayOption === "purchase" ? "أسعار الشراء" : "الكميات المتاحة"
              }</span>
            </div>
            <div>
              <span>ينتهي: {new Date(shareData.expiresAt).toLocaleDateString('en-GB')}</span>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={exportToPDF} variant="outline" size="sm">
              <Download className="w-4 h-4 ml-2" />
              تصدير PDF
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* عرض المنتجات في جدول منظم */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المنتجات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-right p-3 font-semibold">اسم المنتج</th>
                  <th className="text-center p-3 font-semibold">الفئة</th>
                  <th className="text-center p-3 font-semibold">الكمية المتاحة</th>
                  <th className="text-center p-3 font-semibold">
                    {shareData.displayOption === "selling" && "سعر البيع"}
                    {shareData.displayOption === "purchase" && "سعر الشراء"}
                    {shareData.displayOption === "stock" && "الباركود"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {shareData.products.map((product: any, index: number) => (
                  <tr key={product.id || index} className={`border-b hover:bg-muted/30 ${index % 2 === 0 ? 'bg-muted/10' : ''}`}>
                    <td className="p-3 font-medium">{product.name}</td>
                    <td className="p-3 text-center text-muted-foreground">{product.category || "غير محدد"}</td>
                    <td className="p-3 text-center">
                      <Badge variant={product.stock > 10 ? "default" : product.stock > 5 ? "secondary" : "destructive"}>
                        {product.stock} قطعة
                      </Badge>
                    </td>
                    <td className="p-3 text-center font-semibold">
                      {shareData.displayOption === "selling" && (
                        <span className="text-green-600">{product.price?.toLocaleString() || 0} ج.م</span>
                      )}
                      {shareData.displayOption === "purchase" && (
                        <span className="text-blue-600">{product.cost?.toLocaleString() || 0} ج.م</span>
                      )}
                      {shareData.displayOption === "stock" && (
                        <span className="text-muted-foreground font-mono text-sm">{product.barcode || "غير محدد"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedProducts;