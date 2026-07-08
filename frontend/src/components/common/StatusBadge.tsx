import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  '未开始': { label: '未开始', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  '进行中': { label: '进行中', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  '已完成': { label: '已完成', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: '' };

  return (
    <Badge variant="secondary" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
