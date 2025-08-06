import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Shield, Moon, Sun, Info, HelpCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BackupManager } from "@/utils/backupManager";

interface UserProfileProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function UserProfile({ darkMode, onToggleDarkMode }: UserProfileProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  
  const [userProfile, setUserProfile] = useState({
    name: "عمران للمبيعات",
    email: "xoxobnj@gmail.com",
    role: "مالك البرنامج",
    avatar: "",
  });
  const { toast } = useToast();

  const { logout } = useAuth();

  const handleLogout = () => {
    try {
      // استخدام دالة logout من AuthContext
      logout();
      
      // Close the popover first
      setIsOpen(false);
      
      // Navigate to login page
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
    }
  };

  const handleSaveProfile = () => {
    localStorage.setItem("user_profile", JSON.stringify(userProfile));
    setShowProfileDialog(false);
    toast({
      title: "تم الحفظ",
      description: "تم حفظ بيانات الملف الشخصي بنجاح",
    });
  };


  return (
    <>
      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">إعدادات النظام</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="dark-mode" className="font-cairo">الوضع المظلم</Label>
                <p className="text-sm text-muted-foreground font-tajawal">
                  تفعيل أو إلغاء الوضع المظلم للنظام
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={onToggleDarkMode}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="font-cairo">اللغة</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-tajawal">العربية</span>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="font-cairo">الإشعارات</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm font-tajawal">إشعارات سطح المكتب</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-tajawal">إشعارات البريد الإلكتروني</span>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">الملف الشخصي</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-cairo">الاسم</Label>
              <Input
                id="name"
                value={userProfile.name}
                readOnly
                className="bg-muted/50 cursor-not-allowed font-tajawal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-cairo">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={userProfile.email}
                readOnly
                className="bg-muted/50 cursor-not-allowed font-tajawal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="font-cairo">الدور</Label>
              <Input
                id="role"
                value={userProfile.role}
                readOnly
                className="bg-muted/50 cursor-not-allowed font-tajawal"
              />
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShowProfileDialog(false)} className="w-full font-cairo">
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-gent-bold text-center">التواصل مع صاحب البرنامج للتفعيل</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              قم بالتواصل مباشرة مع هذا الهاتف لأى استفسار أو لتفعيل البرنامج
            </p>
            
            {/* Display Phone Number */}
            <div className="space-y-2">
              <Label>رقم التواصل المباشر</Label>
              <Input
                type="tel"
                value="01090695336"
                readOnly
                className="bg-muted/50 cursor-not-allowed text-center font-medium"
              />
            </div>
            
            {/* WhatsApp Contact Section */}
            <div className="space-y-3 pt-2 border-t">
              <p className="text-sm font-medium">أو تواصل مباشرة عبر:</p>
              <Button
                variant="outline"
                className="w-full bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                onClick={() => {
                  window.open("https://wa.me/2001090695336?text=مرحبا، أريد تفعيل البرنامج", "_blank");
                }}
              >
                <Phone className="h-4 w-4 ml-2" />
                التواصل عبر الواتساب
              </Button>
            </div>
            
            <div className="flex justify-center pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowContactDialog(false)}
                className="w-full"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Security Dialog */}
      <Dialog open={showSecurityDialog} onOpenChange={setShowSecurityDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">الأمان والخصوصية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-tajawal">تسجيل الدخول التلقائي</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-tajawal">حفظ كلمات المرور</span>
                <Switch defaultChecked />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="font-cairo">إعدادات الخصوصية</Label>
              <p className="text-xs text-muted-foreground font-tajawal">
                جميع بياناتك محمية ومشفرة. لا يتم مشاركة المعلومات مع أطراف ثالثة.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowSecurityDialog(false)} 
              className="w-full font-cairo"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>المساعدة والدعم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">الأسئلة الشائعة</h4>
                <p className="text-xs text-muted-foreground">
                  كيفية استخدام النظام وحل المشاكل الشائعة
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">دليل المستخدم</h4>
                <p className="text-xs text-muted-foreground">
                  شرح مفصل لجميع ميزات البرنامج
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">التواصل مع الدعم</h4>
                <p className="text-xs text-muted-foreground">
                  للحصول على مساعدة فورية من فريق الدعم
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowHelpDialog(false)} 
              className="w-full"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* About Dialog */}
      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>حول البرنامج</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary rounded-full mx-auto flex items-center justify-center">
                <Info className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold font-camel-thin">عمران للمبيعات</h3>
                <p className="text-sm text-muted-foreground font-camel-thin">الإصدار 1.0.0</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-camel-thin">
                نظام إدارة شامل للمبيعات والمخزون والعملاء
              </p>
              <p className="text-xs text-muted-foreground font-camel-thin">
                تم التطوير بواسطة Mohamed Ali Omran
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium font-camel-thin">معلومات إضافية:</p>
              <p className="text-xs text-muted-foreground font-camel-thin">
                • دعم العملة المحلية والأجنبية<br/>
                • تقارير مفصلة ومرنة<br/>
                • نظام أمان متقدم<br/>
                • واجهة سهلة الاستخدام
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowAboutDialog(false)} 
              className="w-full"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <User className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end" sideOffset={5}>
          {/* User Info Header */}
          <div className="flex items-center gap-3 p-4 border-b">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userProfile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm font-arabic-elegant">{userProfile.name}</p>
              <p className="text-xs text-muted-foreground">{userProfile.email}</p>
              <p className="text-xs text-muted-foreground">{userProfile.role}</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-sm font-cairo"
              onClick={() => {
                setShowProfileDialog(true);
                setIsOpen(false);
              }}
            >
              <User className="h-4 w-4 ml-3" />
              الملف الشخصي
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-sm font-cairo"
              onClick={() => {
                setShowSettingsDialog(true);
                setIsOpen(false);
              }}
            >
              <Settings className="h-4 w-4 ml-3" />
              الإعدادات
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-sm font-cairo"
              onClick={onToggleDarkMode}
            >
              {darkMode ? <Sun className="h-4 w-4 ml-3" /> : <Moon className="h-4 w-4 ml-3" />}
              {darkMode ? "الوضع الفاتح" : "الوضع المظلم"}
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-sm font-cairo"
              onClick={() => {
                setShowSecurityDialog(true);
                setIsOpen(false);
              }}
            >
              <Shield className="h-4 w-4 ml-3" />
              الأمان والخصوصية
            </Button>


            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-sm font-cairo"
              onClick={() => {
                setShowAboutDialog(true);
                setIsOpen(false);
              }}
            >
              <Info className="h-4 w-4 ml-3" />
              حول البرنامج
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-sm font-cairo"
              onClick={() => {
                setShowContactDialog(true);
                setIsOpen(false);
              }}
            >
              <Phone className="h-4 w-4 ml-3" />
              لتفعيل البرنامج
            </Button>

            <Separator className="my-2" />

            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 ml-3" />
              تسجيل الخروج
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}