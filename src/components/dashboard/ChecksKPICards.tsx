import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, TrendingUp, Receipt } from "lucide-react";
import { checksManager } from "@/utils/checksManager";
import { cn } from "@/lib/utils";

interface CheckStats {
  total: number;
  pending: number;
  cashed: number;
  bounced: number;
  overdue: number;
  dueSoon: number;
  totalPendingAmount: number;
  totalCashedAmount: number;
}

export function ChecksKPICards() {
  const [checkStats, setCheckStats] = useState<CheckStats>({
    total: 0,
    pending: 0,
    cashed: 0,
    bounced: 0,
    overdue: 0,
    dueSoon: 0,
    totalPendingAmount: 0,
    totalCashedAmount: 0,
  });

  useEffect(() => {
    loadCheckStats();
    
    // تحديث الإحصائيات كل دقيقة
    const interval = setInterval(loadCheckStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadCheckStats = () => {
    try {
      const checks = checksManager.getChecks();
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const pendingChecks = checks.filter(check => check.status === 'pending');
      const cashedChecks = checks.filter(check => check.status === 'cashed');
      const bouncedChecks = checks.filter(check => check.status === 'bounced');
      
      // الشيكات المتأخرة (معلقة وتجاوزت تاريخ الاستحقاق)
      const overdueChecks = pendingChecks.filter(check => 
        new Date(check.dueDate) < today
      );
      
      // الشيكات المستحقة قريباً (خلال أسبوع)
      const dueSoonChecks = pendingChecks.filter(check => {
        const dueDate = new Date(check.dueDate);
        return dueDate >= today && dueDate <= weekFromNow;
      });

      const totalPendingAmount = pendingChecks.reduce((sum, check) => sum + check.amount, 0);
      const totalCashedAmount = cashedChecks.reduce((sum, check) => sum + check.amount, 0);

      setCheckStats({
        total: checks.length,
        pending: pendingChecks.length,
        cashed: cashedChecks.length,
        bounced: bouncedChecks.length,
        overdue: overdueChecks.length,
        dueSoon: dueSoonChecks.length,
        totalPendingAmount,
        totalCashedAmount,
      });
    } catch (error) {
      console.error('خطأ في تحميل إحصائيات الشيكات:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* إجمالي الشيكات */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي الشيكات</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{checkStats.total}</div>
          <p className="text-xs text-muted-foreground">
            جميع الشيكات المسجلة
          </p>
        </CardContent>
      </Card>

      {/* الشيكات المعلقة */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الشيكات المعلقة</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{checkStats.pending}</div>
          <p className="text-xs text-muted-foreground">
            قيمة: {checkStats.totalPendingAmount.toLocaleString()} ج.م
          </p>
          {checkStats.overdue > 0 && (
            <Badge variant="destructive" className="mt-2 text-xs">
              {checkStats.overdue} متأخر
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* الشيكات المحصلة */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الشيكات المحصلة</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{checkStats.cashed}</div>
          <p className="text-xs text-muted-foreground">
            قيمة: {checkStats.totalCashedAmount.toLocaleString()} ج.م
          </p>
          {checkStats.total > 0 && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">
                معدل التحصيل: {Math.round((checkStats.cashed / checkStats.total) * 100)}%
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* الشيكات المرتدة والتنبيهات */}
      <Card className={cn(
        checkStats.bounced > 0 || checkStats.dueSoon > 0 ? "border-red-200 bg-red-50" : ""
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">تنبيهات هامة</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {checkStats.bounced > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600">شيكات مرتدة</span>
                <Badge variant="destructive">{checkStats.bounced}</Badge>
              </div>
            )}
            {checkStats.dueSoon > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-600">مستحقة قريباً</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {checkStats.dueSoon}
                </Badge>
              </div>
            )}
            {checkStats.bounced === 0 && checkStats.dueSoon === 0 && (
              <div className="text-center py-2">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-green-600">لا توجد تنبيهات</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}