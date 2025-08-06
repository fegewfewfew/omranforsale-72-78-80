import React, { useState, useEffect } from 'react';
import { Search, Link, Unlink, Users, CreditCard, Calendar, TrendingUp, AlertTriangle, CheckCircle, Bot, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useEntityIntegration } from '@/hooks/useEntityIntegration';
import { storage } from '@/utils/storage';

interface EntityLinkManagerProps {
  onLinkingComplete?: () => void;
}

export function EntityLinkManager({ onLinkingComplete }: EntityLinkManagerProps) {
  const { toast } = useToast();
  const {
    isLoading,
    isSmartLinking,
    integrations,
    integrationReport,
    smartLinkingResult,
    performSmartLinking,
    manualLink,
    unlinkEntity,
    refreshData,
    getQuickStats
  } = useEntityIntegration();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isManualLinkDialogOpen, setIsManualLinkDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [manualLinkData, setManualLinkData] = useState({
    ownerId: '',
    ownerType: 'customer' as 'customer' | 'supplier' | 'employee'
  });

  // بيانات الأصحاب للربط اليدوي
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    setCustomers(storage.getItem('customers', []));
    setSuppliers(storage.getItem('suppliers', []));
    setEmployees(storage.getItem('employees', []));
  }, []);

  const stats = getQuickStats();

  // تشغيل الربط الذكي
  const handleSmartLinking = async () => {
    try {
      await performSmartLinking();
      onLinkingComplete?.();
    } catch (error) {
      console.error('خطأ في الربط الذكي:', error);
    }
  };

  // الربط اليدوي
  const handleManualLink = async () => {
    if (!selectedEntity || !manualLinkData.ownerId) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى اختيار المالك للربط",
        variant: "destructive"
      });
      return;
    }

    try {
      await manualLink(
        selectedEntity.type,
        selectedEntity.id,
        manualLinkData.ownerId,
        manualLinkData.ownerType
      );
      
      setIsManualLinkDialogOpen(false);
      setSelectedEntity(null);
      setManualLinkData({ ownerId: '', ownerType: 'customer' });
      onLinkingComplete?.();
    } catch (error) {
      console.error('خطأ في الربط اليدوي:', error);
    }
  };

  // إلغاء الربط
  const handleUnlink = async (entityType: 'check' | 'installment', entityId: string) => {
    try {
      await unlinkEntity(entityType, entityId);
      onLinkingComplete?.();
    } catch (error) {
      console.error('خطأ في إلغاء الربط:', error);
    }
  };

  // فتح حوار الربط اليدوي
  const openManualLinkDialog = (entity: any) => {
    setSelectedEntity(entity);
    setManualLinkData({ ownerId: '', ownerType: 'customer' });
    setIsManualLinkDialogOpen(true);
  };

  // الحصول على الأصحاب حسب النوع
  const getOwnersByType = () => {
    switch (manualLinkData.ownerType) {
      case 'customer': return customers;
      case 'supplier': return suppliers;
      case 'employee': return employees;
      default: return [];
    }
  };

  // الحصول على بادج الثقة
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return <Badge variant="default">ثقة عالية</Badge>;
    if (confidence >= 60) return <Badge variant="secondary">ثقة متوسطة</Badge>;
    return <Badge variant="destructive">ثقة منخفضة</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">جاري التحميل...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            إدارة ربط الشيكات والأقساط
          </CardTitle>
          <CardDescription>
            نظام ذكي لربط الشيكات والأقساط بأصحابها تلقائياً ويدوياً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">إجمالي الكيانات</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.totalEntities}</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">مرتبطة</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-green-600">{stats.linkedEntities}</div>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">معدل الربط</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-blue-600">{stats.unlinkingRate.toFixed(1)}%</div>
            </div>
            <div className="bg-amber-100 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">ثقة عالية</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-amber-600">{stats.highConfidenceLinks}</div>
            </div>
          </div>
          
          <div className="mt-6 flex gap-2">
            <Button 
              onClick={handleSmartLinking} 
              disabled={isSmartLinking}
              className="flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              {isSmartLinking ? 'جاري الربط الذكي...' : 'تشغيل الربط الذكي'}
            </Button>
            <Button variant="outline" onClick={refreshData}>
              تحديث البيانات
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="linked">مرتبطة</TabsTrigger>
          <TabsTrigger value="unlinked">غير مرتبطة</TabsTrigger>
          <TabsTrigger value="suggestions">اقتراحات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {integrationReport && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>تقرير الربط حسب النوع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>الشيكات</span>
                      <div className="text-left">
                        <div className="font-bold">
                          {integrationReport.byEntityType.checks.linked} / {integrationReport.byEntityType.checks.total}
                        </div>
                        <Progress 
                          value={integrationReport.byEntityType.checks.linkingRate} 
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>الأقساط</span>
                      <div className="text-left">
                        <div className="font-bold">
                          {integrationReport.byEntityType.installments.linked} / {integrationReport.byEntityType.installments.total}
                        </div>
                        <Progress 
                          value={integrationReport.byEntityType.installments.linkingRate} 
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>طرق الربط</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-blue-600" />
                        <span>ربط تلقائي</span>
                      </div>
                      <span className="font-bold">{integrationReport.byLinkingMethod.autoLinked}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600" />
                        <span>ربط يدوي</span>
                      </div>
                      <span className="font-bold">{integrationReport.byLinkingMethod.manualLinked}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {smartLinkingResult && (
            <Card>
              <CardHeader>
                <CardTitle>نتائج آخر ربط ذكي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{smartLinkingResult.successfulLinks}</div>
                    <div className="text-sm text-muted-foreground">روابط ناجحة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{smartLinkingResult.highConfidenceLinks}</div>
                    <div className="text-sm text-muted-foreground">ثقة عالية</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{smartLinkingResult.failedLinks}</div>
                    <div className="text-sm text-muted-foreground">فشل في الربط</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="linked" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الكيانات المرتبطة</CardTitle>
              <CardDescription>
                عرض جميع الشيكات والأقساط المرتبطة بأصحابها
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="البحث في الكيانات المرتبطة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النوع</TableHead>
                    <TableHead>الكيان</TableHead>
                    <TableHead>المالك</TableHead>
                    <TableHead>نوع المالك</TableHead>
                    <TableHead>الثقة</TableHead>
                    <TableHead>طريقة الربط</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(integrations || [])
                    .filter(integration => 
                      integration.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      integration.entityId?.includes(searchTerm)
                    )
                    .map((integration) => (
                      <TableRow key={integration.id}>
                        <TableCell>
                          <Badge variant={integration.entityType === 'check' ? 'default' : 'secondary'}>
                            {integration.entityType === 'check' ? 'شيك' : 'قسط'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{integration.entityId}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{integration.ownerName}</div>
                            {integration.ownerPhone && (
                              <div className="text-sm text-muted-foreground">{integration.ownerPhone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {integration.ownerType === 'customer' ? 'عميل' : 
                             integration.ownerType === 'supplier' ? 'مورد' : 'موظف'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getConfidenceBadge(integration.confidence)}</TableCell>
                        <TableCell>
                          <Badge variant={integration.autoLinked ? 'default' : 'secondary'}>
                            {integration.autoLinked ? 'تلقائي' : 'يدوي'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlink(integration.entityType, integration.entityId)}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unlinked" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>كيانات غير مرتبطة</CardTitle>
              <CardDescription>
                الشيكات والأقساط التي لم يتم ربطها بعد
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                سيتم عرض الكيانات غير المرتبطة هنا
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          {smartLinkingResult?.suggestions && smartLinkingResult.suggestions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>اقتراحات الربط</CardTitle>
                <CardDescription>
                  كيانات يمكن ربطها يدوياً بناءً على التحليل الذكي
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {smartLinkingResult.suggestions.map((suggestion, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{suggestion.entityName}</h4>
                            <div className="text-sm text-muted-foreground mt-1">
                              النوع: {suggestion.entityType === 'check' ? 'شيك' : 'قسط'}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {suggestion.possibleOwners.length} اقتراح
                          </Badge>
                        </div>
                        
                        <div className="mt-3 space-y-2">
                          {suggestion.possibleOwners.slice(0, 3).map((owner, ownerIndex) => (
                            <div key={ownerIndex} className="flex justify-between items-center p-2 bg-muted rounded">
                              <div>
                                <span className="font-medium">{owner.ownerName}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({owner.ownerType === 'customer' ? 'عميل' : 
                                    owner.ownerType === 'supplier' ? 'مورد' : 'موظف'})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{owner.confidence.toFixed(0)}%</Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openManualLinkDialog({
                                    type: suggestion.entityType,
                                    id: suggestion.entityId,
                                    name: suggestion.entityName
                                  })}
                                >
                                  ربط
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  لا توجد اقتراحات للربط حالياً
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* حوار الربط اليدوي */}
      <Dialog open={isManualLinkDialogOpen} onOpenChange={setIsManualLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ربط يدوي</DialogTitle>
            <DialogDescription>
              اختر المالك لربطه مع {selectedEntity?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="ownerType">نوع المالك</Label>
              <Select
                value={manualLinkData.ownerType}
                onValueChange={(value: any) => setManualLinkData({
                  ...manualLinkData,
                  ownerType: value,
                  ownerId: ''
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">عميل</SelectItem>
                  <SelectItem value="supplier">مورد</SelectItem>
                  <SelectItem value="employee">موظف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="owner">المالك</Label>
              <Select
                value={manualLinkData.ownerId}
                onValueChange={(value) => setManualLinkData({
                  ...manualLinkData,
                  ownerId: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المالك" />
                </SelectTrigger>
                <SelectContent>
                  {getOwnersByType().map((owner: any) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name} {owner.phone && `(${owner.phone})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualLinkDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleManualLink}>
              ربط
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}