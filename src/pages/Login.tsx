import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, User, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SupportDialog } from "@/components/ui/support-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { AccountSwitcher } from "@/components/auth/AccountSwitcher";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();

  // Check authentication
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
      return;
    }
    
    // Check for email parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
    
    const rememberLogin = localStorage.getItem("remember_login");
    if (rememberLogin === "true") {
      setRememberMe(true);
    }
  }, [navigate, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      
      if (success) {
        if (rememberMe) {
          localStorage.setItem("remember_login", "true");
        } else {
          localStorage.removeItem("remember_login");
        }
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 left-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Login Card */}
        <Card className="border-0 shadow-lg bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-arabic-elegant text-center text-primary">
              عمران للمبيعات
            </CardTitle>
            <CardDescription className="text-center mt-2">
              <span className="font-medium">الحسابات</span> <span className="font-tajawal">لنشاطك التجارى صارت أسهل مع تطبيقنا</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-cairo">البريد الإلكتروني</span>
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="أدخل البريد الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="rtl"
                    className="pr-10 text-right placeholder:text-right"
                    autoComplete="email"
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span className="font-cairo">كلمة المرور</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="rtl"
                    className="pr-10 pl-10 text-right placeholder:text-right"
                    autoComplete="current-password"
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <span className="text-sm text-muted-foreground font-tajawal">تذكرني</span>
                </label>
              </div>

            {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-opacity duration-200 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري التحقق...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-cairo">
                    تسجيل الدخول
                  </div>
                )}
              </Button>
            </form>


            {/* Register Link */}
            <div className="text-center space-y-2 pt-4">
              <p className="text-sm text-muted-foreground font-cairo">
                ليس لديك حساب؟{" "}
                <Link 
                  to="/register" 
                  className="text-primary hover:text-primary-hover font-medium transition-colors font-cairo no-underline"
                >
                  إنشاء حساب
                </Link>
              </p>
              <p className="text-sm text-muted-foreground font-cairo">
                <Link 
                  to="/forgot-password"
                  className="text-primary hover:text-primary-hover font-medium transition-colors font-cairo no-underline"
                >
                  نسيت كلمة المرور؟
                </Link>
              </p>
              <p className="text-xs text-muted-foreground font-cairo">
                <button 
                  onClick={() => setSupportDialogOpen(true)}
                  className="text-primary hover:text-primary-hover font-medium transition-colors font-cairo"
                >
                  تواصل مع الدعم الفني
                </button>
              </p>
              <p className="text-xs text-muted-foreground font-munada">
                © 2025 عمران للمبيعات - جميع الحقوق محفوظة
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card className="mt-4 border-0 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-center space-y-1">
              <h3 className="font-medium text-sm font-cairo">نظام إدارة شامل</h3>
              <p className="text-xs text-muted-foreground font-cairo">
                إدارة المبيعات • المخزون • العملاء • التقارير
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Dialog */}
      <SupportDialog 
        open={supportDialogOpen} 
        onOpenChange={setSupportDialogOpen} 
      />
    </div>
  );
}