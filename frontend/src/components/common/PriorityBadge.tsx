import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: string;
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  '低': { label: '低', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  '中': { label: '中', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
  '高': { label: '高', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || { label: priority, className: '' };

  return (
    <Badge variant="destructive" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
