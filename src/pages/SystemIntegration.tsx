import React, { Suspense } from 'react';
import { Play, RefreshCw, BarChart3, Database, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { usePerformantIntegration } from '@/hooks/usePerformantIntegration';
import { PerformanceOptimizedTabs } from '@/components/ui/performance-optimized-tabs';
import { EntityLinkManager } from '@/components/ui/entity-link-manager';
import { AdvancedIntegrationDashboard } from '@/components/ui/advanced-integration-dashboard';

// مكون تحميل محسن
const LoadingPlaceholder = () => (
  <div className="container mx-auto p-6" dir="rtl">
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span>جاري تحميل بيانات التكامل المحسن...</span>
      </div>
    </div>
  </div>
);

// مكون الإحصائيات السريعة
const QuickStatsCard = ({ title, value, icon: Icon, color }: any) => (
  <Card className="transition-all duration-200 hover:shadow-md">
    <CardContent className="p-6">
      <div className="flex items-center gap-2">
        <Icon className={`h-8 w-8 ${color}`} />
        <div>
          <div className={`text-2xl font-bold ${color}`}>{value}</div>
          <div className="text-sm text-muted-foreground">{title}</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function SystemIntegration() {
  const { toast } = useToast();
  
  // استخدام Hook المحسن للأداء
  const {
    isLoading,
    isEnhancing,
    isRefreshing,
    error,
    lastUpdated,
    integrationData,
    systemEvaluation,
    integrationReport,
    smartLinkingResult,
    performanceMetrics,
    loadIntegrationData,
    performSmartLinking,
    refreshData,
    clearCache,
    getPerformanceStats,
    cacheStats,
    isDataStale
  } = usePerformantIntegration({
    enableCaching: true,
    enableProfiling: true,
    autoRefresh: true,
    refreshInterval: 300000 // 5 دقائق
  });

  // تشغيل التحسين الشامل
  const runEnhancement = async () => {
    try {
      await performSmartLinking();
      
      toast({
        title: "نجح التحسين",
        description: "تم تحسين جميع الروابط بين الأنظمة بنجاح",
        variant: "default"
      });
    } catch (error) {
      console.error('خطأ في التحسين:', error);
      toast({
        title: "خطأ في التحسين",
        description: "فشل في تشغيل التحسين الشامل",
        variant: "destructive"
      });
    }
  };

  // عرض التحميل
  if (isLoading && !integrationData) {
    return <LoadingPlaceholder />;
  }

  // حساب الإحصائيات
  const stats = integrationReport ? {
    overallScore: integrationReport.overallScore || 0,
    excellentModules: integrationReport.summary?.excellentModules || 0,
    goodModules: integrationReport.summary?.goodModules || 0,
    improvementNeeded: (integrationReport.summary?.needsImprovementModules || 0) + (integrationReport.summary?.poorModules || 0)
  } : null;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">نظام التكامل المحسن</h1>
          <p className="text-muted-foreground mt-2">
            إدارة وتحسين الروابط بين جميع أنظمة البرنامج مع تحسينات الأداء
          </p>
          {lastUpdated > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                آخر تحديث: {new Date(lastUpdated).toLocaleString('ar')}
              </span>
              {isDataStale && (
                <span className="text-xs text-yellow-600 font-medium">
                  • البيانات قديمة
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearCache}
          >
            <Database className="h-4 w-4 ml-1" />
            مسح الكاش
          </Button>
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={isRefreshing || isEnhancing}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'جاري التحديث...' : 'تحديث'}
          </Button>
          <Button 
            onClick={runEnhancement}
            disabled={isEnhancing || isRefreshing}
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="h-4 w-4 ml-2" />
            {isEnhancing ? 'جاري التحسين...' : 'تشغيل التحسين الشامل'}
          </Button>
        </div>
      </div>

      {/* عرض الأخطاء */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            خطأ في النظام: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* الإحصائيات السريعة */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <QuickStatsCard
            title="النقاط الإجمالية"
            value={`${stats.overallScore}%`}
            icon={BarChart3}
            color="text-primary"
          />
          <QuickStatsCard
            title="أنظمة ممتازة"
            value={stats.excellentModules}
            icon={CheckCircle}
            color="text-green-600"
          />
          <QuickStatsCard
            title="أنظمة جيدة"
            value={stats.goodModules}
            icon={TrendingUp}
            color="text-blue-600"
          />
          <QuickStatsCard
            title="تحتاج تحسين"
            value={stats.improvementNeeded}
            icon={AlertTriangle}
            color="text-yellow-600"
          />
        </div>
      )}

      {/* التوصيات الرئيسية */}
      {integrationReport?.topRecommendations?.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>توصيات هامة:</strong>
            <ul className="mt-2 space-y-1">
              {integrationReport.topRecommendations.slice(0, 5).map((rec: string, index: number) => (
                <li key={index} className="text-sm">• {rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* معلومات الأداء */}
      {performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              معلومات الأداء المحسن
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {performanceMetrics.averageDuration?.toFixed(0) || 0}ms
                </div>
                <div className="text-sm text-muted-foreground">متوسط وقت التحميل</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {performanceMetrics.cacheHitRate?.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-muted-foreground">معدل إصابة الكاش</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {performanceMetrics.memoryUsage?.toFixed(1) || 0}MB
                </div>
                <div className="text-sm text-muted-foreground">استخدام الذاكرة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {performanceMetrics.operationsCount || 0}
                </div>
                <div className="text-sm text-muted-foreground">العمليات المنفذة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* التبويبات المحسنة */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <Tabs defaultValue="advanced" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="advanced">التحسين المتقدم</TabsTrigger>
            <TabsTrigger value="performance">الأداء المحسن</TabsTrigger>
            <TabsTrigger value="modules">تقييم الأنظمة</TabsTrigger>
            <TabsTrigger value="smart-linking">الربط الذكي</TabsTrigger>
          </TabsList>

          <TabsContent value="advanced" className="space-y-4">
            <AdvancedIntegrationDashboard />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PerformanceOptimizedTabs
              integrationData={integrationData}
              systemEvaluation={systemEvaluation}
              performanceMetrics={performanceMetrics}
              cacheStats={cacheStats}
              isLoading={isRefreshing}
              onRefresh={refreshData}
              onClearCache={clearCache}
            />
          </TabsContent>

          <TabsContent value="modules" className="space-y-4">
            <PerformanceOptimizedTabs
              integrationData={integrationData}
              systemEvaluation={systemEvaluation}
              performanceMetrics={performanceMetrics}
              cacheStats={cacheStats}
              isLoading={isRefreshing}
              onRefresh={refreshData}
              onClearCache={clearCache}
            />
          </TabsContent>

          <TabsContent value="smart-linking" className="space-y-4">
            <EntityLinkManager onLinkingComplete={refreshData} />
          </TabsContent>
        </Tabs>
      </Suspense>
    </div>
  );
}