import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // التحقق من وجود access_token في URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      // تعيين الجلسة باستخدام الرموز المميزة
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // التحقق من تطابق كلمات المرور
      if (password !== confirmPassword) {
        toast({
          title: "خطأ في كلمة المرور",
          description: "كلمة المرور وتأكيد كلمة المرور غير متطابقان",
          variant: "destructive",
        });
        return;
      }

      // التحقق من قوة كلمة المرور
      if (password.length < 6) {
        toast({
          title: "كلمة مرور ضعيفة",
          description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Reset password error:', error);
        toast({
          title: "خطأ في إعادة تعيين كلمة المرور",
          description: "حدث خطأ أثناء تحديث كلمة المرور. يرجى المحاولة مرة أخرى",
          variant: "destructive",
        });
        return;
      }

      setIsSuccessful(true);
      toast({
        title: "تم تحديث كلمة المرور بنجاح",
        description: "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة",
      });

      // توجيه المستخدم لصفحة تسجيل الدخول بعد 3 ثوان
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error) {
      console.error('Password reset catch error:', error);
      toast({
        title: "حدث خطأ",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccessful) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4 relative">
        <div className="absolute top-4 left-4 z-10">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg bg-card/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-arabic-elegant text-center text-primary">
                تم التحديث بنجاح
              </CardTitle>
              <CardDescription className="text-center mt-2 font-tajawal">
                تم تحديث كلمة المرور بنجاح. سيتم توجيهك لصفحة تسجيل الدخول خلال ثوان
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center">
                <Button 
                  onClick={() => navigate("/login")}
                  className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-opacity duration-200 font-medium"
                >
                  تسجيل الدخول الآن
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 left-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-arabic-elegant text-center text-primary">
              إعادة تعيين كلمة المرور
            </CardTitle>
            <CardDescription className="text-center mt-2 font-tajawal">
              أدخل كلمة المرور الجديدة لحسابك
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2 font-cairo">
                  <Lock className="w-4 h-4" />
                  كلمة المرور الجديدة
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور الجديدة"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="rtl"
                    className="pr-10 pl-10"
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2 font-cairo">
                  <Lock className="w-4 h-4" />
                  تأكيد كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="أعد إدخال كلمة المرور"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    dir="rtl"
                    className="pr-10 pl-10"
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-opacity duration-200 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري التحديث...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-cairo">
                    تحديث كلمة المرور
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-xs text-muted-foreground font-munada">
                © 2025 عمران للمبيعات - جميع الحقوق محفوظة
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}