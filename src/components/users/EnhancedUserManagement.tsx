import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { RoleSelector, RoleInfo } from "@/components/auth/RoleSelector";
import { User, UserRole, DefaultRoles } from "@/types/auth";
import { Employee, employeeManager } from "@/utils/employeeManager";
import { storage } from "@/utils/storage";
import { userActivityLogger } from "@/utils/userActivityLogger";
import { toast } from "sonner";
import { 
  UserPlus, Edit, Trash2, Shield, Eye, Search, Users, UserX, RotateCcw,
  Building, Clock, Activity, TrendingUp, BarChart3, UserCheck, AlertTriangle,
  Link, Unlink, FileText, Download, Settings, CheckCircle, XCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface UserEmployeeLink {
  userId: string;
  employeeId: string;
  linkedAt: string;
  linkedBy: string;
}

interface UserActivityStats {
  totalLogins: number;
  lastLogin: string;
  activeSessionTime: number;
  moduleAccess: { [key: string]: number };
  operationsPerformed: number;
}

export function EnhancedUserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [userEmployeeLinks, setUserEmployeeLinks] = useState<UserEmployeeLink[]>([]);
  const [userStats, setUserStats] = useState<{ [key: string]: UserActivityStats }>({});
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isLinkEmployeeOpen, setIsLinkEmployeeOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    roleId: "",
    department: "",
    employeeId: ""
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    loadUsers();
    loadEmployees();
    loadUserEmployeeLinks();
    loadUserStats();
    loadDeletedUsers();
  };

  const loadUsers = () => {
    const savedUsers = storage.getItem('system_users', []);
    if (savedUsers.length === 0 && currentUser) {
      setUsers([currentUser]);
      storage.setItem('system_users', [currentUser]);
    } else {
      setUsers(savedUsers);
    }
  };

  const loadEmployees = () => {
    const allEmployees = employeeManager.getEmployees();
    setEmployees(allEmployees);
  };

  const loadUserEmployeeLinks = () => {
    const links = storage.getItem('user_employee_links', []);
    setUserEmployeeLinks(links);
  };

  const loadUserStats = () => {
    const stats = storage.getItem('user_activity_stats', {});
    setUserStats(stats);
  };

  const loadDeletedUsers = () => {
    const deleted = storage.getItem('deleted_users', []);
    setDeletedUsers(deleted);
  };

  // ربط مستخدم بموظف
  const linkUserToEmployee = (userId: string, employeeId: string) => {
    const existingLink = userEmployeeLinks.find(
      link => link.userId === userId || link.employeeId === employeeId
    );

    if (existingLink) {
      toast.error("المستخدم أو الموظف مرتبط بالفعل");
      return;
    }

    const newLink: UserEmployeeLink = {
      userId,
      employeeId,
      linkedAt: new Date().toISOString(),
      linkedBy: currentUser?.id || 'system'
    };

    const updatedLinks = [...userEmployeeLinks, newLink];
    setUserEmployeeLinks(updatedLinks);
    storage.setItem('user_employee_links', updatedLinks);

    // تحديث المستخدم مع معلومات الموظف
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            department: employee.department,
            phone: employee.phoneNumber
          };
        }
        return user;
      });
      setUsers(updatedUsers);
      storage.setItem('system_users', updatedUsers);
    }

    toast.success("تم ربط المستخدم بالموظف بنجاح");
    setIsLinkEmployeeOpen(false);
  };

  // إلغاء ربط مستخدم بموظف
  const unlinkUserFromEmployee = (userId: string) => {
    const updatedLinks = userEmployeeLinks.filter(link => link.userId !== userId);
    setUserEmployeeLinks(updatedLinks);
    storage.setItem('user_employee_links', updatedLinks);
    toast.success("تم إلغاء الربط بنجاح");
  };

  // الحصول على الموظف المرتبط بالمستخدم
  const getLinkedEmployee = (userId: string): Employee | null => {
    const link = userEmployeeLinks.find(link => link.userId === userId);
    if (!link) return null;
    return employees.find(emp => emp.id === link.employeeId) || null;
  };

  // تصفية المستخدمين
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role.nameAr.includes(searchTerm);
    
    const matchesRole = selectedRole === "all" || user.role.id === selectedRole;
    
    const matchesDepartment = selectedDepartment === "all" || user.department === selectedDepartment;

    return matchesSearch && matchesRole && matchesDepartment;
  });

  // إحصائيات المستخدمين
  const getUserStatistics = () => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const inactive = users.filter(u => !u.isActive).length;
    const linked = userEmployeeLinks.length;
    const unlinked = total - linked;
    
    const roleDistribution = DefaultRoles.map(role => ({
      name: role.nameAr,
      value: users.filter(u => u.role.id === role.id).length,
      color: COLORS[DefaultRoles.indexOf(role) % COLORS.length]
    }));

    const departments = [...new Set(users.map(u => u.department).filter(Boolean))];
    const departmentDistribution = departments.map(dept => ({
      name: dept,
      value: users.filter(u => u.department === dept).length
    }));

    return {
      total,
      active,
      inactive,
      linked,
      unlinked,
      roleDistribution,
      departmentDistribution,
      departments
    };
  };

  const stats = getUserStatistics();

  // إضافة مستخدم جديد مع ربط اختياري بموظف
  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.roleId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const selectedRole = DefaultRoles.find(r => r.id === newUser.roleId);
    if (!selectedRole) {
      toast.error("يرجى اختيار دور صحيح");
      return;
    }

    const user: User = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: selectedRole,
      isActive: true,
      createdAt: new Date().toISOString(),
      permissions: [],
      department: newUser.department
    };

    const updatedUsers = [...users, user];
    setUsers(updatedUsers);
    storage.setItem('system_users', updatedUsers);

    // ربط بموظف إذا تم اختياره
    if (newUser.employeeId) {
      linkUserToEmployee(user.id, newUser.employeeId);
    }

    if (currentUser) {
      userActivityLogger.logUserCreation(user, currentUser);
    }

    setIsAddUserOpen(false);
    setNewUser({ name: "", email: "", phone: "", roleId: "", department: "", employeeId: "" });
    toast.success("تم إضافة المستخدم بنجاح");
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  const getLastLoginText = (lastLogin?: string) => {
    if (!lastLogin) return "لم يسجل دخول من قبل";
    
    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffHours = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "منذ قليل";
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "منذ يوم";
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    
    return loginDate.toLocaleDateString('ar-SA');
  };

  return (
    <PermissionGuard module="users" action="read">
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">إدارة المستخدمين المتقدمة</h1>
          </div>
          
          <div className="flex gap-2">
            <PermissionGuard module="users" action="export" showAlert={false}>
              <Button variant="outline">
                <Download className="h-4 w-4 ml-2" />
                تصدير البيانات
              </Button>
            </PermissionGuard>
            
            <PermissionGuard module="users" action="create" showAlert={false}>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 ml-2" />
                    إضافة مستخدم جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">الاسم *</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          placeholder="اسم المستخدم"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">البريد الإلكتروني *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          placeholder="البريد الإلكتروني"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">رقم الهاتف</Label>
                        <Input
                          id="phone"
                          value={newUser.phone}
                          onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                          placeholder="رقم الهاتف"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="department">القسم</Label>
                        <Input
                          id="department"
                          value={newUser.department}
                          onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                          placeholder="القسم"
                        />
                      </div>
                    </div>
                    
                    <RoleSelector
                      value={newUser.roleId}
                      onValueChange={(value) => setNewUser({...newUser, roleId: value})}
                      label="الدور الوظيفي *"
                      showDescription={true}
                    />
                    
                    <div>
                      <Label htmlFor="employee">ربط بموظف (اختياري)</Label>
                      <Select 
                        value={newUser.employeeId} 
                        onValueChange={(value) => setNewUser({...newUser, employeeId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر موظف للربط" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">بدون ربط</SelectItem>
                          {employees
                            .filter(emp => !userEmployeeLinks.some(link => link.employeeId === emp.id))
                            .map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.name} - {employee.position}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddUser} className="flex-1">
                        إضافة المستخدم
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </PermissionGuard>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">نشط</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                  <p className="text-sm text-muted-foreground">غير نشط</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Link className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.linked}</p>
                  <p className="text-sm text-muted-foreground">مرتبط بموظف</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.departments.length}</p>
                  <p className="text-sm text-muted-foreground">الأقسام</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
            <TabsTrigger value="management">الإدارة</TabsTrigger>
            <TabsTrigger value="integration">التكامل</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Role Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    توزيع الأدوار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.roleDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} (${value})`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.roleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    توزيع الأقسام
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.departmentDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>فلاتر البحث</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search">البحث</Label>
                    <div className="relative">
                      <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="البحث في المستخدمين..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-8"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="role-filter">الدور</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأدوار</SelectItem>
                        {DefaultRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="department-filter">القسم</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأقسام</SelectItem>
                        {stats.departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedRole("all");
                        setSelectedDepartment("all");
                      }}
                      className="w-full"
                    >
                      مسح الفلاتر
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>قائمة المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>الدور</TableHead>
                        <TableHead>القسم</TableHead>
                        <TableHead>الموظف المرتبط</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>آخر دخول</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => {
                        const linkedEmployee = getLinkedEmployee(user.id);
                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {user.role.nameAr}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{user.department || "غير محدد"}</span>
                            </TableCell>
                            <TableCell>
                              {linkedEmployee ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm">{linkedEmployee.name}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-muted-foreground">غير مرتبط</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.isActive ? "default" : "secondary"}>
                                {user.isActive ? "نشط" : "غير نشط"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {getLastLoginText(user.lastLogin)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {!linkedEmployee && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setIsLinkEmployeeOpen(true);
                                    }}
                                  >
                                    <Link className="h-4 w-4" />
                                  </Button>
                                )}
                                {linkedEmployee && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => unlinkUserFromEmployee(user.id)}
                                  >
                                    <Unlink className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>التحليلات المتقدمة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">سيتم تطوير تحليلات متقدمة للمستخدمين قريباً...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management">
            <Card>
              <CardHeader>
                <CardTitle>أدوات الإدارة المتقدمة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">أدوات إدارة المستخدمين المتقدمة...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration">
            <Card>
              <CardHeader>
                <CardTitle>تكامل الأنظمة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">إدارة تكامل المستخدمين مع الأنظمة الأخرى...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Link Employee Dialog */}
        <Dialog open={isLinkEmployeeOpen} onOpenChange={setIsLinkEmployeeOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ربط المستخدم بموظف</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>المستخدم المحدد</Label>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedUser ? getInitials(selectedUser.name) : ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label>اختر الموظف للربط</Label>
                <Select 
                  onValueChange={(employeeId) => {
                    if (selectedUser) {
                      linkUserToEmployee(selectedUser.id, employeeId);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر موظف" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(emp => !userEmployeeLinks.some(link => link.employeeId === emp.id))
                      .map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{employee.name}</span>
                            <span className="text-sm text-muted-foreground mr-2">
                              {employee.position} - {employee.department}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                onClick={() => setIsLinkEmployeeOpen(false)}
                className="w-full"
              >
                إلغاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}