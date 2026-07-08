import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          团队任务管理系统
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{user?.realName}</span>
          <Badge variant={user?.role === '负责人' ? 'default' : 'secondary'}>
            {user?.role}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          退出
        </Button>
      </div>
    </header>
  );
}
