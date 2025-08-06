import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Edit, Trash2, Users, DollarSign, Calculator, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { payrollManager, PayrollRecord } from "@/utils/payrollManager";
import { employeeManager, Employee } from "@/utils/employeeManager";

const mockEmployees: Employee[] = [];
const mockPayrollRecords: PayrollRecord[] = [];

export default function Payroll() {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    return employeeManager.getEmployees().filter(emp => emp.status === 'active');
  });
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    return payrollManager.getPayrollRecords();
  });
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const [isEmployeeOfMonthDialogOpen, setIsEmployeeOfMonthDialogOpen] = useState(false);
  const [selectedEmployeeOfMonth, setSelectedEmployeeOfMonth] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    department: "",
    basicSalary: "",
    allowances: "",
    deductions: "",
    hireDate: ""
  });

  const months = [
    { value: 1, label: "يناير" },
    { value: 2, label: "فبراير" },
    { value: 3, label: "مارس" },
    { value: 4, label: "أبريل" },
    { value: 5, label: "مايو" },
    { value: 6, label: "يونيو" },
    { value: 7, label: "يوليو" },
    { value: 8, label: "أغسطس" },
    { value: 9, label: "سبتمبر" },
    { value: 10, label: "أكتوبر" },
    { value: 11, label: "نوفمبر" },
    { value: 12, label: "ديسمبر" }
  ];

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.position || !newEmployee.basicSalary) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const basicSalary = parseFloat(newEmployee.basicSalary);
    const allowances = parseFloat(newEmployee.allowances) || 0;
    const deductions = parseFloat(newEmployee.deductions) || 0;
    const netSalary = basicSalary + allowances - deductions;

    // Add employee using employeeManager
    const success = employeeManager.addEmployee({
      name: newEmployee.name,
      position: newEmployee.position,
      department: newEmployee.department || "غير محدد",
      salary: basicSalary,
      phoneNumber: '',
      email: '',
      nationalId: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      startDate: newEmployee.hireDate || new Date().toISOString().split('T')[0],
      status: 'active'
    });

    if (success) {
      setEmployees(employeeManager.getEmployees().filter(emp => emp.status === 'active'));
    }
    
    setNewEmployee({
      name: "",
      position: "",
      department: "",
      basicSalary: "",
      allowances: "",
      deductions: "",
      hireDate: ""
    });
    setIsAddEmployeeDialogOpen(false);

    if (success) {
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الموظف بنجاح",
      });
    } else {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الموظف",
        variant: "destructive",
      });
    }
  };

  const generatePayroll = () => {
    const result = payrollManager.generatePayroll(selectedMonth, selectedYear);
    
    if (result.success) {
      setPayrollRecords(payrollManager.getPayrollRecords());
      setIsPayrollDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: `${result.message} - تم إنشاء ${result.recordsGenerated} سجل راتب`,
      });
    } else {
      toast({
        title: "خطأ",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const markAsPaid = (recordId: string) => {
    const success = payrollManager.paySalary(recordId, 'bank');
    
    if (success) {
      setPayrollRecords(payrollManager.getPayrollRecords());
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل دفع الراتب وإضافته للنظام المالي المتكامل",
      });
    } else {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل دفع الراتب",
        variant: "destructive",
      });
    }
  };

  const selectEmployeeOfMonth = () => {
    if (!selectedEmployeeOfMonth) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار موظف",
        variant: "destructive",
      });
      return;
    }

    const employee = employees.find(emp => emp.id === selectedEmployeeOfMonth);
    if (employee) {
      toast({
        title: "تم بنجاح",
        description: `تم اختيار ${employee.name} كموظف الشهر`,
      });
      setIsEmployeeOfMonthDialogOpen(false);
      setSelectedEmployeeOfMonth("");
    }
  };

  // Use integrated payroll statistics
  const payrollStats = payrollManager.getPayrollStatistics();
  const employeeStats = employeeManager.getEmployeeStatistics();
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthRecords = payrollManager.getPayrollByPeriod(currentMonth, currentYear);
  const paidThisMonth = currentMonthRecords.filter(record => record.isPaid);
  const unpaidThisMonth = currentMonthRecords.filter(record => !record.isPaid);

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-cairo">الأجور والمرتبات</h1>
          <p className="text-muted-foreground font-tajawal">إدارة رواتب ومستحقات الموظفين</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isPayrollDialogOpen} onOpenChange={setIsPayrollDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calculator className="h-4 w-4" />
                إنشاء كشف رواتب
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء كشف رواتب شهري</DialogTitle>
                <DialogDescription>
                  اختر الشهر والسنة لإنشاء كشف الرواتب
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>الشهر</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>السنة</Label>
                  <Input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={generatePayroll}>إنشاء كشف الرواتب</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEmployeeOfMonthDialogOpen} onOpenChange={setIsEmployeeOfMonthDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" variant="outline">
                <Users className="h-4 w-4" />
                موظف الشهر
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>اختيار موظف الشهر</DialogTitle>
                <DialogDescription>
                  اختر الموظف المتميز لهذا الشهر
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>الموظف</Label>
                  <Select value={selectedEmployeeOfMonth} onValueChange={setSelectedEmployeeOfMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر موظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.filter(emp => emp.status === 'active').map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={selectEmployeeOfMonth}>اختيار كموظف الشهر</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-cairo">إجمالي الموظفين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              موظف نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-cairo">إجمالي الرواتب الشهرية</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollStats.totalPayrollBudget.toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground">
              إجمالي الرواتب الشهرية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-cairo">مدفوع هذا الشهر</CardTitle>
            <Badge variant="default" className="bg-green-500">
              {paidThisMonth.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paidThisMonth.reduce((sum, record) => sum + record.netSalary, 0).toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              رواتب مدفوعة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-cairo">مستحق الدفع</CardTitle>
            <Badge variant="secondary" className="text-amber-600">
              {unpaidThisMonth.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {unpaidThisMonth.reduce((sum, record) => sum + record.netSalary, 0).toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              رواتب غير مدفوعة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employees">الموظفين ({employees.length})</TabsTrigger>
          <TabsTrigger value="payroll">كشوف الرواتب ({payrollRecords.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle className="font-cairo">قائمة الموظفين</CardTitle>
              <CardDescription className="font-tajawal">إدارة بيانات الموظفين ورواتبهم</CardDescription>
            </CardHeader>
            <CardContent>
              {employees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-tajawal">الاسم</TableHead>
                      <TableHead className="font-tajawal">المنصب</TableHead>
                      <TableHead className="font-tajawal">القسم</TableHead>
                      <TableHead className="font-tajawal">الراتب الأساسي</TableHead>
                      <TableHead className="font-tajawal">البدلات</TableHead>
                      <TableHead className="font-tajawal">الخصومات</TableHead>
                      <TableHead className="font-tajawal">صافي الراتب</TableHead>
                      <TableHead className="font-tajawal">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.salary.toLocaleString()} ج.م</TableCell>
                        <TableCell>0 ج.م</TableCell>
                        <TableCell>0 ج.م</TableCell>
                        <TableCell className="font-bold">{employee.salary.toLocaleString()} ج.م</TableCell>
                        <TableCell>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status === 'active' ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا يوجد موظفين مسجلين بعد. اضغط على "إضافة موظف" لإضافة موظف جديد.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle className="font-cairo">كشوف الرواتب</CardTitle>
              <CardDescription className="font-tajawal">متابعة دفع الرواتب الشهرية</CardDescription>
            </CardHeader>
            <CardContent>
              {payrollRecords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-tajawal">الموظف</TableHead>
                      <TableHead className="font-tajawal">الشهر/السنة</TableHead>
                      <TableHead className="font-tajawal">الراتب الأساسي</TableHead>
                      <TableHead className="font-tajawal">البدلات</TableHead>
                      <TableHead className="font-tajawal">الخصومات</TableHead>
                      <TableHead className="font-tajawal">صافي الراتب</TableHead>
                      <TableHead className="font-tajawal">حالة الدفع</TableHead>
                      <TableHead className="font-tajawal">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.employeeName}</TableCell>
                         <TableCell>
                           {months.find(m => m.value === record.month)?.label} {record.year}
                         </TableCell>
                        <TableCell>{record.basicSalary.toLocaleString()} ج.م</TableCell>
                        <TableCell>{record.allowances.toLocaleString()} ج.م</TableCell>
                        <TableCell>{record.deductions.toLocaleString()} ج.م</TableCell>
                        <TableCell className="font-bold">{record.netSalary.toLocaleString()} ج.م</TableCell>
                        <TableCell>
                          <Badge variant={record.isPaid ? 'default' : 'secondary'} className={record.isPaid ? 'bg-green-500' : 'text-amber-600'}>
                            {record.isPaid ? 'مدفوع' : 'معلق'}
                          </Badge>
                          {record.isPaid && record.paidDate && (
                            <div className="text-xs text-muted-foreground mt-1">
                              تم الدفع: {new Date(record.paidDate).toLocaleDateString('ar-EG')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {!record.isPaid && (
                            <Button
                              size="sm"
                              onClick={() => markAsPaid(record.id)}
                              className="gap-1"
                            >
                              تسجيل الدفع
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد كشوف رواتب بعد. اضغط على "إنشاء كشف رواتب" لإنشاء كشف جديد.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}