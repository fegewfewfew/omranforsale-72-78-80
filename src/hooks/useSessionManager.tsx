import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserSession {
  id: string;
  user_id: string;
  device_id: string;
  session_token: string;
  is_active: boolean;
  created_at: string;
  last_activity: string;
  expires_at: string;
  device_name?: string;
  ip_address?: string;
}

export interface SessionStats {
  active: number;
  inactive: number;
  total: number;
}

export function useSessionManager() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [stats, setStats] = useState<SessionStats>({ active: 0, inactive: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_activity', { ascending: false });

      if (error) throw error;

      // جلب معلومات الأجهزة بشكل منفصل
      const sessionsWithDevices = await Promise.all(
        (data || []).map(async (session) => {
          const { data: deviceData } = await supabase
            .from('user_devices')
            .select('device_name, ip_address')
            .eq('device_id', session.device_id)
            .eq('user_id', user.id)
            .maybeSingle();

          return {
            ...session,
            device_name: deviceData?.device_name || 'جهاز غير محدد',
            ip_address: deviceData?.ip_address || 'غير متوفر'
          };
        })
      );

      setSessions(sessionsWithDevices);

      // حساب الإحصائيات
      const activeSessions = sessionsWithDevices.filter(s => s.is_active);
      const inactiveSessions = sessionsWithDevices.filter(s => !s.is_active);
      
      setStats({
        active: activeSessions.length,
        inactive: inactiveSessions.length,
        total: sessionsWithDevices.length
      });

    } catch (error) {
      console.error('خطأ في جلب الجلسات:', error);
      toast.error('حدث خطأ في جلب الجلسات');
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('تم إنهاء الجلسة بنجاح');
      await fetchSessions();
      return true;
    } catch (error) {
      console.error('خطأ في إنهاء الجلسة:', error);
      toast.error('حدث خطأ في إنهاء الجلسة');
      return false;
    }
  };

  const terminateAllOtherSessions = async () => {
    if (!user) return false;

    try {
      const currentSessionToken = localStorage.getItem('session_token');
      
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('session_token', currentSessionToken || '');

      if (error) throw error;

      toast.success('تم تسجيل الخروج من جميع الأجهزة الأخرى');
      await fetchSessions();
      return true;
    } catch (error) {
      console.error('خطأ في إنهاء الجلسات:', error);
      toast.error('حدث خطأ في إنهاء الجلسات');
      return false;
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  // الاستماع للتحديثات المباشرة
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    sessions,
    stats,
    loading,
    fetchSessions,
    terminateSession,
    terminateAllOtherSessions
  };
}