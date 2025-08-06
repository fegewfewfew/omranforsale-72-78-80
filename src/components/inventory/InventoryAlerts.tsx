import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import { inventoryManager } from "@/utils/inventoryUtils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface StockAlert {
  id: string;
  productName: string;
  code: string;
  currentStock: number;
  minStock: number;
  type: 'low' | 'out';
  category: string;
}

export function InventoryAlerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStockAlerts = () => {
      const lowStockProducts = inventoryManager.getLowStockProducts();
      const outOfStockProducts = inventoryManager.getOutOfStockProducts();
      
      const stockAlerts: StockAlert[] = [
        ...lowStockProducts.map(product => ({
          id: product.id,
          productName: product.name,
          code: product.code,
          currentStock: product.stock,
          minStock: product.minStock,
          type: 'low' as const,
          category: product.category || 'غير محدد'
        })),
        ...outOfStockProducts.map(product => ({
          id: product.id,
          productName: product.name,
          code: product.code,
          currentStock: product.stock,
          minStock: product.minStock,
          type: 'out' as const,
          category: product.category || 'غير محدد'
        }))
      ];
      
      setAlerts(stockAlerts);
    };

    checkStockAlerts();
    
    // تحديث التنبيهات كل دقيقة
    const interval = setInterval(checkStockAlerts, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Package className="h-5 w-5" />
            حالة المخزون
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Package className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-green-600">جميع المنتجات متوفرة بكمية كافية</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-600">
          <AlertTriangle className="h-5 w-5" />
          تنبيهات المخزون ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" data-testid="stock-alerts">
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {alert.type === 'out' ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium text-sm">{alert.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    كود: {alert.code} | فئة: {alert.category}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <Badge variant={alert.type === 'out' ? 'destructive' : 'secondary'}>
                  {alert.type === 'out' ? 'نفدت الكمية' : 'كمية قليلة'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  متوفر: {alert.currentStock} | الحد الأدنى: {alert.minStock}
                </p>
              </div>
            </div>
          ))}
          
          {alerts.length > 5 && (
            <div className="text-center pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/inventory/stock')}
              >
                عرض جميع التنبيهات ({alerts.length})
              </Button>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate('/inventory/products')}
            >
              إدارة المنتجات
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate('/inventory/stock')}
            >
              عرض المخزون
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}