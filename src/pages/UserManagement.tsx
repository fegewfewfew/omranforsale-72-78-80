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
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { RoleSelector, RoleInfo } from "@/components/auth/RoleSelector";
import { EnhancedUserManagement } from "@/components/users/EnhancedUserManagement";
import { UserAnalyticsDashboard } from "@/components/users/UserAnalyticsDashboard";
import { User, UserRole, DefaultRoles } from "@/types/auth";
import { storage } from "@/utils/storage";
import { userActivityLogger } from "@/utils/userActivityLogger";
import { toast } from "sonner";
import { UserPlus, Edit, Trash2, Shield, Eye, Search, Users, UserX, RotateCcw, BarChart3, Settings } from "lucide-react";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEnhanced, setShowEnhanced] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    roleId: "",
    department: ""
  });

  useEffect(() => {
    loadUsers();
    loadDeletedUsers();
  }, []);

  const loadDeletedUsers = () => {
    const saved = storage.getItem('deleted_users', []);
    setDeletedUsers(saved);
  };

  const loadUsers = () => {
    const savedUsers = storage.getItem('system_users', []);
    
    // عرض المستخدم الحالي فقط إذا لم يكن هناك مستخدمين محفوظين
    if (savedUsers.length === 0 && currentUser) {
      setUsers([currentUser]);
      storage.setItem('system_users', [currentUser]);
    } else {
      setUsers(savedUsers);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.nameAr.includes(searchTerm)
  );

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
    
    // Log user creation activity
    if (currentUser) {
      userActivityLogger.logUserCreation(user, currentUser);
    }
    
    setIsAddUserOpen(false);
    setNewUser({ name: "", email: "", phone: "", roleId: "", department: "" });
    toast.success("تم إضافة المستخدم بنجاح");
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;

    const updatedUsers = users.map(u => 
      u.id === selectedUser.id ? selectedUser : u
    );
    
    setUsers(updatedUsers);
    storage.setItem('system_users', updatedUsers);
    
    // Log user update activity
    if (currentUser) {
      userActivityLogger.logUserUpdate(selectedUser, currentUser, {});
    }
    
    setIsEditUserOpen(false);
    setSelectedUser(null);
    toast.success("تم تحديث المستخدم بنجاح");
  };

  const toggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    );
    
    setUsers(updatedUsers);
    storage.setItem('system_users', updatedUsers);
    
    // Log status change activity
    if (currentUser) {
      const user = updatedUsers.find(u => u.id === userId);
      if (user) {
        userActivityLogger.logStatusChange(user, !user.isActive, user.isActive, currentUser);
      }
    }
    
    toast.success("تم تحديث حالة المستخدم");
  };

  const deleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error("لا يمكن حذف المستخدم الحالي");
      return;
    }

    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete) {
      const updatedDeletedUsers = [...deletedUsers, userToDelete];
      setDeletedUsers(updatedDeletedUsers);
      storage.setItem('deleted_users', updatedDeletedUsers);
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    storage.setItem('system_users', updatedUsers);
    
    // Log user deletion activity
    if (userToDelete && currentUser) {
      userActivityLogger.logUserDeletion(userToDelete, currentUser);
    }
    
    toast.success("تم حذف المستخدم بنجاح");
  };

  const deleteAllUsers = () => {
    const usersToDelete = users.filter(u => u.id !== currentUser?.id);
    const updatedDeletedUsers = [...deletedUsers, ...usersToDelete];
    setDeletedUsers(updatedDeletedUsers);
    storage.setItem('deleted_users', updatedDeletedUsers);

    const remainingUsers = users.filter(u => u.id === currentUser?.id);
    setUsers(remainingUsers);
    storage.setItem('system_users', remainingUsers);
    setIsDeleteAllOpen(false);
    toast.success("تم حذف جميع المستخدمين بنجاح");
  };

  const restoreUser = (userId: string) => {
    const userToRestore = deletedUsers.find(u => u.id === userId);
    if (userToRestore) {
      const updatedUsers = [...users, userToRestore];
      setUsers(updatedUsers);
      storage.setItem('system_users', updatedUsers);

      const updatedDeletedUsers = deletedUsers.filter(u => u.id !== userId);
      setDeletedUsers(updatedDeletedUsers);
      storage.setItem('deleted_users', updatedDeletedUsers);
      
      toast.success("تم استعادة المستخدم بنجاح");
    }
  };

  const restoreAllUsers = () => {
    const updatedUsers = [...users, ...deletedUsers];
    setUsers(updatedUsers);
    storage.setItem('system_users', updatedUsers);

    setDeletedUsers([]);
    storage.setItem('deleted_users', []);
    setIsRestoreOpen(false);
    toast.success("تم استعادة جميع المستخدمين بنجاح");
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowEnhanced(!showEnhanced)}
            >
              {showEnhanced ? <Users className="h-4 w-4 ml-2" /> : <BarChart3 className="h-4 w-4 ml-2" />}
              {showEnhanced ? "العرض التقليدي" : "العرض المتقدم"}
            </Button>
            <PermissionGuard module="users" action="create" showAlert={false}>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 ml-2" />
                    إضافة مستخدم جديد
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
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
                      placeholder="القسم أو الإدارة"
                    />
                  </div>
                  
                  <RoleSelector
                    value={newUser.roleId}
                    onValueChange={(value) => setNewUser({...newUser, roleId: value})}
                    label="الدور الوظيفي *"
                    showDescription={true}
                  />
                  
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

          <PermissionGuard module="users" action="delete" showAlert={false}>
            <Dialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <UserX className="h-4 w-4 ml-2" />
                  حذف المستخدمين
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>حذف جميع المستخدمين</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    هل أنت متأكد من حذف جميع المستخدمين؟ سيتم نقلهم إلى سلة المحذوفات ويمكن استعادتهم لاحقاً.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={deleteAllUsers} className="flex-1">
                      تأكيد الحذف
                    </Button>
                    <Button variant="outline" onClick={() => setIsDeleteAllOpen(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </PermissionGuard>

          <PermissionGuard module="users" action="create" showAlert={false}>
            <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <RotateCcw className="h-4 w-4 ml-2" />
                  استعادة المستخدمين
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>استعادة المستخدمين المحذوفين</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {deletedUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      لا توجد مستخدمين محذوفين لاستعادتهم
                    </p>
                  ) : (
                    <>
                      <div className="max-h-60 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>المستخدم</TableHead>
                              <TableHead>الدور</TableHead>
                              <TableHead>الإجراء</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {deletedUsers.map((user) => (
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
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => restoreUser(user.id)}
                                  >
                                    <RotateCcw className="h-4 w-4 ml-1" />
                                    استعادة
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={restoreAllUsers} className="flex-1">
                          استعادة الكل
                        </Button>
                        <Button variant="outline" onClick={() => setIsRestoreOpen(false)}>
                          إغلاق
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </PermissionGuard>
          </div>
        </div>

        {/* Enhanced View Toggle */}
        {showEnhanced ? (
          <EnhancedUserManagement />
        ) : (
          <>
        {/* إحصائيات سريعة */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
                  <p className="text-sm text-muted-foreground">المستخدمين النشطين</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.lastLogin && 
                      new Date(u.lastLogin).getTime() > Date.now() - 86400000
                    ).length}
                  </p>
                  <p className="text-sm text-muted-foreground">دخول اليوم</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{DefaultRoles.length}</p>
                  <p className="text-sm text-muted-foreground">الأدوار المتاحة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* شريط البحث */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالاسم أو البريد الإلكتروني أو الدور..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* جدول المستخدمين */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>القسم</TableHead>
                  <TableHead>آخر دخول</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
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
                          {user.phone && (
                            <p className="text-xs text-muted-foreground">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={user.role.level <= 2 ? "default" : "secondary"}>
                        {user.role.nameAr}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {user.department || "غير محدد"}
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm">
                        {getLastLoginText(user.lastLogin)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <PermissionGuard module="users" action="update" showAlert={false}>
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() => toggleUserStatus(user.id)}
                          disabled={user.id === currentUser?.id}
                        />
                      </PermissionGuard>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PermissionGuard module="users" action="update" showAlert={false}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        
                        <PermissionGuard module="users" action="delete" showAlert={false}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUser(user.id)}
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* نافذة تعديل المستخدم */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تعديل المستخدم</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">الاسم</Label>
                  <Input
                    id="edit-name"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-phone">رقم الهاتف</Label>
                  <Input
                    id="edit-phone"
                    value={selectedUser.phone || ""}
                    onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-department">القسم</Label>
                  <Input
                    id="edit-department"
                    value={selectedUser.department || ""}
                    onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                  />
                </div>
                
                <RoleSelector
                  value={selectedUser.role.id}
                  onValueChange={(value) => {
                    const role = DefaultRoles.find(r => r.id === value);
                    if (role) {
                      setSelectedUser({...selectedUser, role});
                    }
                  }}
                  label="الدور الوظيفي"
                  showDescription={true}
                />
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdateUser} className="flex-1">
                    حفظ التغييرات
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
          </>
        )}
      </div>
    </PermissionGuard>
  );
}