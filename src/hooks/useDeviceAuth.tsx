import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  isDeviceAuthorized, 
  registerDeviceForUser, 
  getUserDevices,
  deactivateDevice,
  getDeviceInfo 
} from '@/utils/deviceManager';
import { toast } from 'sonner';

export function useDeviceAuth() {
  const { user, logout } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userDevices, setUserDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // التحقق من تفعيل الجهاز عند تسجيل الدخول
  useEffect(() => {
    const checkDeviceAuthorization = async () => {
      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const authorized = await isDeviceAuthorized(user.id);
        setIsAuthorized(authorized);
        
        if (!authorized) {
          toast.error('هذا الجهاز غير مُفعل للوصول لحسابك');
          logout();
        } else {
          // تحديث آخر تسجيل دخول للجهاز
          await registerDeviceForUser(user.id);
        }
      } catch (error) {
        console.error('خطأ في التحقق من الجهاز:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkDeviceAuthorization();
  }, [user, logout]);

  // جلب أجهزة المستخدم
  const loadUserDevices = async () => {
    if (!user) return;
    
    try {
      const devices = await getUserDevices(user.id);
      setUserDevices(devices);
    } catch (error) {
      console.error('خطأ في جلب الأجهزة:', error);
    }
  };

  // تسجيل الجهاز الحالي
  const registerCurrentDevice = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await registerDeviceForUser(user.id);
      if (success) {
        setIsAuthorized(true);
        toast.success('تم تسجيل الجهاز بنجاح');
        await loadUserDevices();
      } else {
        toast.error('فشل في تسجيل الجهاز');
      }
      return success;
    } catch (error) {
      console.error('خطأ في تسجيل الجهاز:', error);
      toast.error('حدث خطأ أثناء تسجيل الجهاز');
      return false;
    }
  };

  // إلغاء تفعيل جهاز
  const removeDevice = async (deviceId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await deactivateDevice(user.id, deviceId);
      if (success) {
        toast.success('تم إلغاء تفعيل الجهاز');
        await loadUserDevices();
        
        // إذا كان الجهاز المُلغى هو الجهاز الحالي، قم بتسجيل الخروج
        const currentDeviceInfo = getDeviceInfo();
        if (deviceId === currentDeviceInfo.deviceId) {
          logout();
        }
      } else {
        toast.error('فشل في إلغاء تفعيل الجهاز');
      }
      return success;
    } catch (error) {
      console.error('خطأ في إلغاء تفعيل الجهاز:', error);
      toast.error('حدث خطأ أثناء إلغاء تفعيل الجهاز');
      return false;
    }
  };

  return {
    isAuthorized,
    userDevices,
    loading,
    loadUserDevices,
    registerCurrentDevice,
    removeDevice,
    currentDeviceInfo: getDeviceInfo()
  };
}