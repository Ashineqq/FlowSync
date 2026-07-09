import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: string;
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  '低': { label: '低', className: 'bg-priority-low-bg text-priority-low hover:bg-priority-low-bg' },
  '中': { label: '中', className: 'bg-priority-medium-bg text-priority-medium hover:bg-priority-medium-bg' },
  '高': { label: '高', className: 'bg-priority-high-bg text-priority-high hover:bg-priority-high-bg' },
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || { label: priority, className: '' };

  return (
    <Badge variant="destructive" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
