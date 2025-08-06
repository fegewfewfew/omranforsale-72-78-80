import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, UserCheck, UserX, Clock, Calendar, TrendingUp, 
  Award, FileText, DollarSign, Building, Target, Activity
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { employeeManager } from "@/utils/employeeManager";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function EmployeeDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const statistics = employeeManager.getEmployeeStatistics();
    setStats(statistics);

    // إعداد بيانات الأقسام للرسم البياني
    const deptData = statistics.departmentDistribution.map(dept => ({
      name: dept.department,
      value: dept.count,
      percentage: ((dept.count / statistics.totalEmployees) * 100).toFixed(1)
    }));
    setDepartmentData(deptData);

    // محاكاة بيانات الحضور للأسبوع الماضي
    const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const mockAttendanceData = weekDays.map(day => ({
      day,
      present: Math.floor(Math.random() * statistics.activeEmployees) + Math.floor(statistics.activeEmployees * 0.7),
      absent: Math.floor(Math.random() * 5),
      late: Math.floor(Math.random() * 3)
    }));
    setAttendanceData(mockAttendanceData);
  };

  if (!stats) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-mada-heading">لوحة تحكم الموظفين</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
          <Button>
            <Activity className="h-4 w-4 ml-2" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">إجمالي الموظفين</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalEmployees}</div>
            <p className="text-xs text-blue-600">في {stats.departments} أقسام</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">الموظفين النشطين</CardTitle>
            <UserCheck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.activeEmployees}</div>
            <p className="text-xs text-green-600">
              {((stats.activeEmployees / stats.totalEmployees) * 100).toFixed(1)}% من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">في إجازة</CardTitle>
            <Calendar className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{stats.onVacationEmployees}</div>
            <p className="text-xs text-yellow-600">موظف في إجازة حالياً</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">إجمالي الرواتب</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.totalSalaries.toLocaleString()}</div>
            <p className="text-xs text-purple-600">ج.م شهرياً</p>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* توزيع الأقسام */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              توزيع الموظفين حسب الأقسام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* حضور الأسبوع */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              الحضور خلال الأسبوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" fill="#10B981" name="حاضر" />
                <Bar dataKey="late" fill="#F59E0B" name="متأخر" />
                <Bar dataKey="absent" fill="#EF4444" name="غائب" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* الأنشطة الأخيرة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            الأنشطة الأخيرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivities.slice(0, 5).map((activity: any, index: number) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="mt-1">
                  {activity.action === 'created' && <UserCheck className="h-4 w-4 text-green-600" />}
                  {activity.action === 'updated' && <Activity className="h-4 w-4 text-blue-600" />}
                  {activity.action === 'salary_changed' && <DollarSign className="h-4 w-4 text-yellow-600" />}
                  {activity.action === 'status_changed' && <Target className="h-4 w-4 text-purple-600" />}
                  {activity.action === 'deleted' && <UserX className="h-4 w-4 text-red-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.details}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.performedBy}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">متوسط الراتب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.averageSalary.toLocaleString()} ج.م
            </div>
            <p className="text-sm text-muted-foreground">للموظفين النشطين</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">أكبر قسم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.departmentDistribution[0]?.department || 'لا يوجد'}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.departmentDistribution[0]?.count || 0} موظف
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معدل الحضور</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {attendanceData.length > 0 
                ? ((attendanceData.reduce((sum, day) => sum + day.present, 0) / 
                   (attendanceData.reduce((sum, day) => sum + day.present + day.absent + day.late, 0))) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground">هذا الأسبوع</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}