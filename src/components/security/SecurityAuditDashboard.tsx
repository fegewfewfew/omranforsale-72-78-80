import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';
import { AlertTriangle, Shield, Users, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function SecurityAuditDashboard() {
  const {
    getSecurityEvents,
    getAuditTrails,
    approveSecurityEvent,
    getSecurityStatistics
  } = useSecurityAudit();

  const [securityEvents, setSecurityEvents] = useState([]);
  const [auditTrails, setAuditTrails] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [filter, setFilter] = useState({
    severity: '',
    eventType: '',
    requiresApproval: ''
  });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = () => {
    const events = getSecurityEvents(filter);
    const trails = getAuditTrails();
    const stats = getSecurityStatistics();
    
    setSecurityEvents(events);
    setAuditTrails(trails);
    setStatistics(stats);
  };

  const handleApproval = (eventId: string) => {
    if (approveSecurityEvent(eventId)) {
      loadData();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'optimization_run': return <Activity className="h-4 w-4" />;
      case 'admin_action': return <Shield className="h-4 w-4" />;
      case 'data_export': return <Users className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <PermissionGuard permission="security.view">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">لوحة تدقيق الأمان</h1>
            <p className="text-muted-foreground">
              مراقبة وتدقيق العمليات الحساسة في النظام
            </p>
          </div>
        </div>

        {/* إحصائيات الأمان */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">نقاط الأمان</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.securityScore}
                </div>
                <p className="text-xs text-muted-foreground">
                  من 100 نقطة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">أحداث حرجة</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {statistics.criticalEvents}
                </div>
                <p className="text-xs text-muted-foreground">
                  في آخر 30 يوم
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">موافقات معلقة</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {statistics.pendingApprovals}
                </div>
                <p className="text-xs text-muted-foreground">
                  تحتاج موافقة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الأحداث</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.totalEvents}
                </div>
                <p className="text-xs text-muted-foreground">
                  في آخر 30 يوم
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events">الأحداث الأمنية</TabsTrigger>
            <TabsTrigger value="audit">مسار التدقيق</TabsTrigger>
            <TabsTrigger value="approvals">الموافقات المعلقة</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            {/* فلاتر البحث */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تصفية الأحداث</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={filter.severity} onValueChange={(value) => 
                    setFilter(prev => ({ ...prev, severity: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="مستوى الخطورة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">الكل</SelectItem>
                      <SelectItem value="critical">حرج</SelectItem>
                      <SelectItem value="high">عالي</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="low">منخفض</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filter.eventType} onValueChange={(value) => 
                    setFilter(prev => ({ ...prev, eventType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="نوع الحدث" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">الكل</SelectItem>
                      <SelectItem value="optimization_run">تحسينات الأداء</SelectItem>
                      <SelectItem value="admin_action">عمليات إدارية</SelectItem>
                      <SelectItem value="data_export">تصدير البيانات</SelectItem>
                      <SelectItem value="settings_change">تغيير الإعدادات</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={loadData} variant="outline">
                    تحديث البيانات
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* قائمة الأحداث */}
            <div className="space-y-4">
              {securityEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 space-x-reverse">
                        <div className="p-2 rounded-lg bg-muted">
                          {getEventTypeIcon(event.eventType)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{event.operation}</h3>
                            <Badge variant={getSeverityColor(event.severity)}>
                              {event.severity}
                            </Badge>
                            {event.requiresApproval && (
                              <Badge variant="outline">
                                {event.approvedBy ? 'موافق عليه' : 'معلق'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {event.userEmail} • {event.module}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.timestamp), 'yyyy/MM/dd HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                      
                      {event.requiresApproval && !event.approvedBy && (
                        <PermissionGuard permission="security.approve">
                          <Button
                            size="sm"
                            onClick={() => handleApproval(event.id)}
                          >
                            موافقة
                          </Button>
                        </PermissionGuard>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>مسار التدقيق</CardTitle>
                <CardDescription>
                  تتبع جميع التغييرات المهمة في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditTrails.map((trail, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">
                          {trail.entityType} - {trail.entityId}
                        </h4>
                        <Badge variant="outline">
                          {trail.changes.length} تغيير
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {trail.changes.slice(0, 3).map((change, changeIndex) => (
                          <div key={changeIndex} className="text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{change.field}</span>
                              <span className="text-muted-foreground">
                                {format(new Date(change.timestamp), 'MM/dd HH:mm')}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              {change.changedBy}
                            </div>
                          </div>
                        ))}
                        
                        {trail.changes.length > 3 && (
                          <p className="text-sm text-muted-foreground">
                            و {trail.changes.length - 3} تغييرات أخرى...
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الموافقات المعلقة</CardTitle>
                <CardDescription>
                  العمليات التي تحتاج موافقة إدارية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityEvents
                    .filter(event => event.requiresApproval && !event.approvedBy)
                    .map((event) => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{event.operation}</h4>
                            <Badge variant={getSeverityColor(event.severity)}>
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            طلب من: {event.userEmail}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.timestamp), 'yyyy/MM/dd HH:mm')}
                          </p>
                        </div>
                        
                        <PermissionGuard permission="security.approve">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproval(event.id)}
                            >
                              <CheckCircle className="h-4 w-4 ml-2" />
                              موافقة
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                            >
                              <XCircle className="h-4 w-4 ml-2" />
                              رفض
                            </Button>
                          </div>
                        </PermissionGuard>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* تنبيهات أمنية */}
        {statistics?.recentCriticalEvents?.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              تم اكتشاف {statistics.recentCriticalEvents.length} أحداث أمنية حرجة في الفترة الأخيرة. 
              يرجى مراجعتها فوراً.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </PermissionGuard>
  );
}