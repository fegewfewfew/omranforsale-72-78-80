import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { installmentsManager } from '@/utils/installmentsManager';
import { installmentsIntegrationManager } from '@/utils/installmentsIntegrationManager';

export const InstallmentsKPICards = () => {
  const [installments, setInstallments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allInstallments = installmentsManager.getInstallments();
    setInstallments(allInstallments);
    
    try {
      const analyticsData = installmentsIntegrationManager.getInstallmentAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading installments analytics:', error);
    }
  };

  const activeCount = installments.filter(i => i.status === 'active').length;
  const completedCount = installments.filter(i => i.status === 'completed').length;
  const overdueCount = installments.filter(i => i.status === 'overdue').length;
  const totalRemaining = installments.reduce((sum, i) => sum + (i.remainingAmount || 0), 0);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* الأقساط النشطة */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">أقساط نشطة</div>
              <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
              <div className="text-xs text-muted-foreground">
                متبقي: {totalRemaining.toLocaleString()} ر.س
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الأقساط المكتملة */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">أقساط مكتملة</div>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-xs text-green-600">
                ✓ تم التحصيل
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الأقساط المتأخرة */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">أقساط متأخرة</div>
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
              <div className="text-xs text-red-600">
                ⚠️ تحتاج متابعة
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نسبة الأداء */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">معدل الأداء</div>
              <div className="text-2xl font-bold text-purple-600">
                {analytics?.paymentTrends ? 
                  Math.round((analytics.paymentTrends.onTimePayments / 
                    (analytics.paymentTrends.onTimePayments + analytics.paymentTrends.latePayments + analytics.paymentTrends.missedPayments) * 100) || 0) 
                  : '0'
                }%
              </div>
              <div className="text-xs text-muted-foreground">
                دفعات في الوقت المحدد
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};