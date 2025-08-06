import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as AuthUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole, AuthContextType, DefaultRoles, DefaultPermissions, PermissionAction } from '@/types/auth';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';
import { createUserSession, updateSessionActivity, validateSession } from '@/utils/sessionManager';
import { registerDeviceForUser, isDeviceAuthorized } from '@/utils/deviceManager';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// المستخدم الافتراضي (للتطوير)
const defaultUser: User = {
  id: 'default-admin',
  name: 'مدير النظام',
  email: 'admin@omran.com',
  phone: '01000000000',
  role: DefaultRoles[0], // مدير النظام
  isActive: true,
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  permissions: DefaultPermissions,
  avatar: undefined,
  department: 'الإدارة'
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // إعداد مستمع تغيير حالة المصادقة FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        
        setSession(session);
        
        if (session?.user) {
          // تخزين الجلسة في localStorage
          localStorage.setItem('supabase_session', JSON.stringify(session));
          
          // إنشاء كائن مستخدم من بيانات Supabase
          const supabaseUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'مستخدم',
            email: session.user.email || '',
            phone: session.user.user_metadata?.phone || '',
            role: DefaultRoles[0], // مدير النظام افتراضياً
            isActive: true,
            createdAt: session.user.created_at,
            lastLogin: new Date().toISOString(),
            permissions: DefaultPermissions,
            avatar: session.user.user_metadata?.avatar_url,
            department: 'عام'
          };
          setUser(supabaseUser);
          setIsAuthenticated(true);
          storage.setItem('current_user', supabaseUser);
        } else {
          // حذف الجلسة من localStorage عند تسجيل الخروج
          localStorage.removeItem('supabase_session');
          setUser(null);
          setIsAuthenticated(false);
          storage.removeItem('current_user');
        }
      }
    );

    // استرجاع الجلسة المحفوظة عند بدء التطبيق
    const restoreSession = async () => {
      try {
        const savedSession = localStorage.getItem('supabase_session');
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          
          // التحقق من انتهاء صلاحية الجلسة
          const expiresAt = new Date(sessionData.expires_at * 1000);
          const now = new Date();
          
          if (expiresAt > now) {
            // إعادة تعيين الجلسة إذا كانت صالحة
            await supabase.auth.setSession({
              access_token: sessionData.access_token,
              refresh_token: sessionData.refresh_token
            });
            console.log('Session restored from localStorage');
          } else {
            // حذف الجلسة المنتهية الصلاحية
            localStorage.removeItem('supabase_session');
            console.log('Expired session removed');
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('supabase_session');
      }
    };

    // استرجاع الجلسة أولاً
    restoreSession().then(() => {
      // ثم التحقق من الجلسة الحالية
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const supabaseUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'مستخدم',
            email: session.user.email || '',
            phone: session.user.user_metadata?.phone || '',
            role: DefaultRoles[0],
            isActive: true,
            createdAt: session.user.created_at,
            lastLogin: new Date().toISOString(),
            permissions: DefaultPermissions,
            avatar: session.user.user_metadata?.avatar_url,
            department: 'عام'
          };
          setUser(supabaseUser);
          setIsAuthenticated(true);
          storage.setItem('current_user', supabaseUser);
        }
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('بيانات تسجيل الدخول غير صحيحة');
        return false;
      }

      if (data.user) {
        // التحقق من تفعيل الجهاز
        const deviceAuthorized = await isDeviceAuthorized(data.user.id);
        if (!deviceAuthorized) {
          // تسجيل الجهاز تلقائياً
          await registerDeviceForUser(data.user.id);
        }
        
        // إنشاء جلسة جديدة
        await createUserSession(data.user.id);
        
        toast.success('تم تسجيل الدخول بنجاح');
        return true;
      }

      return false;
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الدخول');
      return false;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error('حدث خطأ أثناء تسجيل الخروج');
        return;
      }

      // Clear local storage
      storage.removeItem('current_user');
      localStorage.removeItem("admin_authenticated");
      localStorage.removeItem("user_profile");
      localStorage.removeItem("remember_login");
      localStorage.removeItem("session_token");
      localStorage.removeItem("device_id");
      
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !isAuthenticated) return false;
    
    // مدير النظام له صلاحية على كل شيء
    if (user.role.permissions.includes('*')) return true;
    
    // التحقق من الصلاحية المحددة
    return user.role.permissions.includes(permission) ||
           user.permissions.some(p => p.id === permission);
  };

  const hasRole = (roleName: string): boolean => {
    if (!user || !isAuthenticated) return false;
    return user.role.name === roleName || user.role.id === roleName;
  };

  const canAccess = (module: string, action: PermissionAction): boolean => {
    if (!user || !isAuthenticated) return false;
    
    const permission = `${module}.${action}`;
    const wildcardPermission = `${module}.*`;
    
    // التحقق من الصلاحية المحددة أو العامة للمودول
    return hasPermission(permission) || hasPermission(wildcardPermission);
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<boolean> => {
    try {
      // التأكد من صحة البريد الإلكتروني قبل الإرسال
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        toast.error('البريد الإلكتروني غير صحيح');
        return false;
      }

      // تنظيف البريد الإلكتروني من المسافات والتأكد من صحته
      const cleanEmail = userData.email.trim().toLowerCase();
      
      // التحقق الإضافي من طول البريد الإلكتروني وعدم وجود أحرف خاصة
      if (cleanEmail.length < 5 || cleanEmail.length > 100) {
        toast.error('البريد الإلكتروني قصير جداً أو طويل جداً');
        return false;
      }
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: userData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: userData.username,
            phone: userData.phone || ''
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        
        if (error.message.includes('already registered') || error.message.includes('email_taken')) {
          toast.error('البريد الإلكتروني مسجل من قبل');
        } else if (error.message.includes('invalid') && error.message.includes('email')) {
          toast.error('البريد الإلكتروني غير صحيح. تأكد من كتابته بشكل صحيح');
        } else if (error.message.includes('password')) {
          toast.error('كلمة المرور ضعيفة. يجب أن تكون 6 أحرف على الأقل');
        } else {
          toast.error(`خطأ في إنشاء الحساب: ${error.message}`);
        }
        return false;
      }

      if (data.user) {
        if (data.user.email_confirmed_at) {
          toast.success('تم إنشاء الحساب وتفعيله بنجاح!');
        } else {
          toast.success('تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني لتأكيد الحساب');
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration catch error:', error);
      toast.error('حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى');
      return false;
    }
  };

  const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
    try {
      if (!user) return false;
      
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      storage.setItem('current_user', updatedUser);
      
      // تحديث الحساب في التخزين المحلي أيضاً
      const userAccounts = JSON.parse(localStorage.getItem("user_accounts") || "[]");
      const updatedAccounts = userAccounts.map((acc: any) => 
        acc.id === user.id ? { ...acc, ...updates } : acc
      );
      localStorage.setItem("user_accounts", JSON.stringify(updatedAccounts));
      
      toast.success('تم تحديث الملف الشخصي بنجاح');
      return true;
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الملف الشخصي');
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    register,
    hasPermission,
    hasRole,
    canAccess,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook للتحقق من الصلاحيات مع إمكانية إخفاء المكونات
export const usePermission = (permission: string) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

// Hook للتحقق من صلاحية الوصول للمودول
export const useModuleAccess = (module: string, action: PermissionAction) => {
  const { canAccess } = useAuth();
  return canAccess(module, action);
};

// Hook للتحقق من الدور
export const useRole = (roleName: string) => {
  const { hasRole } = useAuth();
  return hasRole(roleName);
};