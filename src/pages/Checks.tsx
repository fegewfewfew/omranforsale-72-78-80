import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Plus, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checksManager } from "@/utils/checksManager";

interface Check {
  id: string;
  checkNumber: string;
  amount: number;
  customerName: string;
  bankName: string;
  dueDate: string;
  status: 'pending' | 'cashed' | 'bounced' | 'returned';
  description?: string;
  dateReceived: string;
}

export default function Checks() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load checks using checksManager
    setChecks(checksManager.getChecks());
  }, []);

  const [newCheck, setNewCheck] = useState({
    checkNumber: "",
    amount: "",
    customerName: "",
    bankName: "",
    dueDate: "",
    description: ""
  });

  const getStatusBadge = (status: Check['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />معلق</Badge>;
      case 'cashed':
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />تم التحصيل</Badge>;
      case 'bounced':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />مرتد</Badge>;
      default:
        return null;
    }
  };

  const handleAddCheck = () => {
    if (!newCheck.checkNumber || !newCheck.amount || !newCheck.customerName || !newCheck.bankName || !newCheck.dueDate) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const checkData = {
      checkNumber: newCheck.checkNumber,
      amount: parseFloat(newCheck.amount),
      customerName: newCheck.customerName,
      bankName: newCheck.bankName,
      dueDate: newCheck.dueDate,
      description: newCheck.description,
      dateReceived: new Date().toISOString().split('T')[0]
    };

    // Use checksManager to add check
    checksManager.addCheck(checkData);
    setChecks(checksManager.getChecks());
    
    setNewCheck({
      checkNumber: "",
      amount: "",
      customerName: "",
      bankName: "",
      dueDate: "",
      description: ""
    });
    setIsAddDialogOpen(false);

    toast({
      title: "تم بنجاح",
      description: "تم إضافة الشيك بنجاح",
    });
  };

  const updateCheckStatus = (checkId: string, newStatus: Check['status']) => {
    // Use checksManager to update status
    checksManager.updateCheckStatus(checkId, newStatus);
    setChecks(checksManager.getChecks());
    
    toast({
      title: "تم بنجاح",
      description: "تم تحديث حالة الشيك",
    });
  };

  const pendingChecks = checks.filter(check => check.status === 'pending');
  const cashedChecks = checks.filter(check => check.status === 'cashed');
  const bouncedChecks = checks.filter(check => check.status === 'bounced');

  const totalPendingAmount = pendingChecks.reduce((sum, check) => sum + check.amount, 0);
  const totalCashedAmount = cashedChecks.reduce((sum, check) => sum + check.amount, 0);

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-mada-heading">إدارة الشيكات</h1>
          <p className="text-muted-foreground">متابعة وإدارة الشيكات المستقبلة</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة شيك جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة شيك جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل الشيك المستقبل
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="checkNumber">رقم الشيك *</Label>
                <Input
                  id="checkNumber"
                  value={newCheck.checkNumber}
                  onChange={(e) => setNewCheck({...newCheck, checkNumber: e.target.value})}
                  placeholder="رقم الشيك"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">المبلغ *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newCheck.amount}
                  onChange={(e) => setNewCheck({...newCheck, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customerName">اسم العميل *</Label>
                <Input
                  id="customerName"
                  value={newCheck.customerName}
                  onChange={(e) => setNewCheck({...newCheck, customerName: e.target.value})}
                  placeholder="اسم العميل"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bankName">اسم البنك *</Label>
                <Input
                  id="bankName"
                  value={newCheck.bankName}
                  onChange={(e) => setNewCheck({...newCheck, bankName: e.target.value})}
                  placeholder="اسم البنك"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">تاريخ الاستحقاق *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newCheck.dueDate}
                  onChange={(e) => setNewCheck({...newCheck, dueDate: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">وصف</Label>
                <Textarea
                  id="description"
                  value={newCheck.description}
                  onChange={(e) => setNewCheck({...newCheck, description: e.target.value})}
                  placeholder="وصف أو ملاحظات"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddCheck}>إضافة الشيك</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الشيكات المعلقة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingChecks.length}</div>
            <p className="text-xs text-muted-foreground">
              إجمالي المبلغ: {totalPendingAmount.toLocaleString()} ج.م
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الشيكات المحصلة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cashedChecks.length}</div>
            <p className="text-xs text-muted-foreground">
              إجمالي المبلغ: {totalCashedAmount.toLocaleString()} ج.م
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الشيكات المرتدة</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bouncedChecks.length}</div>
            <p className="text-xs text-muted-foreground">
              يتطلب متابعة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Checks Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الشيكات</CardTitle>
          <CardDescription>جميع الشيكات المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">الكل ({checks.length})</TabsTrigger>
              <TabsTrigger value="pending">معلق ({pendingChecks.length})</TabsTrigger>
              <TabsTrigger value="cashed">محصل ({cashedChecks.length})</TabsTrigger>
              <TabsTrigger value="bounced">مرتد ({bouncedChecks.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <ChecksTable checks={checks} onUpdateStatus={updateCheckStatus} />
            </TabsContent>
            <TabsContent value="pending">
              <ChecksTable checks={pendingChecks} onUpdateStatus={updateCheckStatus} />
            </TabsContent>
            <TabsContent value="cashed">
              <ChecksTable checks={cashedChecks} onUpdateStatus={updateCheckStatus} />
            </TabsContent>
            <TabsContent value="bounced">
              <ChecksTable checks={bouncedChecks} onUpdateStatus={updateCheckStatus} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ChecksTable({ 
  checks, 
  onUpdateStatus 
}: { 
  checks: Check[]; 
  onUpdateStatus: (checkId: string, status: Check['status']) => void;
}) {
  const getStatusBadge = (status: Check['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />معلق</Badge>;
      case 'cashed':
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />تم التحصيل</Badge>;
      case 'bounced':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />مرتد</Badge>;
      default:
        return null;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>رقم الشيك</TableHead>
          <TableHead>العميل</TableHead>
          <TableHead>البنك</TableHead>
          <TableHead>المبلغ</TableHead>
          <TableHead>تاريخ الاستحقاق</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>إجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {checks.map((check) => (
          <TableRow key={check.id}>
            <TableCell className="font-medium">{check.checkNumber}</TableCell>
            <TableCell>{check.customerName}</TableCell>
            <TableCell>{check.bankName}</TableCell>
            <TableCell>{check.amount.toLocaleString()} ج.م</TableCell>
            <TableCell>{new Date(check.dueDate).toLocaleDateString('ar-EG')}</TableCell>
            <TableCell>{getStatusBadge(check.status)}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                {check.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600"
                      onClick={() => onUpdateStatus(check.id, 'cashed')}
                    >
                      تحصيل
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => onUpdateStatus(check.id, 'bounced')}
                    >
                      ارتداد
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}