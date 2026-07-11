import { useState, useEffect } from 'react';
import { getOverview } from '@/api/overview';
import type { OverviewStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Users, FolderOpen, ListTodo, FileText, Activity } from 'lucide-react';

export default function Overview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res: any = await getOverview();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('加载统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  const statCards = [
    { title: '用户数', value: stats?.userCount || 0, icon: Users, color: 'text-chart-1' },
    { title: '项目数', value: stats?.projectCount || 0, icon: FolderOpen, color: 'text-chart-2' },
    { title: '任务数', value: stats?.taskCount || 0, icon: ListTodo, color: 'text-chart-3' },
    { title: '进度数', value: stats?.logCount || 0, icon: Activity, color: 'text-chart-4' },
    { title: '总结数', value: stats?.summaryCount || 0, icon: FileText, color: 'text-chart-5' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">系统总览</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className={cn('h-4 w-4', card.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
