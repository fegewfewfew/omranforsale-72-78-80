import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Shield } from 'lucide-react';

interface SessionsStatsProps {
  stats: {
    active: number;
    inactive: number;
    total: number;
  };
}

export function SessionsStats({ stats }: SessionsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الجلسات النشطة</CardTitle>
          <Activity className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <Badge variant="outline" className="text-xs text-green-600 border-green-600">
            نشطة حالياً
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الجلسات المنتهية</CardTitle>
          <Clock className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
          <Badge variant="outline" className="text-xs text-gray-600 border-gray-600">
            منتهية
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي الجلسات</CardTitle>
          <Shield className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
            المجموع
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}