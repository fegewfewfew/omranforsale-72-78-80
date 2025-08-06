import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { DatePickerWithRange } from "@/components/ui/calendar";
import { 
  Users, Activity, Clock, TrendingUp, BarChart3, PieChart, 
  Calendar, Download, RefreshCw, Eye, UserCheck, AlertTriangle,
  MousePointer, FileText, Shield, Database
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart
} from "recharts";
import { storage } from "@/utils/storage";
import { User } from "@/types/auth";
import { addDays, format, parseISO, subDays } from "date-fns";
import { ar } from "date-fns/locale";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface UserActivity {
  id: string;
  userId: string;
  action: string;
  module: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  sessionDuration?: number;
}

interface UserMetrics {
  totalLogins: number;
  avgSessionDuration: number;
  mostUsedModule: string;
  lastActivity: string;
  totalActions: number;
  securityEvents: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

export function UserAnalyticsDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [metrics, setMetrics] = useState<UserMetrics>({
    totalLogins: 0,
    avgSessionDuration: 0,
    mostUsedModule: '',
    lastActivity: '',
    totalActions: 0,
    securityEvents: 0
  });

  useEffect(() => {
    loadData();
    generateMockData(); // إنشاء بيانات وهمية للعرض
  }, [selectedUser, dateRange]);

  const loadData = () => {
    const savedUsers = storage.getItem('system_users', []);
    setUsers(savedUsers);
    
    const savedActivities = storage.getItem('user_activities', []);
    setActivities(savedActivities);
  };

  // إنشاء بيانات وهمية للعرض التوضيحي
  const generateMockData = () => {
    const mockActivities: UserActivity[] = [];
    const modules = ['sales', 'inventory', 'purchases', 'reports', 'users', 'settings'];
    const actions = ['login', 'create', 'update', 'delete', 'view', 'export'];
    
    // إنشاء أنشطة وهمية للـ 30 يوم الماضية
    for (let i = 0; i < 500; i++) {
      const randomDate = new Date(
        dateRange.from.getTime() + Math.random() * (dateRange.to.getTime() - dateRange.from.getTime())
      );
      
      const randomUser = users[Math.floor(Math.random() * users.length)];
      if (!randomUser) continue;

      mockActivities.push({
        id: `activity-${i}`,
        userId: randomUser.id,
        action: actions[Math.floor(Math.random() * actions.length)],
        module: modules[Math.floor(Math.random() * modules.length)],
        timestamp: randomDate.toISOString(),
        sessionDuration: Math.floor(Math.random() * 7200), // 0-2 ساعة
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0...'
      });
    }

    setActivities(mockActivities);
    calculateMetrics(mockActivities);
  };

  const calculateMetrics = (activityData: UserActivity[]) => {
    const filteredActivities = selectedUser === "all" 
      ? activityData 
      : activityData.filter(a => a.userId === selectedUser);

    const logins = filteredActivities.filter(a => a.action === 'login').length;
    const totalDuration = filteredActivities.reduce((sum, a) => sum + (a.sessionDuration || 0), 0);
    const avgDuration = filteredActivities.length > 0 ? totalDuration / filteredActivities.length : 0;

    // أكثر الوحدات استخداماً
    const moduleUsage: { [key: string]: number } = {};
    filteredActivities.forEach(a => {
      moduleUsage[a.module] = (moduleUsage[a.module] || 0) + 1;
    });
    const mostUsed = Object.keys(moduleUsage).reduce((a, b) => 
      moduleUsage[a] > moduleUsage[b] ? a : b, ''
    );

    const lastActivity = filteredActivities.length > 0 
      ? filteredActivities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0].timestamp
      : '';

