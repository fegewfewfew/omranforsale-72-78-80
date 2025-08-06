import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Users, Eye, RotateCcw, UserCheck, BarChart3, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { EmployeeDashboard } from "@/components/employees/EmployeeDashboard";
import { AttendanceSystem } from "@/components/employees/AttendanceSystem";
import { LeaveManagement } from "@/components/employees/LeaveManagement";
import { EmployeeProfile } from "@/components/employees/EmployeeProfile";

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  salary: number;
  phoneNumber: string;
  email: string;
  startDate: string;
  status: "active" | "inactive" | "vacation";
  nationalId: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export default function Employees() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [deletedEmployees, setDeletedEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('deletedEmployees');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("list");

  // Save to localStorage when employees change
  useEffect(() => {
    localStorage.setItem('employees', JSON.stringify(employees));
  }, [employees]);

  // Save deleted employees to localStorage when they change
  useEffect(() => {
    localStorage.setItem('deletedEmployees', JSON.stringify(deletedEmployees));
  }, [deletedEmployees]);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.nationalId?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      vacation: "outline"
    };
    
    const labels = {
      active: "نشط",
      inactive: "غير نشط",
      vacation: "في إجازة"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const handleEditEmployee = () => {
    if (editingEmployee) {
      setEmployees(employees.map(emp => 
        emp.id === editingEmployee.id ? editingEmployee : emp
      ));
      setEditingEmployee(null);
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات الموظف بنجاح",
      });
    }
  };

  const handleEditInputChange = (field: string, value: string | number) => {
    if (editingEmployee) {
      setEditingEmployee({ ...editingEmployee, [field]: value });
    }
  };

  const handleDeleteEmployee = (id: string) => {
    const employeeToDelete = employees.find(emp => emp.id === id);
    if (employeeToDelete) {
      setDeletedEmployees(prev => [...prev, employeeToDelete]);
      setEmployees(employees.filter(emp => emp.id !== id));
      toast({
        title: "تم الحذف",
        description: "تم حذف الموظف بنجاح",
      });
    }
  };

  const handleDeleteAllEmployees = () => {
    if (employees.length > 0) {
      setDeletedEmployees(prev => [...prev, ...employees]);
      setEmployees([]);
      toast({
        title: "تم الحذف",
        description: "تم حذف جميع الموظفين بنجاح",
      });
    }
  };

  const handleRestoreEmployees = () => {
    if (deletedEmployees.length > 0) {
      setEmployees(prev => [...prev, ...deletedEmployees]);
      setDeletedEmployees([]);
      toast({
        title: "تم الاستعادة",
        description: "تم استعادة جميع الموظفين المحذوفين",
      });
    }
  };

  const departments = [...new Set(employees.map(emp => emp.department))];
  const totalSalaries = employees.filter(emp => emp.status === "active").reduce((sum, emp) => sum + emp.salary, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-cairo text-foreground">إدارة الموظفين المتقدمة</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            لوحة التحكم
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            قائمة الموظفين
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            الحضور والانصراف
          </TabsTrigger>
          <TabsTrigger value="leaves" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            إدارة الإجازات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <EmployeeDashboard />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceSystem />
        </TabsContent>

        <TabsContent value="leaves">
          <LeaveManagement />
        </TabsContent>

        <TabsContent value="list">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-cairo text-foreground">إدارة الموظفين</h1>
        <div className="flex gap-2">
          {deletedEmployees.length > 0 && (
            <Button variant="outline" onClick={handleRestoreEmployees}>
              <RotateCcw className="ml-2 h-4 w-4" />
              استعادة الموظفين المحذوفين ({deletedEmployees.length})
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={employees.length === 0}>
                <Trash2 className="ml-2 h-4 w-4" />
                حذف جميع الموظفين
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد حذف جميع الموظفين</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من رغبتك في حذف جميع الموظفين؟ يمكنك استعادتهم لاحقاً من خيار الاستعادة.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllEmployees}>حذف الكل</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => navigate('/employees/new')}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة موظف جديد
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-cairo">إجمالي الموظفين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-cairo">الموظفين النشطين</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {employees.filter(emp => emp.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-cairo">عدد الأقسام</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-cairo">إجمالي الرواتب</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalaries.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
                <SelectItem value="vacation">في إجازة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Users className="h-5 w-5" />
            قائمة الموظفين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-tajawal">اسم الموظف</TableHead>
                <TableHead className="font-tajawal">المنصب</TableHead>
                <TableHead className="font-tajawal">القسم</TableHead>
                <TableHead className="font-tajawal">الراتب</TableHead>
                <TableHead className="font-tajawal">رقم الهاتف</TableHead>
                <TableHead className="font-tajawal">تاريخ التوظيف</TableHead>
                <TableHead className="font-tajawal">الحالة</TableHead>
                <TableHead className="font-tajawal">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.salary.toLocaleString()} ج.م</TableCell>
                  <TableCell>{employee.phoneNumber}</TableCell>
                  <TableCell>{new Date(employee.startDate).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>{getStatusBadge(employee.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingEmployee(employee)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingEmployee(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all" || departmentFilter !== "all" 
                ? "لا توجد نتائج مطابقة للبحث" 
                : "لا يوجد موظفين بعد"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Employee Dialog */}
      <Dialog open={!!viewingEmployee} onOpenChange={() => setViewingEmployee(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الموظف</DialogTitle>
          </DialogHeader>
          {viewingEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">الاسم الكامل</Label>
                  <p className="text-sm text-muted-foreground">{viewingEmployee.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">المنصب</Label>
                  <p className="text-sm text-muted-foreground">{viewingEmployee.position}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">القسم</Label>
                  <p className="text-sm text-muted-foreground">{viewingEmployee.department}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">الراتب</Label>
                  <p className="text-sm text-muted-foreground">{viewingEmployee.salary.toLocaleString()} ج.م</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">رقم الهاتف</Label>
                  <p className="text-sm text-muted-foreground">{viewingEmployee.phoneNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                  <p className="text-sm text-muted-foreground">{viewingEmployee.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">الرقم القومي</Label>
                  <p className="text-sm text-muted-foreground">{viewingEmployee.nationalId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">تاريخ التوظيف</Label>
                  <p className="text-sm text-muted-foreground">{new Date(viewingEmployee.startDate).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">العنوان</Label>
                <p className="text-sm text-muted-foreground">{viewingEmployee.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">جهة الاتصال في الطوارئ</Label>
                  <p className="text-sm text-muted-foreground">{viewingEmployee.emergencyContact}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">رقم الطوارئ</Label>
                  <p className="text-sm text-muted-foreground">{viewingEmployee.emergencyPhone}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">الحالة</Label>
                <div className="mt-1">
                  {getStatusBadge(viewingEmployee.status)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الموظف</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">الاسم الكامل</Label>
                  <Input
                    id="edit-name"
                    value={editingEmployee.name}
                    onChange={(e) => handleEditInputChange("name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-position">المنصب</Label>
                  <Input
                    id="edit-position"
                    value={editingEmployee.position}
                    onChange={(e) => handleEditInputChange("position", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-department">القسم</Label>
                  <Input
                    id="edit-department"
                    value={editingEmployee.department}
                    onChange={(e) => handleEditInputChange("department", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-salary">الراتب</Label>
                  <Input
                    id="edit-salary"
                    type="number"
                    value={editingEmployee.salary}
                    onChange={(e) => handleEditInputChange("salary", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phone">رقم الهاتف</Label>
                  <Input
                    id="edit-phone"
                    value={editingEmployee.phoneNumber}
                    onChange={(e) => handleEditInputChange("phoneNumber", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingEmployee.email}
                    onChange={(e) => handleEditInputChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-national-id">الرقم القومي</Label>
                  <Input
                    id="edit-national-id"
                    value={editingEmployee.nationalId}
                    onChange={(e) => handleEditInputChange("nationalId", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-start-date">تاريخ التوظيف</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editingEmployee.startDate}
                    onChange={(e) => handleEditInputChange("startDate", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-address">العنوان</Label>
                <Input
                  id="edit-address"
                  value={editingEmployee.address}
                  onChange={(e) => handleEditInputChange("address", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-emergency-contact">جهة الاتصال في الطوارئ</Label>
                  <Input
                    id="edit-emergency-contact"
                    value={editingEmployee.emergencyContact}
                    onChange={(e) => handleEditInputChange("emergencyContact", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-emergency-phone">رقم الطوارئ</Label>
                  <Input
                    id="edit-emergency-phone"
                    value={editingEmployee.emergencyPhone}
                    onChange={(e) => handleEditInputChange("emergencyPhone", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-status">الحالة</Label>
                <Select 
                  value={editingEmployee.status} 
                  onValueChange={(value) => handleEditInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="vacation">في إجازة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleEditEmployee} className="w-full">
                حفظ التغييرات
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
          </div>
        </TabsContent>
      </Tabs>

      {/* Employee Profile Dialog */}
      {viewingEmployee && (
        <EmployeeProfile 
          employeeId={viewingEmployee.id} 
          onClose={() => setViewingEmployee(null)}
        />
      )}
    </div>
  );
}