import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Save, User, Phone, Mail, MapPin, Calendar, Briefcase, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const employeeSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول مطلوب"),
  lastName: z.string().min(2, "اسم العائلة مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  phone: z.string().min(10, "رقم الهاتف مطلوب"),
  address: z.string().optional(),
  birthDate: z.string().optional(),
  hireDate: z.string().min(1, "تاريخ التوظيف مطلوب"),
  position: z.string().min(2, "المنصب مطلوب"),
  department: z.string().min(2, "القسم مطلوب"),
  salary: z.string().min(1, "الراتب مطلوب"),
  allowances: z.string().optional(),
  bonuses: z.string().optional(),
  employmentType: z.string().min(1, "نوع التوظيف مطلوب"),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function NewEmployee() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      birthDate: "",
      hireDate: new Date().toISOString().split('T')[0],
      position: "",
      department: "",
      salary: "",
      allowances: "",
      bonuses: "",
      employmentType: "",
      emergencyContact: "",
      notes: "",
    },
  });

  const onSubmit = async (data: EmployeeFormData) => {
    console.log('Form submitted with data:', data);
    setIsSubmitting(true);
    
    try {
      // Save employee data to localStorage
      const existingEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
      console.log('Existing employees:', existingEmployees);
      
      const newEmployee = {
        id: Date.now().toString(),
        name: `${data.firstName} ${data.lastName}`,
        position: data.position,
        department: data.department,
        salary: parseFloat(data.salary),
        phoneNumber: data.phone,
        email: data.email || "",
        startDate: data.hireDate,
        status: "active" as const,
        nationalId: "", // يمكن إضافته لاحقاً
        address: data.address || "",
        emergencyContact: data.emergencyContact || "",
        emergencyPhone: data.emergencyContact || "",
        createdAt: new Date().toISOString()
      };
      
      console.log('New employee object:', newEmployee);
      
      const updatedEmployees = [...existingEmployees, newEmployee];
      console.log('Updated employees list:', updatedEmployees);
      
      localStorage.setItem('employees', JSON.stringify(updatedEmployees));
      console.log('Data saved to localStorage successfully');
      
      // Verify the data was saved
      const savedData = localStorage.getItem('employees');
      console.log('Verification - data in localStorage:', savedData);
      
      toast({
        title: "تم إضافة الموظف بنجاح",
        description: `تم إضافة ${data.firstName} ${data.lastName} إلى النظام`,
      });
      
      // Navigate back to employee list
      console.log('Navigating to /employees');
      navigate("/employees");
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({
        title: "خطأ في إضافة الموظف",
        description: "حدث خطأ أثناء إضافة الموظف. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/payroll")}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                العودة
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-cairo text-foreground">إضافة موظف جديد</h1>
                <p className="text-muted-foreground font-tajawal">أدخل بيانات الموظف الجديد</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-cairo">
                    <User className="h-5 w-5" />
                    المعلومات الشخصية
                  </CardTitle>
                  <CardDescription className="font-tajawal">
                    البيانات الأساسية للموظف
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-tajawal">الاسم الأول *</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل الاسم الأول" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-tajawal">اسم العائلة *</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل اسم العائلة" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            البريد الإلكتروني
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="example@domain.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            رقم الهاتف *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="+966 5XX XXX XXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          العنوان
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="أدخل العنوان الكامل" 
                            className="resize-none"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            تاريخ الميلاد
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>جهة الاتصال في حالات الطوارئ</FormLabel>
                          <FormControl>
                            <Input placeholder="رقم هاتف للطوارئ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Employment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-cairo">
                    <Briefcase className="h-5 w-5" />
                    معلومات التوظيف
                  </CardTitle>
                  <CardDescription className="font-tajawal">
                    تفاصيل المنصب والراتب
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المنصب *</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: مطور برمجيات" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>القسم *</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: تقنية المعلومات" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="hireDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            تاريخ التوظيف *
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="employmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع التوظيف *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر نوع التوظيف" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full-time">دوام كامل</SelectItem>
                              <SelectItem value="part-time">دوام جزئي</SelectItem>
                              <SelectItem value="contract">عقد مؤقت</SelectItem>
                              <SelectItem value="intern">متدرب</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          الراتب الشهري (الجنيه المصري) *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="5000" 
                            min="0"
                            step="0.01"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          أدخل الراتب الشهري الأساسي
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="allowances"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            البدلات (الجنيه المصري)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1000" 
                              min="0"
                              step="0.01"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            بدلات النقل، السكن، الطعام، إلخ
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bonuses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            الزيادات والحوافز (الجنيه المصري)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="500" 
                              min="0"
                              step="0.01"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            المكافآت والحوافز الإضافية
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>ملاحظات إضافية</CardTitle>
                  <CardDescription>
                    أي معلومات إضافية حول الموظف
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الملاحظات</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="أدخل أي ملاحظات إضافية..."
                            className="resize-none"
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/employees")}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "جاري الحفظ..." : "حفظ الموظف"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}