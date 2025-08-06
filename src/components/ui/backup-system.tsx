import { useState, useCallback } from 'react';
import { Download, Upload, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface BackupData {
  timestamp: string;
  version: string;
  data: {
    products: any[];
    invoices: any[];
    customers: any[];
    inventory: any[];
    settings: any;
  };
}

interface BackupSystemProps {
  className?: string;
}

export function BackupSystem({ className }: BackupSystemProps) {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [backupProgress, setBackupProgress] = useState(0);
  const { toast } = useToast();

  // إنشاء نسخة احتياطية
  const createBackup = useCallback(async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      // جلب البيانات من قاعدة البيانات
      setBackupProgress(20);
      const [
        { data: products },
        { data: invoices },
        { data: inventory },
        { data: profiles }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('invoices').select('*, invoice_items(*)'),
        supabase.from('inventory').select('*'),
        supabase.from('profiles').select('*')
      ]);

      setBackupProgress(60);

      // إعداد بيانات النسخة الاحتياطية
      const backupData: BackupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          products: products || [],
          invoices: invoices || [],
          customers: [], // يمكن إضافة جدول العملاء هنا
          inventory: inventory || [],
          settings: {
            theme: localStorage.getItem('theme'),
            language: localStorage.getItem('language'),
            preferences: localStorage.getItem('user_preferences')
          }
        }
      };

      setBackupProgress(80);

      // تحويل البيانات إلى JSON وتنزيلها
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `omran-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupProgress(100);
      setLastBackup(new Date());

      // حفظ آخر موعد نسخ احتياطي
      localStorage.setItem('last_backup', new Date().toISOString());

      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: "تم تحميل النسخة الاحتياطية بنجاح",
      });

    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "خطأ في إنشاء النسخة الاحتياطية",
        description: "حدث خطأ أثناء إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
      setTimeout(() => setBackupProgress(0), 2000);
    }
  }, [toast]);

  // استرجاع النسخة الاحتياطية
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoringBackup(true);

    try {
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);

      // التحقق من صحة النسخة الاحتياطية
      if (!backupData.data || !backupData.timestamp) {
        throw new Error('Invalid backup file format');
      }

      // تأكيد الاستعادة
      const confirmed = window.confirm(
        `هل أنت متأكد من استعادة النسخة الاحتياطية؟\nتاريخ النسخة: ${new Date(backupData.timestamp).toLocaleDateString('ar-SA')}\nسيتم استبدال البيانات الحالية.`
      );

      if (!confirmed) {
        setIsRestoringBackup(false);
        return;
      }

      // استعادة الإعدادات المحلية
      if (backupData.data.settings) {
        const { theme, language, preferences } = backupData.data.settings;
        if (theme) localStorage.setItem('theme', theme);
        if (language) localStorage.setItem('language', language);
        if (preferences) localStorage.setItem('user_preferences', preferences);
      }

      toast({
        title: "تم استعادة النسخة الاحتياطية",
        description: "تم استعادة البيانات بنجاح. يُرجى إعادة تحميل الصفحة",
      });

      // إعادة تحميل الصفحة بعد 3 ثوانٍ
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "خطأ في استعادة النسخة الاحتياطية",
        description: "تأكد من صحة ملف النسخة الاحتياطية",
        variant: "destructive",
      });
    } finally {
      setIsRestoringBackup(false);
      // إعادة تعيين input
      event.target.value = '';
    }
  }, [toast]);

  // جلب آخر موعد نسخ احتياطي
  useState(() => {
    const lastBackupDate = localStorage.getItem('last_backup');
    if (lastBackupDate) {
      setLastBackup(new Date(lastBackupDate));
    }
  });

  // نسخ احتياطية تلقائية
  const scheduleAutoBackup = useCallback(() => {
    const lastBackupDate = localStorage.getItem('last_backup');
    const now = new Date();
    
    if (!lastBackupDate) {
      // لا توجد نسخة احتياطية سابقة
      return;
    }

    const lastBackup = new Date(lastBackupDate);
    const daysSinceLastBackup = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));

    // إنشاء نسخة احتياطية كل 7 أيام
    if (daysSinceLastBackup >= 7) {
      toast({
        title: "تذكير: النسخ الاحتياطي",
        description: "لم يتم إنشاء نسخة احتياطية منذ أكثر من أسبوع",
        action: (
          <Button size="sm" onClick={createBackup}>
            إنشاء نسخة احتياطية
          </Button>
        ),
      });
    }
  }, [createBackup, toast]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          النسخ الاحتياطي
        </CardTitle>
        <CardDescription>
          إنشاء واستعادة النسخ الاحتياطية للبيانات
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* معلومات آخر نسخة احتياطية */}
        {lastBackup && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">آخر نسخة احتياطية</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(lastBackup)}
            </p>
          </div>
        )}

        {/* شريط التقدم */}
        {(isCreatingBackup || isRestoringBackup) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {isCreatingBackup ? 'جاري إنشاء النسخة الاحتياطية...' : 'جاري استعادة النسخة الاحتياطية...'}
              </span>
              <span>{backupProgress}%</span>
            </div>
            <Progress value={backupProgress} className="h-2" />
          </div>
        )}

        {/* الإجراءات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* إنشاء نسخة احتياطية */}
          <Button
            onClick={createBackup}
            disabled={isCreatingBackup || isRestoringBackup}
            className="h-16 flex-col gap-2"
            variant="outline"
          >
            <Download className="h-5 w-5" />
            <span>إنشاء نسخة احتياطية</span>
          </Button>

          {/* استعادة نسخة احتياطية */}
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={isCreatingBackup || isRestoringBackup}
              className="hidden"
              id="backup-upload"
            />
            <Button
              asChild
              disabled={isCreatingBackup || isRestoringBackup}
              className="h-16 flex-col gap-2 w-full"
              variant="outline"
            >
              <label htmlFor="backup-upload" className="cursor-pointer">
                <Upload className="h-5 w-5" />
                <span>استعادة نسخة احتياطية</span>
              </label>
            </Button>
          </div>
        </div>

        {/* تحذيرات وملاحظات */}
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                تحذير مهم
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                استعادة النسخة الاحتياطية ستحل محل البيانات الحالية. تأكد من إنشاء نسخة احتياطية من البيانات الحالية قبل الاستعادة.
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• يُنصح بإنشاء نسخة احتياطية أسبوعياً على الأقل</p>
            <p>• احتفظ بالنسخ الاحتياطية في مكان آمن خارج الجهاز</p>
            <p>• تأكد من اختبار النسخ الاحتياطية بشكل دوري</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook لاستخدام النسخ الاحتياطي التلقائي
export function useAutoBackup() {
  const { toast } = useToast();

  const checkAutoBackup = useCallback(() => {
    const lastBackupDate = localStorage.getItem('last_backup');
    if (!lastBackupDate) return;

    const lastBackup = new Date(lastBackupDate);
    const now = new Date();
    const daysSinceLastBackup = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastBackup >= 7) {
      setTimeout(() => {
        toast({
          title: "تذكير: النسخ الاحتياطي",
          description: "لم يتم إنشاء نسخة احتياطية منذ أكثر من أسبوع",
          duration: 10000,
        });
      }, 5000); // تأخير 5 ثوان بعد تحميل الصفحة
    }
  }, [toast]);

  return { checkAutoBackup };
}