import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { getSummaries, saveSummary } from '@/api/summary';
import { getProjects } from '@/api/project';
import { getTasks } from '@/api/task';
import type { TaskSummary, Project, Task } from '@/types';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { TableEmptyRow } from '@/components/common/TableEmptyRow';

const summaryTypeItems = [
  { label: '阶段总结', value: '阶段总结' },
  { label: '最终总结', value: '最终总结' },
];

const summarySchema = z.object({
  projectId: z.string().min(1, '请选择项目'),
  taskId: z.string().optional(),
  summaryType: z.string().min(1, '请选择总结类型'),
  content: z.string().min(1, '请输入总结内容'),
});

type SummaryForm = z.infer<typeof summarySchema>;

export default function SummaryList() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<TaskSummary[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<SummaryForm>({
    resolver: zodResolver(summarySchema),
    defaultValues: { projectId: '', taskId: '', summaryType: '阶段总结', content: '' },
  });

  const watchProjectId = form.watch('projectId');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [sumRes, projRes, taskRes]: any[] = await Promise.all([getSummaries(), getProjects(), getTasks()]);
      if (sumRes.success) setSummaries(sumRes.data || []);
      if (projRes.success) setProjects(projRes.data || []);
      if (taskRes.success) setTasks(taskRes.data || []);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SummaryForm) => {
    try {
      const payload = {
        projectId: parseInt(data.projectId),
        taskId: data.taskId ? parseInt(data.taskId) : null,
        summaryType: data.summaryType,
        content: data.content,
        createdBy: user?.id,
      };
      const res: any = await saveSummary(payload);
      if (res.success) {
        toast.success('创建成功');
        setDialogOpen(false);
        form.reset();
        loadData();
      } else {
        toast.error('创建失败', { description: res.message });
      }
    } catch (err) {
      toast.error('创建失败', { description: '网络错误，请重试' });
    }
  };

  const filteredTasks = watchProjectId
    ? tasks.filter((t) => t.projectId === parseInt(watchProjectId))
    : [];

  const projectItems = projects.map((p) => ({ label: p.name, value: p.id.toString() }));
  const taskItems = filteredTasks.map((t) => ({ label: t.title, value: t.id.toString() }));

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">总结中心</h2>
        <Button onClick={() => { form.reset(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />新增总结
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>项目</TableHead>
            <TableHead>关联任务</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>内容</TableHead>
            <TableHead>创建人</TableHead>
            <TableHead>创建时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summaries.length === 0 && (
            <TableEmptyRow colSpan={6} message="暂无总结" />
          )}
          {summaries.map((summary) => (
            <TableRow key={summary.id}>
              <TableCell className="font-medium">{summary.projectName}</TableCell>
              <TableCell>{summary.taskTitle || '-'}</TableCell>
              <TableCell>
                <Badge variant={summary.summaryType === '阶段总结' ? 'default' : 'secondary'}>
                  {summary.summaryType}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">{summary.content}</TableCell>
              <TableCell>{summary.creatorName}</TableCell>
              <TableCell>{summary.createTime}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>新增总结</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} id="summary-form">
                <FieldGroup>
              <Controller
                name="projectId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel required>项目</FieldLabel>
                    <Select items={projectItems} value={field.value} onValueChange={(v: string | null) => { field.onChange(v || ''); form.setValue('taskId', ''); }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="请选择项目" /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>项目</SelectLabel>
                          {projectItems.map((item) => (
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
                name="taskId"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>关联任务（可选）</FieldLabel>
                    <Select items={taskItems} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="请选择任务" /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>任务</SelectLabel>
                          {taskItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                name="summaryType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel required>总结类型</FieldLabel>
                    <Select items={summaryTypeItems} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>类型</SelectLabel>
                          {summaryTypeItems.map((item) => (
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
                name="content"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel required>总结内容</FieldLabel>
                    <Textarea {...field} aria-invalid={fieldState.invalid} placeholder="请输入总结内容" rows={6} />
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
                <Button type="submit" form="summary-form">保存</Button>
              </div>
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}
