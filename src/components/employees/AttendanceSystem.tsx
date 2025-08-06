import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Clock, CheckCircle, XCircle, AlertTriangle, Calendar as CalendarIcon,
  Search, Download, Filter, Plus, UserCheck, Timer, Coffee
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { employeeManager } from "@/utils/employeeManager";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'overtime';
  workingHours?: number;
  overtime?: number;
  notes?: string;
  location?: string;
}

export function AttendanceSystem() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  useEffect(() => {
    loadEmployees();
    loadAttendanceForDate(selectedDate);
  }, [selectedDate]);

  const loadEmployees = () => {
    const employeeData = employeeManager.getEmployees().filter(emp => emp.status === 'active');
    setEmployees(employeeData);
  };

  const loadAttendanceForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const savedAttendance = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    const dateRecords = savedAttendance.filter((record: AttendanceRecord) => record.date === dateStr);
    setAttendanceRecords(dateRecords);
  };

  const markAttendance = (employeeId: string, type: 'check-in' | 'check-out') => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    const savedAttendance = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    const existingRecord = savedAttendance.find((record: AttendanceRecord) => 
      record.employeeId === employeeId && record.date === dateStr
    );

    if (existingRecord) {
      if (type === 'check-out' && !existingRecord.checkOut) {
        existingRecord.checkOut = currentTime;
        // حساب ساعات العمل
        if (existingRecord.checkIn) {
          const checkInTime = new Date(`${dateStr} ${existingRecord.checkIn}`);
          const checkOutTime = new Date(`${dateStr} ${currentTime}`);
          const workingHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
          existingRecord.workingHours = Math.round(workingHours * 100) / 100;
          
          // حساب الإضافي (أكثر من 8 ساعات)
          if (workingHours > 8) {
            existingRecord.overtime = Math.round((workingHours - 8) * 100) / 100;
          }
        }
        
        const index = savedAttendance.findIndex((r: AttendanceRecord) => r.id === existingRecord.id);
        savedAttendance[index] = existingRecord;
      }
    } else if (type === 'check-in') {
      // تحديد حالة الحضور بناءً على الوقت
      const checkInHour = new Date().getHours();
      let status: AttendanceRecord['status'] = 'present';
      
      if (checkInHour > 9) { // متأخر بعد التاسعة
        status = 'late';
      }
      
      const newRecord: AttendanceRecord = {
        id: `ATT_${Date.now()}_${employeeId}`,
        employeeId,
        employeeName: employee.name,
        date: dateStr,
        checkIn: currentTime,
        status,
        location: 'المكتب الرئيسي'
      };
      
      savedAttendance.push(newRecord);
    }

    localStorage.setItem('attendance_records', JSON.stringify(savedAttendance));
    loadAttendanceForDate(selectedDate);
    
    toast({
      title: "تم التسجيل",
      description: `تم تسجيل ${type === 'check-in' ? 'الحضور' : 'الانصراف'} للموظف ${employee.name}`,
    });
  };

  const markAbsent = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const savedAttendance = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    
    // التحقق من عدم وجود سجل سابق
    const existingRecord = savedAttendance.find((record: AttendanceRecord) => 
      record.employeeId === employeeId && record.date === dateStr
    );

    if (existingRecord) {
      toast({
        title: "خطأ",
        description: "يوجد سجل حضور لهذا الموظف في هذا التاريخ",
        variant: "destructive"
      });
      return;
    }

    const absentRecord: AttendanceRecord = {
      id: `ATT_${Date.now()}_${employeeId}`,
      employeeId,
      employeeName: employee.name,
      date: dateStr,
      status: 'absent',
      notes: 'تم تسجيله كغائب'
    };

    savedAttendance.push(absentRecord);
    localStorage.setItem('attendance_records', JSON.stringify(savedAttendance));
    loadAttendanceForDate(selectedDate);

    toast({
      title: "تم التسجيل",
      description: `تم تسجيل غياب الموظف ${employee.name}`,
    });
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    const config = {
      present: { variant: "default" as const, label: "حاضر", color: "text-green-600" },
      late: { variant: "secondary" as const, label: "متأخر", color: "text-yellow-600" },
      absent: { variant: "destructive" as const, label: "غائب", color: "text-red-600" },
      'half-day': { variant: "outline" as const, label: "نصف يوم", color: "text-blue-600" },
      overtime: { variant: "default" as const, label: "إضافي", color: "text-purple-600" }
    };

    const { variant, label } = config[status] || config.present;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayStats = {
    present: attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length,
    late: attendanceRecords.filter(r => r.status === 'late').length,
    total: employees.length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-mada-heading">نظام الحضور والانصراف</h2>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                تسجيل حضور
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تسجيل حضور موظف</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>اختر الموظف</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر موظف" />
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
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      if (selectedEmployee) {
                        markAttendance(selectedEmployee, 'check-in');
                        setSelectedEmployee("");
                      }
                    }}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 ml-2" />
                    تسجيل الحضور
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedEmployee) {
                        markAttendance(selectedEmployee, 'check-out');
                        setSelectedEmployee("");
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 ml-2" />
                    تسجيل الانصراف
                  </Button>
                </div>
                <Button 
                  onClick={() => {
                    if (selectedEmployee) {
                      markAbsent(selectedEmployee);
                      setSelectedEmployee("");
                    }
                  }}
                  variant="destructive"
                  className="w-full"
                >
                  <AlertTriangle className="h-4 w-4 ml-2" />
                  تسجيل غياب
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">الحاضرين</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{todayStats.present}</div>
            <p className="text-xs text-green-600">
              {((todayStats.present / todayStats.total) * 100).toFixed(1)}% من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">الغائبين</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{todayStats.absent}</div>
            <p className="text-xs text-red-600">موظف غائب</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">المتأخرين</CardTitle>
            <Timer className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{todayStats.late}</div>
            <p className="text-xs text-yellow-600">موظف متأخر</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">إجمالي الموظفين</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{todayStats.total}</div>
            <p className="text-xs text-blue-600">موظف نشط</p>
          </CardContent>
        </Card>
      </div>

      {/* التحكم في التاريخ والبحث */}
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="md:w-80">
          <CardHeader>
            <CardTitle className="text-lg">اختر التاريخ</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="flex-1 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في الموظفين..."
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
                <SelectItem value="present">حاضر</SelectItem>
                <SelectItem value="absent">غائب</SelectItem>
                <SelectItem value="late">متأخر</SelectItem>
                <SelectItem value="half-day">نصف يوم</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* جدول الحضور */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                حضور يوم {selectedDate.toLocaleDateString('ar-EG')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الموظف</TableHead>
                    <TableHead>وقت الحضور</TableHead>
                    <TableHead>وقت الانصراف</TableHead>
                    <TableHead>ساعات العمل</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employeeName}</TableCell>
                      <TableCell>{record.checkIn || '-'}</TableCell>
                      <TableCell>{record.checkOut || '-'}</TableCell>
                      <TableCell>
                        {record.workingHours ? `${record.workingHours} ساعة` : '-'}
                        {record.overtime && (
                          <Badge variant="outline" className="mr-1 text-purple-600">
                            +{record.overtime} إضافي
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>{record.notes || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!record.checkOut && record.checkIn && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markAttendance(record.employeeId, 'check-out')}
                            >
                              انصراف
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredRecords.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد سجلات حضور لهذا التاريخ
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}