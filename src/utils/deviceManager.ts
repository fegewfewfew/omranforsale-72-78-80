import { supabase } from '@/integrations/supabase/client';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  browserInfo: string;
}

// توليد معرف فريد للجهاز باستخدام بصمة المتصفح
export function generateDeviceId(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Device fingerprint', 10, 50);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas.toDataURL(),
    new Date().getTimezoneOffset()
  ].join('|');
  
  // تحويل البصمة إلى معرف فريد
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // تحويل إلى 32bit integer
  }
  
  return 'web_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
}

// الحصول على معلومات الجهاز
export function getDeviceInfo(): DeviceInfo {
  let deviceId = localStorage.getItem('device_id');
  
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('device_id', deviceId);
  }
  
  const deviceName = getBrowserName() + ' على ' + getOSName();
  const platform = 'Web';
  const browserInfo = navigator.userAgent;
  
  return {
    deviceId,
    deviceName,
    platform,
    browserInfo
  };
}

// تحديد نوع المتصفح
function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown Browser';
}

// تحديد نظام التشغيل
function getOSName(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'MacOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  
  return 'Unknown OS';
}

// تسجيل الجهاز للمستخدم
export async function registerDeviceForUser(userId: string): Promise<boolean> {
  try {
    const deviceInfo = getDeviceInfo();
    
    const { data, error } = await supabase
      .from('user_devices')
      .upsert({
        user_id: userId,
        device_id: deviceInfo.deviceId,
        device_name: deviceInfo.deviceName,
        platform: deviceInfo.platform,
        browser_info: deviceInfo.browserInfo,
        last_login: new Date().toISOString(),
        is_active: true
      }, {
        onConflict: 'user_id,device_id'
      });

    if (error) {
      console.error('خطأ في تسجيل الجهاز:', error);
      return false;
    }

    console.log('تم تسجيل الجهاز بنجاح:', deviceInfo.deviceId);
    return true;
  } catch (error) {
    console.error('خطأ في تسجيل الجهاز:', error);
    return false;
  }
}

// التحقق من تفعيل الجهاز
export async function isDeviceAuthorized(userId: string): Promise<boolean> {
  try {
    const deviceInfo = getDeviceInfo();
    
    const { data, error } = await supabase
      .from('user_devices')
      .select('is_active')
      .eq('user_id', userId)
      .eq('device_id', deviceInfo.deviceId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('خطأ في التحقق من الجهاز:', error);
      return false;
    }

    const isAuthorized = !!data;
    console.log('حالة تفعيل الجهاز:', isAuthorized);
    return isAuthorized;
  } catch (error) {
    console.error('خطأ في التحقق من الجهاز:', error);
    return false;
  }
}

// الحصول على جميع أجهزة المستخدم
export async function getUserDevices(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_login', { ascending: false });

    if (error) {
      console.error('خطأ في جلب أجهزة المستخدم:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('خطأ في جلب أجهزة المستخدم:', error);
    return [];
  }
}

// إلغاء تفعيل جهاز
export async function deactivateDevice(userId: string, deviceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_devices')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('device_id', deviceId);

    if (error) {
      console.error('خطأ في إلغاء تفعيل الجهاز:', error);
      return false;
    }

    // إنهاء جميع الجلسات النشطة لهذا الجهاز
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('device_id', deviceId);

    console.log('تم إلغاء تفعيل الجهاز بنجاح:', deviceId);
    return true;
  } catch (error) {
    console.error('خطأ في إلغاء تفعيل الجهاز:', error);
    return false;
  }
}