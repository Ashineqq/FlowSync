import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  FolderOpen,
  Wand2,
  ListTodo,
  Activity,
  FileText,
  Users,
  User,
} from 'lucide-react';

const menuItems = [
  { path: '/overview', label: '总览', icon: BarChart3 },
  { path: '/projects', label: '项目管理', icon: FolderOpen },
  { path: '/task-breakdown', label: '任务拆解', icon: Wand2, leaderOnly: true },
  { path: '/tasks', label: '任务管理', icon: ListTodo },
  { path: '/task-logs', label: '进度跟踪', icon: Activity },
  { path: '/summaries', label: '总结中心', icon: FileText },
  { path: '/members', label: '成员列表', icon: Users },
  { path: '/profile', label: '个人信息', icon: User },
];

export default function Sidebar() {
  const location = useLocation();
  const { isLeader } = useAuth();

  const filteredItems = menuItems.filter(
    (item) => !item.leaderOnly || isLeader
  );

  return (
    <aside className="w-56 bg-card border-r border-border flex flex-col">
      <div className="h-14 px-4 border-b border-border flex items-center">
        <h1 className="text-xl font-bold text-foreground">FlowSync</h1>
      </div>
      <nav className="flex-1 p-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
