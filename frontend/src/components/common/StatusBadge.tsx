import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  '未开始': { label: '未开始', className: 'bg-status-pending-bg text-status-pending hover:bg-status-pending-bg' },
  '进行中': { label: '进行中', className: 'bg-status-progress-bg text-status-progress hover:bg-status-progress-bg' },
  '已完成': { label: '已完成', className: 'bg-status-done-bg text-status-done hover:bg-status-done-bg' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: '' };

  return (
    <Badge variant="secondary" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
