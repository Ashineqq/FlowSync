import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOverview } from '@/hooks/useOverview';
import { cn } from '@/lib/utils';
import { Users, FolderOpen, ListTodo, FileText, Activity } from 'lucide-react';

const statCards = [
  { title: '用户数', key: 'userCount' as const, icon: Users, color: 'text-chart-1' },
  { title: '项目数', key: 'projectCount' as const, icon: FolderOpen, color: 'text-chart-2' },
  { title: '任务数', key: 'taskCount' as const, icon: ListTodo, color: 'text-chart-3' },
  { title: '进度数', key: 'logCount' as const, icon: Activity, color: 'text-chart-4' },
  { title: '总结数', key: 'summaryCount' as const, icon: FileText, color: 'text-chart-5' },
];

export default function Overview() {
  const { data: stats, isLoading } = useOverview();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

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
                <div className="text-2xl font-bold">{stats?.[card.key] ?? 0}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
