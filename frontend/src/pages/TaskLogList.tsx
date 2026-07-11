import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useTaskLogs, useSaveTaskLog } from '@/hooks/useTaskLogs';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Plus } from 'lucide-react';
import { TableEmptyRow } from '@/components/common/TableEmptyRow';

const logSchema = z.object({
  taskId: z.string().min(1, '请选择任务'),
  progressPercent: z.string().min(1, '请输入进度').refine(
    (v) => { const n = parseInt(v); return !isNaN(n) && n >= 0 && n <= 100; },
    '进度必须在 0-100 之间'
  ),
  content: z.string().min(1, '请输入进度内容'),
});

type LogForm = z.infer<typeof logSchema>;

export default function TaskLogList() {
  const { user } = useAuth();
  const { data: logs = [], isLoading } = useTaskLogs();
  const { data: tasks = [] } = useTasks();
  const [filterTaskId, setFilterTaskId] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<LogForm>({
    resolver: zodResolver(logSchema),
    defaultValues: { taskId: '', progressPercent: '', content: '' },
  });

  const saveMutation = useSaveTaskLog(() => {
    setDialogOpen(false);
    form.reset();
  });

  const onSubmit = (data: LogForm) => {
    saveMutation.mutate({
      taskId: parseInt(data.taskId),
      progressPercent: parseInt(data.progressPercent),
      content: data.content,
      operatorId: user?.id,
    });
  };

  const filteredLogs = filterTaskId === 'all'
    ? logs
    : logs.filter((l) => l.taskId === parseInt(filterTaskId));

  const taskFilterItems = [
    { label: '全部任务', value: 'all' },
    ...tasks.map((t) => ({ label: t.title, value: t.id.toString() })),
  ];
  const taskFormItems = tasks.map((t) => ({ label: t.title, value: t.id.toString() }));

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">进度跟踪</h2>
        <div className="flex items-center gap-4">
          <Select items={taskFilterItems} value={filterTaskId} onValueChange={(v: string | null) => setFilterTaskId(v || 'all')}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="筛选任务" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>任务</SelectLabel>
                {taskFilterItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button onClick={() => { form.reset(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />新增进度
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>任务标题</TableHead>
            <TableHead>进度</TableHead>
            <TableHead>内容</TableHead>
            <TableHead>操作人</TableHead>
            <TableHead>创建时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLogs.length === 0 && (
            <TableEmptyRow colSpan={5} message="暂无进度" />
          )}
          {filteredLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{log.taskTitle}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-progress-bg rounded-full overflow-hidden">
                    <div className="h-full bg-progress-fill rounded-full" style={{ width: `${log.progressPercent}%` }} />
                  </div>
                  <span className="text-sm">{log.progressPercent}%</span>
                </div>
              </TableCell>
              <TableCell>{log.content}</TableCell>
              <TableCell>{log.operatorName}</TableCell>
              <TableCell>{log.createTime}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>新增进度</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} id="log-form">
                <FieldGroup>
              <Controller
                name="taskId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel required>任务</FieldLabel>
                    <Select items={taskFormItems} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="请选择任务" /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>任务</SelectLabel>
                          {taskFormItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="progressPercent"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel required>进度百分比</FieldLabel>
                    <Input {...field} type="number" min="0" max="100" aria-invalid={fieldState.invalid} placeholder="请输入进度百分比 (0-100)" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="content"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel required>进度内容</FieldLabel>
                    <Textarea {...field} aria-invalid={fieldState.invalid} placeholder="请输入进度内容" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter>
              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                <Button type="submit" form="log-form" disabled={saveMutation.isPending}>保存</Button>
              </div>
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}
