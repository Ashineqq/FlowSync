import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { getProjects, saveProject, deleteProject } from '@/api/project';
import { getUsers } from '@/api/user';
import type { Project, User } from '@/types';
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

const projectSchema = z.object({
  name: z.string().min(1, '请输入项目名称'),
  description: z.string().optional(),
  status: z.string().min(1, '请选择状态'),
  priority: z.string().min(1, '请选择优先级'),
  ownerId: z.string().min(1, '请选择负责人'),
  startDate: z.string().min(1, '请选择开始日期'),
  endDate: z.string().min(1, '请选择结束日期'),
}).refine((data) => {
  if (!data.startDate || !data.endDate) return true;
  return data.endDate >= data.startDate;
}, {
  message: '结束日期不能早于开始日期',
  path: ['endDate'],
});

type ProjectForm = z.infer<typeof projectSchema>;

export default function ProjectList() {
  const { isLeader } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '', description: '', status: '未开始', priority: '中',
      ownerId: '', startDate: '', endDate: '',
    },
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [projRes, userRes]: any[] = await Promise.all([getProjects(), getUsers()]);
      if (projRes.success) setProjects(projRes.data || []);
      if (userRes.success) setUsers(userRes.data || []);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProjectForm) => {
    try {
      const payload = {
        ...data,
        ownerId: parseInt(data.ownerId),
        id: editingProject?.id,
      };
      const res: any = await saveProject(payload);
      if (res.success) {
        toast.success(editingProject ? '更新成功' : '创建成功');
        setDialogOpen(false);
        setEditingProject(null);
        form.reset();
        loadData();
      } else {
        toast.error('保存失败', { description: res.message });
      }
    } catch (err) {
      toast.error('保存失败', { description: '网络错误，请重试' });
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      const res: any = await deleteProject(deleteConfirmId);
      if (res.success) {
        toast.success('删除成功');
        setDeleteConfirmId(null);
        loadData();
      } else {
        toast.error('删除失败', { description: res.message });
        setDeleteConfirmId(null);
      }
    } catch (err) {
      toast.error('删除失败', { description: '网络错误，请重试' });
      setDeleteConfirmId(null);
    }
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    form.reset({
      name: project.name,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      ownerId: project.ownerId.toString(),
      startDate: project.startDate || '',
      endDate: project.endDate || '',
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProject(null);
    form.reset();
    setDialogOpen(true);
  };

  const ownerItems = users.map((u) => ({ label: u.realName, value: u.id.toString() }));

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">项目管理</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />新建项目
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>优先级</TableHead>
            <TableHead>负责人</TableHead>
            <TableHead>开始日期</TableHead>
            <TableHead>结束日期</TableHead>
            <TableHead>创建时间</TableHead>
            {isLeader && <TableHead>操作</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 && (
            <TableEmptyRow colSpan={isLeader ? 8 : 7} message="暂无项目" />
          )}
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell><StatusBadge status={project.status} /></TableCell>
              <TableCell><PriorityBadge priority={project.priority} /></TableCell>
              <TableCell>{project.ownerName}</TableCell>
              <TableCell>{project.startDate}</TableCell>
              <TableCell>{project.endDate}</TableCell>
              <TableCell>{project.createTime}</TableCell>
              {isLeader && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(project.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>{editingProject ? '编辑项目' : '新建项目'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} id="project-form">
                <FieldGroup>
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel required>项目名称</FieldLabel>
                        <Input {...field} aria-invalid={fieldState.invalid} placeholder="请输入项目名称" />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>项目描述</FieldLabel>
                        <Textarea {...field} placeholder="请输入项目描述" />
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
                    name="ownerId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel required>负责人</FieldLabel>
                        <Select items={ownerItems} value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="请选择负责人" /></SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>负责人</SelectLabel>
                              {ownerItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      name="startDate"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel required>开始日期</FieldLabel>
                          <DatePicker value={field.value} onChange={field.onChange} placeholder="选择开始日期" />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      name="endDate"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel required>结束日期</FieldLabel>
                          <DatePicker value={field.value} onChange={field.onChange} placeholder="选择结束日期" />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter>
              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                <Button type="submit" form="project-form">保存</Button>
              </div>
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
        title="确认删除"
        description="确定要删除该项目吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
