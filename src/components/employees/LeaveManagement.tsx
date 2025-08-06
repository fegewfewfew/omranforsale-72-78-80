import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Calendar as CalendarIcon, Plus, Search, Check, X, Clock, 
  FileText, User, AlertCircle, CheckCircle, XCircle, Plane,
  Heart, Stethoscope, GraduationCap, Home, Coffee
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { employeeManager } from "@/utils/employeeManager";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  leaveType: 'annual' | 'sick' | 'emergency' | 'maternity' | 'study' | 'unpaid';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  attachments?: string[];
}

interface LeaveBalance {
  employeeId: string;
  annualLeave: number;
  sickLeave: number;
  emergencyLeave: number;
  usedAnnual: number;
  usedSick: number;
  usedEmergency: number;
}

const leaveTypes = [
  { value: 'annual', label: 'إجازة سنوية', icon: Plane, color: 'bg-blue-100 text-blue-800' },
  { value: 'sick', label: 'إجازة مرضية', icon: Stethoscope, color: 'bg-red-100 text-red-800' },
  { value: 'emergency', label: 'إجازة طارئة', icon: AlertCircle, color: 'bg-orange-100 text-orange-800' },
  { value: 'maternity', label: 'إجازة أمومة', icon: Heart, color: 'bg-pink-100 text-pink-800' },
  { value: 'study', label: 'إجازة دراسية', icon: GraduationCap, color: 'bg-purple-100 text-purple-800' },
  { value: 'unpaid', label: 'إجازة بدون راتب', icon: Home, color: 'bg-gray-100 text-gray-800' }
];