    setMetrics({
      totalLogins: logins,
      avgSessionDuration: avgDuration,
      mostUsedModule: mostUsed,
      lastActivity,
      totalActions: filteredActivities.length,
      securityEvents: Math.floor(Math.random() * 10) // عشوائي للعرض
    });
  };

  // بيانات الرسوم البيانية
  const getChartData = () => {
    const filteredActivities = selectedUser === "all" 
      ? activities 
      : activities.filter(a => a.userId === selectedUser);

    // نشاط يومي
    const dailyActivity: { [key: string]: number } = {};
    filteredActivities.forEach(activity => {
      const date = format(parseISO(activity.timestamp), 'yyyy-MM-dd');
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });

    const dailyData = Object.entries(dailyActivity)
      .map(([date, count]) => ({
        date: format(parseISO(date), 'MM/dd', { locale: ar }),
        activities: count
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // آخر 14 يوم

    // توزيع الوحدات
    const moduleUsage: { [key: string]: number } = {};
    filteredActivities.forEach(a => {
      moduleUsage[a.module] = (moduleUsage[a.module] || 0) + 1;
    });

    const moduleData = Object.entries(moduleUsage).map(([module, count]) => ({
      name: getModuleNameAr(module),
      value: count,
      color: COLORS[Object.keys(moduleUsage).indexOf(module) % COLORS.length]
    }));

    // أنشطة حسب الساعة
    const hourlyActivity: { [key: number]: number } = {};
    filteredActivities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      activities: hourlyActivity[hour] || 0
    }));

    return { dailyData, moduleData, hourlyData };
  };

  const getModuleNameAr = (module: string): string => {
    const moduleNames: { [key: string]: string } = {
      'sales': 'المبيعات',
      'inventory': 'المخزون',
      'purchases': 'المشتريات',
      'reports': 'التقارير',
      'users': 'المستخدمين',
      'settings': 'الإعدادات',
      'dashboard': 'لوحة التحكم',
      'customers': 'العملاء',
      'suppliers': 'الموردين'
    };
    return moduleNames[module] || module;
  };

  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'مستخدم غير معروف';
  };

  const { dailyData, moduleData, hourlyData } = getChartData();

  // المقاييس الرئيسية
  const getKPIData = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const todayActivities = activities.filter(a => {
      const activityDate = format(parseISO(a.timestamp), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      return activityDate === today;
    }).length;

    const uniqueActiveUsersToday = new Set(
      activities
        .filter(a => {
          const activityDate = format(parseISO(a.timestamp), 'yyyy-MM-dd');
          const today = format(new Date(), 'yyyy-MM-dd');
          return activityDate === today;
        })
        .map(a => a.userId)
    ).size;

    return {
      totalUsers,
      activeUsers,
      todayActivities,
      uniqueActiveUsersToday,
      engagementRate: totalUsers > 0 ? ((uniqueActiveUsersToday / totalUsers) * 100).toFixed(1) : '0'
    };
  };

  const kpiData = getKPIData();

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">تحليلات المستخدمين</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateMockData}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث البيانات
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>فلاتر التحليل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">المستخدم</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستخدمين</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.role.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">الفترة الزمنية</label>
              <Select 
                value="30d" 
                onValueChange={(value) => {
                  const days = parseInt(value);
                  setDateRange({
                    from: subDays(new Date(), days),
                    to: new Date()
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">آخر 7 أيام</SelectItem>
                  <SelectItem value="30">آخر 30 يوم</SelectItem>
                  <SelectItem value="90">آخر 3 أشهر</SelectItem>
                  <SelectItem value="365">آخر سنة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full">
                <Eye className="h-4 w-4 ml-2" />
                تطبيق الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{kpiData.totalUsers}</p>
                <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{kpiData.uniqueActiveUsersToday}</p>
                <p className="text-sm text-muted-foreground">نشط اليوم</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{kpiData.todayActivities}</p>
                <p className="text-sm text-muted-foreground">أنشطة اليوم</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{kpiData.engagementRate}%</p>
                <p className="text-sm text-muted-foreground">معدل التفاعل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(metrics.avgSessionDuration / 60)}</p>
                <p className="text-sm text-muted-foreground">دقيقة متوسط الجلسة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              اتجاه النشاط اليومي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => `التاريخ: ${value}`}
                  formatter={(value) => [value, 'عدد الأنشطة']}
                />
                <Area 
                  type="monotone" 
                  dataKey="activities" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Module Usage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              توزيع استخدام الوحدات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={moduleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {moduleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity & User Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              النشاط حسب الساعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="activities" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              مقاييس المستخدم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">إجمالي تسجيلات الدخول</span>
                <Badge variant="outline">{metrics.totalLogins}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">إجمالي الإجراءات</span>
                <Badge variant="outline">{metrics.totalActions}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">الوحدة الأكثر استخداماً</span>
                <Badge variant="secondary">{getModuleNameAr(metrics.mostUsedModule)}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">أحداث الأمان</span>
                <Badge variant={metrics.securityEvents > 0 ? "destructive" : "default"}>
                  {metrics.securityEvents}
                </Badge>
              </div>
              
              {metrics.lastActivity && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">آخر نشاط</p>
                  <p className="text-sm font-medium">
                    {format(parseISO(metrics.lastActivity), 'yyyy/MM/dd HH:mm', { locale: ar })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            الأنشطة الأخيرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities
              .filter(a => selectedUser === "all" || a.userId === selectedUser)
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 10)
              .map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div>
                      <p className="font-medium">
                        {getUserName(activity.userId)} - {activity.action} في {getModuleNameAr(activity.module)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(activity.timestamp), 'yyyy/MM/dd HH:mm', { locale: ar })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{activity.module}</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}