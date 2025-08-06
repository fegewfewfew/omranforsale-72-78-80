import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Clock, XCircle, User, Building, DollarSign } from 'lucide-react';
import { checksManager, Check } from '@/utils/checksManager';
import { storage } from '@/utils/storage';

interface ChecksByEntityDashboardProps {
  entityId?: string;
  entityType?: 'customer' | 'supplier';
}

export const ChecksByEntityDashboard = ({ entityId, entityType }: ChecksByEntityDashboardProps) => {
  const [checks, setChecks] = useState<Check[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>(entityId || '');
  const [selectedEntityType, setSelectedEntityType] = useState<'customer' | 'supplier'>(entityType || 'customer');

  useEffect(() => {
    loadData();
  }, [selectedEntityType]);

  const loadData = () => {
    // تحميل الشيكات
    if (selectedEntityId) {
      const entityChecks = checksManager.getChecksByEntity(selectedEntityId, selectedEntityType);
      setChecks(entityChecks);
    } else {
      setChecks(checksManager.getChecks());
    }

    // تحميل العملاء أو الموردين
    if (selectedEntityType === 'customer') {
      setEntities(storage.getItem('customers', []));
    } else {
      setEntities(storage.getItem('suppliers', []));
    }
  };

  const getStatusIcon = (status: Check['status']) => {
    switch (status) {
      case 'cashed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'bounced': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'returned': return <AlertCircle className="h-4 w-4 text-warning" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: Check['status']) => {
    switch (status) {
      case 'cashed': return 'default';
      case 'bounced': return 'destructive';
      case 'returned': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: Check['status']) => {
    switch (status) {
      case 'pending': return 'معلق';
      case 'cashed': return 'مصروف';
      case 'bounced': return 'مرتجع';
      case 'returned': return 'مُرجع';
    }
  };

  const getEntityChecksStats = (entityId: string) => {
    const entityChecks = checks.filter(check => 
      (selectedEntityType === 'customer' && check.customerId === entityId) ||
      (selectedEntityType === 'supplier' && check.supplierId === entityId)
    );

    const pending = entityChecks.filter(c => c.status === 'pending');
    const cashed = entityChecks.filter(c => c.status === 'cashed');
    const bounced = entityChecks.filter(c => c.status === 'bounced');

    return {
      total: entityChecks.length,
      pending: pending.length,
      cashed: cashed.length,
      bounced: bounced.length,
      totalAmount: entityChecks.reduce((sum, c) => sum + c.amount, 0),
      pendingAmount: pending.reduce((sum, c) => sum + c.amount, 0)
    };
  };

  const filteredChecks = selectedEntityId 
    ? checks.filter(check => 
        (selectedEntityType === 'customer' && check.customerId === selectedEntityId) ||
        (selectedEntityType === 'supplier' && check.supplierId === selectedEntityId)
      )
    : checks;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">شيكات {selectedEntityType === 'customer' ? 'العملاء' : 'الموردين'}</h2>
          <p className="text-muted-foreground">
            إدارة ومتابعة الشيكات مرتبطة بـ{selectedEntityType === 'customer' ? 'العملاء' : 'الموردين'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedEntityType === 'customer' ? <User className="h-5 w-5" /> : <Building className="h-5 w-5" />}
        </div>
      </div>

      <Tabs value={selectedEntityType} onValueChange={(value) => setSelectedEntityType(value as 'customer' | 'supplier')}>
        <TabsList>
          <TabsTrigger value="customer">
            <User className="h-4 w-4 ml-2" />
            العملاء
          </TabsTrigger>
          <TabsTrigger value="supplier">
            <Building className="h-4 w-4 ml-2" />
            الموردين
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedEntityType} className="space-y-6">
          {/* قائمة الكيانات مع إحصائيات الشيكات */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entities.map((entity) => {
              const stats = getEntityChecksStats(entity.id);
              return (
                <Card 
                  key={entity.id} 
                  className={`cursor-pointer transition-all ${
                    selectedEntityId === entity.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedEntityId(selectedEntityId === entity.id ? '' : entity.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{entity.name}</span>
                      {stats.total > 0 && (
                        <Badge variant="secondary">{stats.total}</Badge>
                      )}
                    </CardTitle>
                    {entity.phone && (
                      <CardDescription>{entity.phone}</CardDescription>
                    )}
                  </CardHeader>
                  
                  {stats.total > 0 && (
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">معلق:</span>
                            <span>{stats.pending}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">مصروف:</span>
                            <span className="text-success">{stats.cashed}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">مرتجع:</span>
                            <span className="text-destructive">{stats.bounced}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">إجمالي المبلغ</div>
                            <div className="font-semibold">{stats.totalAmount.toLocaleString()} ر.س</div>
                          </div>
                          {stats.pendingAmount > 0 && (
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">المعلق</div>
                              <div className="font-semibold text-warning">{stats.pendingAmount.toLocaleString()} ر.س</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* قائمة الشيكات للكيان المحدد */}
          {selectedEntityId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  شيكات {entities.find(e => e.id === selectedEntityId)?.name}
                </CardTitle>
                <CardDescription>
                  عدد الشيكات: {filteredChecks.length} - 
                  إجمالي المبلغ: {filteredChecks.reduce((sum, c) => sum + c.amount, 0).toLocaleString()} ر.س
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredChecks.map((check) => (
                    <div 
                      key={check.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(check.status)}
                        <div>
                          <div className="font-medium">شيك رقم {check.checkNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {check.bankName} • تاريخ الاستحقاق: {new Date(check.dueDate).toLocaleDateString('ar-SA')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <div className="font-semibold">{check.amount.toLocaleString()} ر.س</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(check.dateReceived).toLocaleDateString('ar-SA')}
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(check.status)}>
                          {getStatusText(check.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {filteredChecks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد شيكات لهذا {selectedEntityType === 'customer' ? 'العميل' : 'المورد'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* إحصائيات عامة عند عدم تحديد كيان */}
          {!selectedEntityId && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">شيكات معلقة</div>
                      <div className="text-2xl font-bold">
                        {checks.filter(c => c.status === 'pending').length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div>
                      <div className="text-sm text-muted-foreground">شيكات مصروفة</div>
                      <div className="text-2xl font-bold">
                        {checks.filter(c => c.status === 'cashed').length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <div className="text-sm text-muted-foreground">شيكات مرتجعة</div>
                      <div className="text-2xl font-bold">
                        {checks.filter(c => c.status === 'bounced').length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">إجمالي المبلغ</div>
                      <div className="text-2xl font-bold">
                        {checks.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};