export function LeaveManagement() {
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddingLeave, setIsAddingLeave] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [newLeaveRequest, setNewLeaveRequest] = useState({
    employeeId: "",
    leaveType: "",
    reason: "",
    days: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // حساب أيام الإجازة عند تغيير التواريخ
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setNewLeaveRequest(prev => ({ ...prev, days: diffDays }));
    }
  }, [startDate, endDate]);

  const loadData = () => {
    const employeeData = employeeManager.getEmployees().filter(emp => emp.status === 'active');
    setEmployees(employeeData);

    const savedRequests = JSON.parse(localStorage.getItem('leave_requests') || '[]');
    setLeaveRequests(savedRequests);

    // تحميل أو إنشاء أرصدة الإجازات
    let balances = JSON.parse(localStorage.getItem('leave_balances') || '[]');
    
    // إنشاء أرصدة للموظفين الجدد
    employeeData.forEach(emp => {
      if (!balances.find((b: LeaveBalance) => b.employeeId === emp.id)) {
        balances.push({
          employeeId: emp.id,
          annualLeave: 30, // 30 يوم إجازة سنوية
          sickLeave: 15,   // 15 يوم إجازة مرضية
          emergencyLeave: 5, // 5 أيام طوارئ
          usedAnnual: 0,
          usedSick: 0,
          usedEmergency: 0
        });
      }
    });
    
    localStorage.setItem('leave_balances', JSON.stringify(balances));
    setLeaveBalances(balances);
  };

  const handleSubmitLeaveRequest = () => {
    if (!newLeaveRequest.employeeId || !newLeaveRequest.leaveType || !startDate || !endDate) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const employee = employees.find(emp => emp.id === newLeaveRequest.employeeId);
    if (!employee) return;

    const leaveRequest: LeaveRequest = {
      id: `LEAVE_${Date.now()}_${newLeaveRequest.employeeId}`,
      employeeId: newLeaveRequest.employeeId,
      employeeName: employee.name,
      employeePosition: employee.position,
      leaveType: newLeaveRequest.leaveType as any,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      days: newLeaveRequest.days,
      reason: newLeaveRequest.reason,
      status: 'pending',
      requestDate: new Date().toISOString()
    };

    const updatedRequests = [...leaveRequests, leaveRequest];
    setLeaveRequests(updatedRequests);
    localStorage.setItem('leave_requests', JSON.stringify(updatedRequests));

    // إعادة تعيين النموذج
    setNewLeaveRequest({ employeeId: "", leaveType: "", reason: "", days: 0 });
    setStartDate(undefined);
    setEndDate(undefined);
    setIsAddingLeave(false);

    toast({
      title: "تم الإرسال",
      description: "تم إرسال طلب الإجازة بنجاح",
    });
  };

  const handleApproveReject = (requestId: string, action: 'approve' | 'reject', reason?: string) => {
    const updatedRequests = leaveRequests.map(request => {
      if (request.id === requestId) {
        const updatedRequest = {
          ...request,
          status: action === 'approve' ? 'approved' as const : 'rejected' as const,
          approvedBy: 'المدير العام',
          approvedDate: new Date().toISOString(),
          rejectionReason: reason
        };

        // تحديث رصيد الإجازات عند الموافقة
        if (action === 'approve') {
          const balances = [...leaveBalances];
          const empBalanceIndex = balances.findIndex(b => b.employeeId === request.employeeId);
          
          if (empBalanceIndex !== -1) {
            const balance = balances[empBalanceIndex];
            
            switch (request.leaveType) {
              case 'annual':
                balance.usedAnnual += request.days;
                break;
              case 'sick':
                balance.usedSick += request.days;
                break;
              case 'emergency':
                balance.usedEmergency += request.days;
                break;
            }
            
            setLeaveBalances(balances);
            localStorage.setItem('leave_balances', JSON.stringify(balances));
          }
        }

        return updatedRequest;
      }
      return request;
    });

    setLeaveRequests(updatedRequests);
    localStorage.setItem('leave_requests', JSON.stringify(updatedRequests));

    toast({
      title: action === 'approve' ? "تم الموافقة" : "تم الرفض",
      description: `تم ${action === 'approve' ? 'الموافقة على' : 'رفض'} طلب الإجازة`,
    });
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    const config = {
      pending: { variant: "outline" as const, label: "قيد المراجعة", icon: Clock },
      approved: { variant: "default" as const, label: "موافق عليها", icon: CheckCircle },
      rejected: { variant: "destructive" as const, label: "مرفوضة", icon: XCircle }
    };

    const { variant, label, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getLeaveTypeBadge = (type: LeaveRequest['leaveType']) => {
    const leaveType = leaveTypes.find(t => t.value === type);
    if (!leaveType) return null;

    const Icon = leaveType.icon;
    return (
      <Badge variant="outline" className={`${leaveType.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {leaveType.label}
      </Badge>
    );
  };

  const getEmployeeBalance = (employeeId: string) => {
    return leaveBalances.find(b => b.employeeId === employeeId);
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = request.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingRequests = leaveRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = leaveRequests.filter(r => r.status === 'approved').length;
  const rejectedRequests = leaveRequests.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-mada-heading">إدارة الإجازات</h2>
        <Dialog open={isAddingLeave} onOpenChange={setIsAddingLeave}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              طلب إجازة جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>طلب إجازة جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الموظف</Label>
                  <Select 
                    value={newLeaveRequest.employeeId} 
                    onValueChange={(value) => setNewLeaveRequest(prev => ({ ...prev, employeeId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name} - {emp.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>نوع الإجازة</Label>
                  <Select 
                    value={newLeaveRequest.leaveType} 
                    onValueChange={(value) => setNewLeaveRequest(prev => ({ ...prev, leaveType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الإجازة" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>تاريخ البداية</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>تاريخ النهاية</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>عدد الأيام</Label>
                  <Input value={newLeaveRequest.days} readOnly className="bg-muted" />
                </div>
              </div>

              <div>
                <Label>سبب الإجازة</Label>
                <Textarea
                  placeholder="اكتب سبب طلب الإجازة..."
                  value={newLeaveRequest.reason}
                  onChange={(e) => setNewLeaveRequest(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* عرض رصيد الإجازات للموظف المختار */}
              {newLeaveRequest.employeeId && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">رصيد الإجازات:</h4>
                  {(() => {
                    const balance = getEmployeeBalance(newLeaveRequest.employeeId);
                    if (!balance) return <p className="text-sm text-muted-foreground">لا توجد بيانات</p>;
                    
                    return (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">السنوية: </span>
                          <span className="font-medium">{balance.annualLeave - balance.usedAnnual}/{balance.annualLeave}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">المرضية: </span>
                          <span className="font-medium">{balance.sickLeave - balance.usedSick}/{balance.sickLeave}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الطوارئ: </span>
                          <span className="font-medium">{balance.emergencyLeave - balance.usedEmergency}/{balance.emergencyLeave}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingLeave(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmitLeaveRequest}>
                إرسال الطلب
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">قيد المراجعة</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{pendingRequests}</div>
            <p className="text-xs text-yellow-600">طلب يحتاج موافقة</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">موافق عليها</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{approvedRequests}</div>
            <p className="text-xs text-green-600">طلب معتمد</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">مرفوضة</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{rejectedRequests}</div>
            <p className="text-xs text-red-600">طلب مرفوض</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">إجمالي الطلبات</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{leaveRequests.length}</div>
            <p className="text-xs text-blue-600">طلب إجازة</p>
          </CardContent>
        </Card>
      </div>

      {/* فلاتر البحث */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في الطلبات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="approved">موافق عليها</SelectItem>
                <SelectItem value="rejected">مرفوضة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول الطلبات */}
      <Card>
        <CardHeader>
          <CardTitle>طلبات الإجازات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>نوع الإجازة</TableHead>
                <TableHead>فترة الإجازة</TableHead>
                <TableHead>عدد الأيام</TableHead>
                <TableHead>السبب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الطلب</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.employeeName}</div>
                      <div className="text-sm text-muted-foreground">{request.employeePosition}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getLeaveTypeBadge(request.leaveType)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(request.startDate).toLocaleDateString('ar-EG')}</div>
                      <div className="text-muted-foreground">إلى</div>
                      <div>{new Date(request.endDate).toLocaleDateString('ar-EG')}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">{request.days}</TableCell>
                  <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{new Date(request.requestDate).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveReject(request.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleApproveReject(request.id, 'reject', 'لم يتم تحديد السبب')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد طلبات إجازات
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}