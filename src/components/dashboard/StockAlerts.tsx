import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { reportDataGenerator } from "@/utils/reportDataGenerator";
import { useNavigate } from "react-router-dom";

interface StockAlert {
  id: string;
  productName: string;
  currentStock: number;
  minStock: number;
  status: "low" | "out" | "critical";
}

function getStatusColor(status: string) {
  switch (status) {
    case "out":
      return "destructive";
    case "critical":
      return "warning";
    case "low":
      return "secondary";
    default:
      return "secondary";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "out":
      return "نفد المخزون";
    case "critical":
      return "حرج";
    case "low":
      return "منخفض";
    default:
      return "منخفض";
  }
}

export function StockAlerts() {
  const navigate = useNavigate();
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  useEffect(() => {
    loadStockAlerts();
  }, []);

  const loadStockAlerts = () => {
    try {
      const inventoryData = reportDataGenerator.getInventoryReportData();
      
      // تحويل منتجات المخزون المنخفض إلى تنبيهات
      const alerts: StockAlert[] = [];
      
      // المنتجات منخفضة المخزون
      inventoryData.lowStockProducts.forEach((product: any) => {
        alerts.push({
          id: product.id || product.name,
          productName: product.name || 'منتج غير محدد',
          currentStock: product.stock || 0,
          minStock: product.minStock || 5,
          status: "low"
        });
      });

      // المنتجات نافدة المخزون
      inventoryData.outOfStockProducts.forEach((product: any) => {
        alerts.push({
          id: product.id || product.name,
          productName: product.name || 'منتج غير محدد',
          currentStock: 0,
          minStock: product.minStock || 5,
          status: "out"
        });
      });

      // البحث عن المنتجات في حالة حرجة (أقل من 50% من الحد الأدنى)
      inventoryData.products.forEach((product: any) => {
        const stock = product.stock || 0;
        const minStock = product.minStock || 5;
        
        if (stock > 0 && stock < (minStock * 0.5) && stock <= minStock) {
          // تحقق من عدم وجود التنبيه مسبقاً
          const existingAlert = alerts.find(alert => alert.id === (product.id || product.name));
          if (!existingAlert) {
            alerts.push({
              id: product.id || product.name,
              productName: product.name || 'منتج غير محدد',
              currentStock: stock,
              minStock: minStock,
              status: "critical"
            });
          }
        }
      });

      // ترتيب التنبيهات حسب الأولوية (نافد > حرج > منخفض)
      const sortedAlerts = alerts.sort((a, b) => {
        const priority = { out: 3, critical: 2, low: 1 };
        return priority[b.status] - priority[a.status];
      });

      setStockAlerts(sortedAlerts.slice(0, 5)); // أهم 5 تنبيهات
    } catch (error) {
      console.error('خطأ في تحميل تنبيهات المخزون:', error);
    }
  };

  const handleViewAll = () => {
    navigate('/inventory/stock');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          تنبيهات المخزون
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {stockAlerts.length > 0 ? (
            stockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 hover:bg-card-hover transition-colors border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {alert.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      المتوفر: {alert.currentStock} | الحد الأدنى: {alert.minStock}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(alert.status) as any} className="text-xs">
                    {getStatusText(alert.status)}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد تنبيهات مخزون حالياً</p>
              <p className="text-sm text-muted-foreground mt-2">
                جميع المنتجات في مستوى آمن
              </p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-border">
          <Button size="sm" className="w-full" variant="outline" onClick={handleViewAll}>
            <TrendingDown className="h-4 w-4 ml-2" />
            عرض جميع التنبيهات
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}