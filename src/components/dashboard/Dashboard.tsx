import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICards } from "./KPICards";
import { RecentTransactions } from "./RecentTransactions";
import { SalesChart } from "./SalesChart";
import { StockAlerts } from "./StockAlerts";
import { InventoryAlerts } from "@/components/inventory/InventoryAlerts";
import { CashFlowDashboard } from "./CashFlowDashboard";
import { ChecksKPICards } from "./ChecksKPICards";
import { ChecksAlerts } from "./ChecksAlerts";
import { InstallmentsKPICards } from "./InstallmentsKPICards";
import { InstallmentsAlerts } from "./InstallmentsAlerts";
import { InstallmentsQuickActions } from "./InstallmentsQuickActions";

import { autoIntegrationSystem } from "@/utils/autoIntegrationSystem";
import { IntegrationAlerts } from "./IntegrationAlerts";

export function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [integrationInfo, setIntegrationInfo] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // جلب معلومات الترابط
    const updateIntegrationInfo = () => {
      const info = autoIntegrationSystem.getIntegrationInfo();
      setIntegrationInfo(info);
    };

    updateIntegrationInfo();
    const integrationTimer = setInterval(updateIntegrationInfo, 30000); // تحديث كل 30 ثانية

    return () => {
      clearInterval(timer);
      clearInterval(integrationTimer);
    };
  }, []);

  const formatTime12Hour = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      numberingSystem: 'latn'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-mada-heading text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">
            مرحباً بك في نظام إدارة المبيعات والمخزون
          </p>
        </div>
        <div className="text-right font-gent-bold">
          {/* Clock */}
          <div className="text-lg font-bold text-foreground mb-2">
            {formatTime12Hour(currentTime)}
          </div>
          {/* Gregorian Date */}
          <div className="text-sm font-semibold text-foreground">
            {new Date().toLocaleDateString('ar-EG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              calendar: 'gregory',
              numberingSystem: 'latn'
            })} م
          </div>
          {/* Hijri Date */}
          <div className="text-sm font-semibold text-foreground">
            {new Date().toLocaleDateString('ar-SA', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              numberingSystem: 'latn'
            })} هـ
          </div>
        </div>
      </div>

      {/* مؤشر حالة الترابط */}
      {integrationInfo && (
        <Card className={`border-l-4 ${integrationInfo.currentLevel >= 90 ? 'border-l-green-500 bg-green-50' : 'border-l-blue-500 bg-blue-50'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                {integrationInfo.currentLevel >= 90 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                )}
                حالة ترابط الأنظمة
              </span>
              <Badge 
                className={`${integrationInfo.currentLevel >= 90 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
              >
                {integrationInfo.currentLevel}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {integrationInfo.currentLevel >= 90 ? 
                    '✅ جميع الأنظمة مترابطة بشكل مثالي' : 
                    '🔄 الأنظمة مترابطة تلقائياً - جاري التحسين'
                  }
                </span>
              </div>
              {integrationInfo.lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  آخر تحديث: {new Date(integrationInfo.lastUpdated).toLocaleDateString('ar', { numberingSystem: 'latn' })}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <KPICards />

      {/* Checks KPI Cards */}
      <ChecksKPICards />

      {/* Installments KPI Cards */}
      <InstallmentsKPICards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts and Analytics */}
        <div className="lg:col-span-2 space-y-6">
          <SalesChart />
          <CashFlowDashboard />
          <RecentTransactions />
        </div>
        
        {/* Right Column - Alerts and Status */}
        <div className="space-y-6">
          <InstallmentsAlerts />
          <InstallmentsQuickActions />
          <ChecksAlerts />
          <StockAlerts />
          <InventoryAlerts />
          <IntegrationAlerts />
        </div>
      </div>
    </div>
  );
}