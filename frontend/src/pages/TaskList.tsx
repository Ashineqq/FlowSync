import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useTasks, useSaveTask, useDeleteTask } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import type { Task } from '@/types';
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
import StatusBadge from '@/components/common/StatusBadge';
import PriorityBadge from '@/components/common/PriorityBadge';
import { DatePicker } from '@/components/common/DatePicker';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TableEmptyRow } from '@/components/common/TableEmptyRow';

const statusItems = [
  { label: '未开始', value: '未开始' },
  { label: '进行中', value: '进行中' },
  { label: '已完成', value: '已完成' },
];

const priorityItems = [
  { label: '低', value: '低' },
  { label: '中', value: '中' },
  { label: '高', value: '高' },
];

const taskSchema = z.object({
  projectId: z.string().min(1, '请选择项目'),
  title: z.string().min(1, '请输入任务标题'),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.string().min(1, '请选择状态'),
  priority: z.string().min(1, '请选择优先级'),
  dueDate: z.string().optional(),
});

type TaskForm = z.infer<typeof taskSchema>;

export default function TaskList() {
  const { user, isLeader } = useAuth();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: users = [] } = useUsers();
  const [filterProjectId, setFilterProjectId] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const form = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId: '', title: '', description: '', assigneeId: '',
      status: '未开始', priority: '中', dueDate: '',
    },
  });

  const saveMutation = useSaveTask(() => {
    setDialogOpen(false);
    setEditingTask(null);
    form.reset();
  });

  const deleteMutation = useDeleteTask(() => {
    setDeleteConfirmId(null);
  });

  const onSubmit = (data: TaskForm) => {
    saveMutation.mutate({
      ...data,
      projectId: parseInt(data.projectId),
      assigneeId: data.assigneeId ? parseInt(data.assigneeId) : undefined,
      id: editingTask?.id,
    });
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId === null) return;
    deleteMutation.mutate(deleteConfirmId);
  };

  const handleStatusChange = (task: Task, newStatus: string) => {
    saveMutation.mutate(
      { ...task, status: newStatus },
      {
        onSuccess: () => toast.success('状态更新成功'),
        onError: () => toast.error('状态更新失败'),
      }
    );
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    form.reset({
      projectId: task.projectId.toString(),
      title: task.title,
      description: task.description || '',
      assigneeId: task.assigneeId?.toString() || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || '',
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTask(null);
    form.reset();
    setDialogOpen(true);
  };

  const filteredTasks = filterProjectId === 'all'
    ? tasks
    : tasks.filter((t) => t.projectId === parseInt(filterProjectId));

  const canEditTask = (task: Task) => isLeader || task.assigneeId === user?.id;

  const projectFilterItems = [
    { label: '全部项目', value: 'all' },
    ...projects.map((p) => ({ label: p.name, value: p.id.toString() })),
  ];
  const projectFormItems = projects.map((p) => ({ label: p.name, value: p.id.toString() }));
  const assigneeItems = users.map((u) => ({ label: u.realName, value: u.id.toString() }));

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">任务管理</h2>
        <div className="flex items-center gap-4">
          <Select items={projectFilterItems} value={filterProjectId} onValueChange={(v: string | null) => setFilterProjectId(v || 'all')}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="筛选项目" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>项目</SelectLabel>
                {projectFilterItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {isLeader && (
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />新建任务
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>标题</TableHead>
            <TableHead>项目</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>优先级</TableHead>
            <TableHead>负责人</TableHead>
            <TableHead>创建人</TableHead>
            <TableHead>截止日期</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.length === 0 && (
            <TableEmptyRow colSpan={8} message="暂无任务" />
          )}
          {filteredTasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>{projects.find((p) => p.id === task.projectId)?.name}</TableCell>
              <TableCell>
                {canEditTask(task) ? (
                  <Select items={statusItems} value={task.status} onValueChange={(v: string | null) => handleStatusChange(task, v || task.status)}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>状态</SelectLabel>
                        {statusItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                ) : (
                  <StatusBadge status={task.status} />
                )}
              </TableCell>
              <TableCell><PriorityBadge priority={task.priority} /></TableCell>
              <TableCell>{task.assigneeName}</TableCell>
              <TableCell>{task.creatorName}</TableCell>
              <TableCell>{task.dueDate}</TableCell>
              <TableCell>
                {isLeader && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(task.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>{editingTask ? '编辑任务' : '新建任务'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} id="task-form">
                <FieldGroup>
              <Controller
                name="projectId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel required>所属项目</FieldLabel>
                    <Select items={projectFormItems} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="请选择项目" /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>项目</SelectLabel>
                          {projectFormItems.map((item) => (
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
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel required>任务标题</FieldLabel>
                    <Input {...field} aria-invalid={fieldState.invalid} placeholder="请输入任务标题" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>任务描述</FieldLabel>
                    <Textarea {...field} placeholder="请输入任务描述" />
                  </Field>
                )}
              />
              <Controller
                name="assigneeId"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>负责人</FieldLabel>
                    <Select items={assigneeItems} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="请选择负责人" /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>负责人</SelectLabel>
                          {assigneeItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel required>状态</FieldLabel>
                      <Select items={statusItems} value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>状态</SelectLabel>
                            {statusItems.map((item) => (
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
                  name="priority"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel required>优先级</FieldLabel>
                      <Select items={priorityItems} value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>优先级</SelectLabel>
                            {priorityItems.map((item) => (
                              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="dueDate"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>截止日期</FieldLabel>
                    <DatePicker value={field.value} onChange={field.onChange} placeholder="选择截止日期" />
                  </Field>
                )}
              />
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter>
              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                <Button type="submit" form="task-form" disabled={saveMutation.isPending}>保存</Button>
              </div>
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
        title="确认删除"
        description="确定要删除该任务吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
