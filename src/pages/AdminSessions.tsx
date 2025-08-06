import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LogOut, Search, RefreshCw, Shield, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminSessionData {
  id: string;
  user_id: string;
  device_id: string;
  session_token: string;
  is_active: boolean;
  created_at: string;
  last_activity: string;
  expires_at: string;
  user_profile?: {
    display_name: string;
    user_id: string;
  };
  user_devices?: {
    device_name: string;
    ip_address: string;
  };
  auth_user?: {
    email: string;
  };
}

export default function AdminSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AdminSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<AdminSessionData[]>([]);

  const fetchAllSessions = async () => {
    try {
      setLoading(true);
      
      // جلب جميع الجلسات
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .order('last_activity', { ascending: false });

      if (sessionsError) throw sessionsError;

      // جلب معلومات المستخدمين والأجهزة بشكل منفصل
      const sessionsWithUserData = await Promise.all(
        (sessionsData || []).map(async (session) => {
          // جلب معلومات الملف الشخصي
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, user_id')
            .eq('user_id', session.user_id)
            .maybeSingle();

          // جلب معلومات الجهاز
          const { data: deviceData } = await supabase
            .from('user_devices')
            .select('device_name, ip_address')
            .eq('device_id', session.device_id)
            .eq('user_id', session.user_id)
            .maybeSingle();

          // محاولة جلب البريد الإلكتروني (إذا كان متاحاً)
          let userEmail = 'غير متوفر';
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(session.user_id);
            if (userData.user?.email) {
              userEmail = userData.user.email;
            }
          } catch (error) {
            console.warn(`لم يتم العثور على بريد المستخدم ${session.user_id}`);
          }

          return {
            ...session,
            user_profile: profileData || { display_name: 'غير محدد', user_id: session.user_id },
            user_devices: deviceData || { device_name: 'غير محدد', ip_address: 'غير متوفر' },
            auth_user: { email: userEmail }
          };
        })
      );

      setSessions(sessionsWithUserData);
      setFilteredSessions(sessionsWithUserData);
    } catch (error) {
      console.error('خطأ في جلب الجلسات:', error);
      toast.error('حدث خطأ في جلب جلسات المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      toast.success('تم إنهاء الجلسة بنجاح');
      await fetchAllSessions();
    } catch (error) {
      console.error('خطأ في إنهاء الجلسة:', error);
      toast.error('حدث خطأ في إنهاء الجلسة');
    }
  };

  const terminateAllUserSessions = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('تم إنهاء جميع جلسات المستخدم');
      await fetchAllSessions();
    } catch (error) {
      console.error('خطأ في إنهاء الجلسات:', error);
      toast.error('حدث خطأ في إنهاء جلسات المستخدم');
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ar 
      });
    } catch {
      return 'غير محدد';
    }
  };

  // فلترة الجلسات حسب البحث
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(sessions);
    } else {
      const filtered = sessions.filter(session => 
        session.user_profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.auth_user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.user_devices?.device_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.user_devices?.ip_address?.includes(searchQuery)
      );
      setFilteredSessions(filtered);
    }
  }, [searchQuery, sessions]);

  useEffect(() => {
    fetchAllSessions();
  }, []);

  // التحقق من صلاحيات المشرف
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        // التحقق من وجود العمود is_admin
        setIsAdmin((data as any)?.is_admin || false);
      } catch (error) {
        console.error('خطأ في التحقق من صلاحيات المشرف:', error);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Shield className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-red-500 mb-2">وصول مرفوض</h2>
              <p className="text-muted-foreground text-center">
                هذه الصفحة مخصصة للمشرفين فقط. ليس لديك الصلاحيات اللازمة للوصول إليها.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const activeSessionsCount = filteredSessions.filter(s => s.is_active).length;
  const totalUsersCount = new Set(filteredSessions.map(s => s.user_id)).size;

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              لوحة تحكم الجلسات
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة جلسات جميع المستخدمين في النظام
            </p>
          </div>
          <Button variant="outline" onClick={fetchAllSessions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">الجلسات النشطة</p>
                <p className="text-2xl font-bold text-green-600">{activeSessionsCount}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الجلسات</p>
                <p className="text-2xl font-bold">{filteredSessions.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">المستخدمين النشطين</p>
                <p className="text-2xl font-bold">{totalUsersCount}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </CardContent>
          </Card>
        </div>

        {/* شريط البحث */}
        <Card>
          <CardHeader>
            <CardTitle>البحث والفلترة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم، البريد الإلكتروني، اسم الجهاز أو عنوان IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* جدول الجلسات */}
        <Card>
          <CardHeader>
            <CardTitle>جلسات المستخدمين ({filteredSessions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الجهاز</TableHead>
                    <TableHead>عنوان IP</TableHead>
                    <TableHead>تسجيل الدخول</TableHead>
                    <TableHead>آخر نشاط</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        لا توجد جلسات متاحة
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          {session.user_profile?.display_name || 'غير محدد'}
                        </TableCell>
                        <TableCell>{session.auth_user?.email || 'غير متوفر'}</TableCell>
                        <TableCell>{session.user_devices?.device_name || 'غير محدد'}</TableCell>
                        <TableCell>{session.user_devices?.ip_address || 'غير متوفر'}</TableCell>
                        <TableCell>{formatTime(session.created_at)}</TableCell>
                        <TableCell>{formatTime(session.last_activity)}</TableCell>
                        <TableCell>
                          <Badge variant={session.is_active ? "default" : "secondary"}>
                            {session.is_active ? 'نشطة' : 'منتهية'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {session.is_active && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    إنهاء الجلسة
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد إنهاء الجلسة</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      هل أنت متأكد من إنهاء هذه الجلسة؟
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => terminateSession(session.id, session.user_id)}
                                    >
                                      تأكيد
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <LogOut className="h-3 w-3 mr-1" />
                                  إنهاء كل الجلسات
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>تأكيد إنهاء جميع الجلسات</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من إنهاء جميع جلسات هذا المستخدم؟
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => terminateAllUserSessions(session.user_id)}
                                  >
                                    تأكيد
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}