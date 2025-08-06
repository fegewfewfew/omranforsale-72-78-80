import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, Phone, Mail, MapPin, Calendar, Briefcase, DollarSign,
  FileText, Award, TrendingUp, Clock, Target, Star, Upload,
  Edit, Eye, Download, AlertCircle, CheckCircle, Building, Plus
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { employeeManager } from "@/utils/employeeManager";

interface EmployeeProfileProps {
  employeeId: string;
  onClose: () => void;
}

interface PerformanceRecord {
  id: string;
  employeeId: string;
  period: string;
  goals: number;
  achieved: number;
  rating: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  date: string;
}

interface Document {
  id: string;
  employeeId: string;
  name: string;
  type: 'contract' | 'certificate' | 'id' | 'medical' | 'other';
  uploadDate: string;
  size: string;
  url?: string;
}

export function EmployeeProfile({ employeeId, onClose }: EmployeeProfileProps) {
  const [employee, setEmployee] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);

  useEffect(() => {
    loadEmployeeData();
  }, [employeeId]);

  const loadEmployeeData = () => {
    const emp = employeeManager.getEmployeeById(employeeId);
    setEmployee(emp);

    if (emp) {
      // تحميل بيانات الأداء
      const savedPerformance = JSON.parse(localStorage.getItem('employee_performance') || '[]');
      const empPerformance = savedPerformance.filter((p: PerformanceRecord) => p.employeeId === employeeId);
      setPerformanceRecords(empPerformance);

      // تحميل الوثائق
      const savedDocuments = JSON.parse(localStorage.getItem('employee_documents') || '[]');
      const empDocuments = savedDocuments.filter((d: Document) => d.employeeId === employeeId);
      setDocuments(empDocuments);

      // محاكاة بيانات الحضور للشهر الماضي
      const mockAttendanceData = Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        status: Math.random() > 0.1 ? 'present' : Math.random() > 0.5 ? 'late' : 'absent',
        hours: Math.random() > 0.1 ? 8 + Math.random() * 2 : 0
      }));
      setAttendanceData(mockAttendanceData);

      // تحميل سجل الإجازات
      const savedLeaves = JSON.parse(localStorage.getItem('leave_requests') || '[]');
      const empLeaves = savedLeaves.filter((l: any) => l.employeeId === employeeId && l.status === 'approved');
      setLeaveHistory(empLeaves);
    }
  };

  const addPerformanceRecord = () => {
    const newRecord: PerformanceRecord = {
      id: `PERF_${Date.now()}`,
      employeeId,
      period: `Q${Math.ceil(new Date().getMonth() / 3)} ${new Date().getFullYear()}`,
      goals: 100,
      achieved: 85,
      rating: 4.2,
      feedback: "أداء ممتاز مع إمكانية للتحسن في المبيعات",
      strengths: ["التواصل الجيد", "حل المشكلات", "العمل الجماعي"],
      improvements: ["إدارة الوقت", "المهارات التقنية"],
      date: new Date().toISOString()
    };

    const allRecords = [...performanceRecords, newRecord];
    setPerformanceRecords(allRecords);
    
    const savedPerformance = JSON.parse(localStorage.getItem('employee_performance') || '[]');
    savedPerformance.push(newRecord);
    localStorage.setItem('employee_performance', JSON.stringify(savedPerformance));
  };

  const uploadDocument = () => {
    const newDocument: Document = {
      id: `DOC_${Date.now()}`,
      employeeId,
      name: "عقد العمل الجديد.pdf",
      type: 'contract',
      uploadDate: new Date().toISOString(),
      size: "1.2 MB"
    };

    const allDocs = [...documents, newDocument];
    setDocuments(allDocs);
    
    const savedDocs = JSON.parse(localStorage.getItem('employee_documents') || '[]');
    savedDocs.push(newDocument);
    localStorage.setItem('employee_documents', JSON.stringify(savedDocs));
  };

  if (!employee) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  const attendanceStats = {
    present: attendanceData.filter(d => d.status === 'present').length,
    late: attendanceData.filter(d => d.status === 'late').length,
    absent: attendanceData.filter(d => d.status === 'absent').length,
    totalHours: attendanceData.reduce((sum, d) => sum + d.hours, 0)
  };

  const avgRating = performanceRecords.length > 0 
    ? performanceRecords.reduce((sum, p) => sum + p.rating, 0) / performanceRecords.length 
    : 0;

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'contract': return <FileText className="h-4 w-4" />;
      case 'certificate': return <Award className="h-4 w-4" />;
      case 'id': return <User className="h-4 w-4" />;
      case 'medical': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDocumentTypeName = (type: Document['type']) => {
    const types = {
      contract: 'عقد عمل',
      certificate: 'شهادة',
      id: 'هوية',
      medical: 'تقرير طبي',
      other: 'أخرى'
    };
    return types[type] || 'مستند';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="text-lg font-bold">
                {employee.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{employee.name}</h2>
              <p className="text-muted-foreground">{employee.position} - {employee.department}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="attendance">الحضور</TabsTrigger>
            <TabsTrigger value="performance">الأداء</TabsTrigger>
            <TabsTrigger value="documents">الوثائق</TabsTrigger>
            <TabsTrigger value="history">السجل</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* المعلومات الأساسية */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    المعلومات الشخصية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        انضم في {new Date(employee.startDate).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.position}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.department}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">الراتب الشهري:</span>
                      <span className="font-bold text-lg">{employee.salary.toLocaleString()} ج.م</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm">الحالة:</span>
                    <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                      {employee.status === 'active' ? 'نشط' : 
                       employee.status === 'vacation' ? 'في إجازة' : 'غير نشط'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* الإحصائيات السريعة */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">تقييم الأداء</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center mb-2">
                      {avgRating.toFixed(1)}/5
                    </div>
                    <div className="flex justify-center mb-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < Math.floor(avgRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <Progress value={avgRating * 20} className="h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">معدل الحضور</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center mb-2 text-green-600">
                      {((attendanceStats.present / attendanceData.length) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-center text-muted-foreground">
                      {attendanceStats.present} من {attendanceData.length} يوم
                    </div>
                    <Progress value={(attendanceStats.present / attendanceData.length) * 100} className="h-2 mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">ساعات العمل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center mb-2">
                      {attendanceStats.totalHours.toFixed(0)}
                    </div>
                    <div className="text-sm text-center text-muted-foreground">
                      ساعة هذا الشهر
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">أيام الحضور</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">أيام التأخير</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">أيام الغياب</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">إجمالي الساعات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceStats.totalHours.toFixed(0)}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>سجل الحضور - آخر 30 يوم</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={attendanceData.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#3B82F6" name="ساعات العمل" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">تقييمات الأداء</h3>
              <Button onClick={addPerformanceRecord}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة تقييم جديد
              </Button>
            </div>

            {performanceRecords.length > 0 ? (
              <div className="space-y-4">
                {performanceRecords.map((record) => (
                  <Card key={record.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{record.period}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{record.rating}/5</div>
                          <div className="text-sm text-muted-foreground">
                            {record.achieved}% من الأهداف
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">الملاحظات:</h4>
                          <p className="text-sm text-muted-foreground">{record.feedback}</p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2 text-green-700">نقاط القوة:</h4>
                            <ul className="text-sm space-y-1">
                              {record.strengths.map((strength, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2 text-orange-700">مجالات التحسين:</h4>
                            <ul className="text-sm space-y-1">
                              {record.improvements.map((improvement, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <AlertCircle className="h-3 w-3 text-orange-600" />
                                  {improvement}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">تحقيق الأهداف:</h4>
                          <Progress value={record.achieved} className="h-3" />
                          <p className="text-sm text-muted-foreground mt-1">
                            {record.achieved}% من {record.goals} هدف
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد تقييمات أداء بعد</p>
                  <Button onClick={addPerformanceRecord} className="mt-4">
                    إضافة أول تقييم
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">وثائق الموظف</h3>
              <Button onClick={uploadDocument}>
                <Upload className="h-4 w-4 ml-2" />
                رفع وثيقة جديدة
              </Button>
            </div>

            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getDocumentIcon(doc.type)}
                          <Badge variant="outline">{getDocumentTypeName(doc.type)}</Badge>
                        </div>
                      </div>
                      
                      <h4 className="font-medium mb-2">{doc.name}</h4>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>الحجم: {doc.size}</div>
                        <div>
                          تاريخ الرفع: {new Date(doc.uploadDate).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 ml-1" />
                          عرض
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Download className="h-3 w-3 ml-1" />
                          تحميل
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد وثائق مرفوعة بعد</p>
                  <Button onClick={uploadDocument} className="mt-4">
                    رفع أول وثيقة
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">سجل الإجازات</h3>
              {leaveHistory.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="space-y-4 p-6">
                      {leaveHistory.map((leave) => (
                        <div key={leave.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium">{leave.leaveType}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(leave.startDate).toLocaleDateString('ar-EG')} - 
                              {new Date(leave.endDate).toLocaleDateString('ar-EG')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{leave.days} يوم</div>
                            <Badge variant="outline" className="text-green-600">
                              معتمدة
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">لا توجد إجازات سابقة</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}