import { TableCell, TableRow } from '@/components/ui/table';
import { Inbox } from 'lucide-react';

interface TableEmptyRowProps {
  colSpan: number;
  message?: string;
}

export function TableEmptyRow({ colSpan, message = '暂无数据' }: TableEmptyRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-12">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Inbox className="h-10 w-10 opacity-40" />
          <span className="text-sm">{message}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}
