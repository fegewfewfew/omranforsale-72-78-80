import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Users,
  Shield,
  UserPlus,
  Edit3,
  Trash2,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Settings,
  Lock,
  Unlock,
  UserCheck,
  UserX
} from "lucide-react";
import { 
  permissionsManager, 
  Role, 
  User, 
  Permission, 
  UserSession, 
  AccessLog 
} from "@/utils/permissionsManager";

export function AdvancedPermissionManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as Permission[]
  });

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    fullName: '',
    roleId: '',
    isActive: true,
    additionalPermissions: [] as Permission[],
    deniedPermissions: [] as Permission[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRoles(permissionsManager.getRoles());
    setUsers(permissionsManager.getUsers());
    setCurrentSession(permissionsManager.getCurrentSession());
    setAccessLogs(permissionsManager.getAccessLogs(50));
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      description: '',
      permissions: []
    });
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      fullName: '',
      roleId: '',
      isActive: true,
      additionalPermissions: [],
      deniedPermissions: []
    });
  };

  const handleCreateRole = () => {
    if (!roleForm.name.trim()) {
      toast.error('يرجى إدخال اسم الدور');
      return;
    }

    if (roleForm.permissions.length === 0) {
      toast.error('يرجى تحديد صلاحية واحدة على الأقل');
      return;
    }

    const success = permissionsManager.createRole({
      name: roleForm.name,
      description: roleForm.description,
      permissions: roleForm.permissions,
      isSystem: false
    });

    if (success) {
      toast.success('تم إنشاء الدور بنجاح');
      setIsCreateRoleOpen(false);
      resetRoleForm();
      loadData();
    } else {
      toast.error('حدث خطأ أثناء إنشاء الدور');
    }
  };

  const handleUpdateRole = () => {
    if (!selectedRole) return;

    const success = permissionsManager.updateRole(selectedRole.id, {
      name: roleForm.name,
      description: roleForm.description,
      permissions: roleForm.permissions
    });

    if (success) {
      toast.success('تم تحديث الدور بنجاح');
      setIsEditRoleOpen(false);
      setSelectedRole(null);
      resetRoleForm();
      loadData();
    } else {
      toast.error('حدث خطأ أثناء تحديث الدور');
    }
  };

  const handleDeleteRole = (roleId: string) => {
    const success = permissionsManager.deleteRole(roleId);
    
    if (success) {
      toast.success('تم حذف الدور بنجاح');
      loadData();
    } else {
      toast.error('لا يمكن حذف هذا الدور');
    }
  };

  const handleCreateUser = () => {
    if (!userForm.username.trim() || !userForm.email.trim() || !userForm.fullName.trim() || !userForm.roleId) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const success = permissionsManager.createUser({
      username: userForm.username,
      email: userForm.email,
      fullName: userForm.fullName,
      roleId: userForm.roleId,
      isActive: userForm.isActive,
      additionalPermissions: userForm.additionalPermissions,
      deniedPermissions: userForm.deniedPermissions
    });

    if (success) {
      toast.success('تم إنشاء المستخدم بنجاح');
      setIsCreateUserOpen(false);
      resetUserForm();
      loadData();
    } else {
      toast.error('حدث خطأ أثناء إنشاء المستخدم أو اسم المستخدم موجود مسبقاً');
    }
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;

    const success = permissionsManager.updateUser(selectedUser.id, {
      email: userForm.email,
      fullName: userForm.fullName,
      roleId: userForm.roleId,
      isActive: userForm.isActive,
      additionalPermissions: userForm.additionalPermissions,
      deniedPermissions: userForm.deniedPermissions
    });

    if (success) {
      toast.success('تم تحديث المستخدم بنجاح');
      setIsEditUserOpen(false);
      setSelectedUser(null);
      resetUserForm();
      loadData();
    } else {
      toast.error('حدث خطأ أثناء تحديث المستخدم');
    }
  };

  const handleDeleteUser = (userId: string) => {
    const success = permissionsManager.deleteUser(userId);
    
    if (success) {
      toast.success('تم حذف المستخدم بنجاح');
      loadData();
    } else {
      toast.error('حدث خطأ أثناء حذف المستخدم');
    }
  };

  const openEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
    setIsEditRoleOpen(true);
  };

  const openEditUser = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roleId: user.roleId,
      isActive: user.isActive,
      additionalPermissions: user.additionalPermissions || [],
      deniedPermissions: user.deniedPermissions || []
    });
    setIsEditUserOpen(true);
  };

  const togglePermission = (permission: Permission, type: 'role' | 'additional' | 'denied') => {
    if (type === 'role') {
      setRoleForm(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permission)
          ? prev.permissions.filter(p => p !== permission)
          : [...prev.permissions, permission]
      }));
    } else if (type === 'additional') {
      setUserForm(prev => ({
        ...prev,
        additionalPermissions: prev.additionalPermissions.includes(permission)
          ? prev.additionalPermissions.filter(p => p !== permission)
          : [...prev.additionalPermissions, permission]
      }));
    } else if (type === 'denied') {
      setUserForm(prev => ({
        ...prev,
        deniedPermissions: prev.deniedPermissions.includes(permission)
          ? prev.deniedPermissions.filter(p => p !== permission)
          : [...prev.deniedPermissions, permission]
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPermissionLabel = (permission: Permission) => {
    const labels: { [key in Permission]?: string } = {
      'admin:all': 'جميع الصلاحيات',
      'sales:view': 'عرض المبيعات',
      'sales:create': 'إنشاء مبيعات',
      'sales:edit': 'تعديل المبيعات',
      'sales:delete': 'حذف المبيعات',
      'inventory:view': 'عرض المخزون',
      'inventory:create': 'إنشاء منتجات',
      'inventory:edit': 'تعديل المخزون',
      'inventory:delete': 'حذف منتجات',
      'system:users:view': 'عرض المستخدمين',
      'system:users:create': 'إنشاء مستخدمين',
      'system:users:edit': 'تعديل المستخدمين',
      'system:users:delete': 'حذف المستخدمين'
    };
    return labels[permission] || permission;
  };

  const permissionsByCategory = permissionsManager.getPermissionsByCategory();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الصلاحيات المتقدمة</h1>
          <p className="text-muted-foreground mt-2">
            إدارة شاملة للأدوار والمستخدمين والصلاحيات
          </p>
        </div>
        {currentSession && (
          <div className="text-right">
            <p className="font-medium">مرحباً، {currentSession.username}</p>
            <p className="text-sm text-muted-foreground">
              آخر نشاط: {formatDate(currentSession.lastActivity)}
            </p>
          </div>
        )}
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles">الأدوار</TabsTrigger>
          <TabsTrigger value="users">المستخدمين</TabsTrigger>
          <TabsTrigger value="sessions">الجلسات</TabsTrigger>
          <TabsTrigger value="logs">سجل النشاط</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    إدارة الأدوار
                  </CardTitle>
                  <CardDescription>
                    إنشاء وتعديل أدوار المستخدمين وصلاحياتهم
                  </CardDescription>
                </div>
                <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetRoleForm}>
                      <Shield className="h-4 w-4 mr-2" />
                      إنشاء دور جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>إنشاء دور جديد</DialogTitle>
                      <DialogDescription>
                        أنشئ دور جديد وحدد الصلاحيات المناسبة له
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="roleName">اسم الدور</Label>
                          <Input
                            id="roleName"
                            value={roleForm.name}
                            onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="مثال: مدير المبيعات"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roleDescription">الوصف</Label>
                        <Textarea
                          id="roleDescription"
                          value={roleForm.description}
                          onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="وصف مختصر لمسؤوليات هذا الدور"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label>الصلاحيات</Label>
                        <div className="space-y-4">
                          {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                            <div key={category} className="space-y-2">
                              <h4 className="font-medium text-sm">{category}</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {permissions.map((permission) => (
                                  <div key={permission} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`create-${permission}`}
                                      checked={roleForm.permissions.includes(permission)}
                                      onCheckedChange={() => togglePermission(permission, 'role')}
                                    />
                                    <Label 
                                      htmlFor={`create-${permission}`}
                                      className="text-sm cursor-pointer"
                                    >
                                      {getPermissionLabel(permission)}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleCreateRole}>
                        إنشاء الدور
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{role.name}</h3>
                        {role.isSystem && (
                          <Badge variant="secondary">نظام</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{role.permissions.length} صلاحية</span>
                        <span>•</span>
                        <span>تم الإنشاء: {formatDate(role.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditRole(role)}
                        disabled={role.isSystem}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.isSystem}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    إدارة المستخدمين
                  </CardTitle>
                  <CardDescription>
                    إنشاء وتعديل حسابات المستخدمين وصلاحياتهم
                  </CardDescription>
                </div>
                <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetUserForm}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      إنشاء مستخدم جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
                      <DialogDescription>
                        أنشئ حساب مستخدم جديد وحدد دوره وصلاحياته
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="userName">اسم المستخدم</Label>
                          <Input
                            id="userName"
                            value={userForm.username}
                            onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="userEmail">البريد الإلكتروني</Label>
                          <Input
                            id="userEmail"
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="user@company.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="userFullName">الاسم الكامل</Label>
                          <Input
                            id="userFullName"
                            value={userForm.fullName}
                            onChange={(e) => setUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                            placeholder="الاسم الكامل"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="userRole">الدور</Label>
                          <Select value={userForm.roleId} onValueChange={(value) => setUserForm(prev => ({ ...prev, roleId: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الدور" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="userActive"
                          checked={userForm.isActive}
                          onCheckedChange={(checked) => setUserForm(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label htmlFor="userActive">المستخدم نشط</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleCreateUser}>
                        إنشاء المستخدم
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => {
                  const userRole = roles.find(r => r.id === user.roleId);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{user.fullName}</h3>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? 'نشط' : 'غير نشط'}
                          </Badge>
                          {userRole && (
                            <Badge variant="outline">{userRole.name}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>@{user.username}</span>
                          <span>{user.email}</span>
                          {user.lastLogin && (
                            <span>آخر دخول: {formatDate(user.lastLogin)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditUser(user)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                الجلسات النشطة
              </CardTitle>
              <CardDescription>
                مراقبة جلسات المستخدمين النشطة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentSession ? (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        {currentSession.username}
                      </h3>
                      <div className="text-sm text-muted-foreground mt-1">
                        <p>وقت الدخول: {formatDate(currentSession.loginTime)}</p>
                        <p>آخر نشاط: {formatDate(currentSession.lastActivity)}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      نشط
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UserX className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>لا توجد جلسات نشطة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                سجل النشاط
              </CardTitle>
              <CardDescription>
                سجل تفصيلي لجميع أنشطة المستخدمين والصلاحيات
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accessLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>لا يوجد سجل نشاط</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accessLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-3">
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">
                            {log.username} - {log.action}
                          </p>
                          <p className="text-muted-foreground">
                            {log.resource} - {getPermissionLabel(log.permission)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-muted-foreground">
                        <p>{formatDate(log.timestamp)}</p>
                        <Badge variant={log.success ? "default" : "destructive"}>
                          {log.success ? 'نجح' : 'فشل'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل الدور</DialogTitle>
            <DialogDescription>
              تعديل اسم الدور ووصفه وصلاحياته
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editRoleName">اسم الدور</Label>
                <Input
                  id="editRoleName"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRoleDescription">الوصف</Label>
              <Textarea
                id="editRoleDescription"
                value={roleForm.description}
                onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-4">
              <Label>الصلاحيات</Label>
              <div className="space-y-4">
                {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {permissions.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-${permission}`}
                            checked={roleForm.permissions.includes(permission)}
                            onCheckedChange={() => togglePermission(permission, 'role')}
                          />
                          <Label 
                            htmlFor={`edit-${permission}`}
                            className="text-sm cursor-pointer"
                          >
                            {getPermissionLabel(permission)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateRole}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogDescription>
              تعديل بيانات المستخدم ودوره وصلاحياته
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم المستخدم</Label>
                <Input value={userForm.username} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUserEmail">البريد الإلكتروني</Label>
                <Input
                  id="editUserEmail"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editUserFullName">الاسم الكامل</Label>
                <Input
                  id="editUserFullName"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUserRole">الدور</Label>
                <Select value={userForm.roleId} onValueChange={(value) => setUserForm(prev => ({ ...prev, roleId: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="editUserActive"
                checked={userForm.isActive}
                onCheckedChange={(checked) => setUserForm(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="editUserActive">المستخدم نشط</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateUser}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}