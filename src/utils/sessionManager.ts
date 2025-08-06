import { supabase } from '@/integrations/supabase/client';
import { getDeviceInfo } from '@/utils/deviceManager';

export interface UserSession {
  id: string;
  user_id: string;
  device_id: string;
  device_name?: string;
  ip_address?: string;
  is_active: boolean;
  created_at: string;
  last_activity: string;
  expires_at: string;
  session_token: string;
}

// إنشاء جلسة جديدة
export async function createUserSession(userId: string): Promise<boolean> {
  try {
    const deviceInfo = getDeviceInfo();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // انتهاء بعد 30 يوم

    const sessionToken = generateSessionToken();
    
    const { error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        device_id: deviceInfo.deviceId,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        last_activity: new Date().toISOString()
      });

    if (error) {
      console.error('خطأ في إنشاء الجلسة:', error);
      return false;
    }

    // حفظ معرف الجلسة محلياً
    localStorage.setItem('session_token', sessionToken);
    return true;
  } catch (error) {
    console.error('خطأ في إنشاء الجلسة:', error);
    return false;
  }
}

// الحصول على جلسات المستخدم
export async function getUserSessions(userId: string): Promise<UserSession[]> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('خطأ في جلب الجلسات:', error);
      return [];
    }

    // جلب معلومات الأجهزة بشكل منفصل
    const sessions = data || [];
    const sessionsWithDevices = await Promise.all(
      sessions.map(async (session) => {
        const { data: deviceData } = await supabase
          .from('user_devices')
          .select('device_name, ip_address')
          .eq('device_id', session.device_id)
          .eq('user_id', userId)
          .maybeSingle();

        return {
          ...session,
          device_name: deviceData?.device_name || 'جهاز غير محدد',
          ip_address: deviceData?.ip_address || 'غير متوفر'
        };
      })
    );

    return sessionsWithDevices;
  } catch (error) {
    console.error('خطأ في جلب الجلسات:', error);
    return [];
  }
}

// إنهاء جلسة محددة
export async function terminateSession(userId: string, sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('id', sessionId);

    if (error) {
      console.error('خطأ في إنهاء الجلسة:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('خطأ في إنهاء الجلسة:', error);
    return false;
  }
}

// إنهاء جميع الجلسات عدا الحالية
export async function terminateAllOtherSessions(userId: string): Promise<boolean> {
  try {
    const currentSessionToken = localStorage.getItem('session_token');
    
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .neq('session_token', currentSessionToken || '');

    if (error) {
      console.error('خطأ في إنهاء الجلسات:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('خطأ في إنهاء الجلسات:', error);
    return false;
  }
}

// تحديث آخر نشاط للجلسة
export async function updateSessionActivity(userId: string): Promise<void> {
  try {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return;

    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('session_token', sessionToken)
      .eq('is_active', true);
  } catch (error) {
    console.error('خطأ في تحديث نشاط الجلسة:', error);
  }
}

// التحقق من صحة الجلسة
export async function validateSession(userId: string): Promise<boolean> {
  try {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return false;

    const { data, error } = await supabase
      .from('user_sessions')
      .select('id, expires_at')
      .eq('user_id', userId)
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    // التحقق من انتهاء الجلسة
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      // إنهاء الجلسة المنتهية
      await terminateSession(userId, data.id);
      localStorage.removeItem('session_token');
      return false;
    }

    return true;
  } catch (error) {
    console.error('خطأ في التحقق من الجلسة:', error);
    return false;
  }
}

// توليد رمز جلسة فريد
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// تنظيف الجلسات المنتهية
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await supabase.rpc('cleanup_expired_sessions');
  } catch (error) {
    console.error('خطأ في تنظيف الجلسات المنتهية:', error);
  }
}