import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { getUsers, createUser, updateUser } from '@/api/user';
import type { User } from '@/types';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Plus, Pencil } from 'lucide-react';

const roleItems = [
  { label: '负责人', value: '负责人' },
  { label: '成员', value: '成员' },
];

const userSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  realName: z.string().min(1, '请输入姓名'),
  role: z.string().min(1, '请选择角色'),
  password: z.string().optional(),
});

type UserForm = z.infer<typeof userSchema>;

export default function MemberList() {
  const { user: currentUser, isLeader } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { username: '', realName: '', role: '成员', password: '' },
  });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res: any = await getUsers();
      if (res.success) setUsers(res.data || []);
    } catch (err) {
      console.error('加载用户列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UserForm) => {
    try {
      if (editingUser) {
        const payload: any = { realName: data.realName, role: data.role };
        if (data.password) payload.password = data.password;
        const res: any = await updateUser(editingUser.id, payload);
        if (res.success) {
          toast.success('更新成功');
          setDialogOpen(false);
          setEditingUser(null);
          form.reset();
          loadUsers();
        } else {
          toast.error('更新失败', { description: res.message });
        }
      } else {
        const res: any = await createUser({
          username: data.username,
          realName: data.realName,
          role: data.role,
          password: data.password || '123456',
        });
        if (res.success) {
          toast.success('创建成功', { description: '默认密码：123456' });
          setDialogOpen(false);
          form.reset();
          loadUsers();
        } else {
          toast.error('创建失败', { description: res.message });
        }
      }
    } catch {
      toast.error('操作失败', { description: '网络错误，请重试' });
    }
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    form.reset({ username: '', realName: '', role: '成员', password: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (u: User) => {
    setEditingUser(u);
    form.reset({
      username: u.username,
      realName: u.realName,
      role: u.role,
      password: '',
    });
    setDialogOpen(true);
  };

  const canEdit = (u: User) => isLeader || u.id === currentUser?.id;

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">成员列表</h2>
        {isLeader && (
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />添加成员
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户名</TableHead>
            <TableHead>姓名</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.username}</TableCell>
              <TableCell>{u.realName}</TableCell>
              <TableCell>
                <Badge variant={u.role === '负责人' ? 'default' : 'secondary'}>
                  {u.role}
                </Badge>
              </TableCell>
              <TableCell>{u.createTime}</TableCell>
              <TableCell>
                {canEdit(u) && (
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(u)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
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
              <CardTitle>{editingUser ? '编辑成员' : '添加成员'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} id="member-form">
                <FieldGroup>
                  {!editingUser && (
                    <Controller
                      name="username"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel required>用户名</FieldLabel>
                          <Input {...field} aria-invalid={fieldState.invalid} placeholder="请输入用户名" />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  )}
                  <Controller
                    name="realName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel required>姓名</FieldLabel>
                        <Input {...field} aria-invalid={fieldState.invalid} placeholder="请输入姓名" />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="role"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel required>角色</FieldLabel>
                        <Select items={roleItems} value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>角色</SelectLabel>
                              {roleItems.map((item) => (
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
                    name="password"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>{editingUser ? '重置密码（留空则不修改）' : '密码'}</FieldLabel>
                        <Input {...field} type="password" placeholder={editingUser ? '留空则不修改' : '默认 123456'} />
                      </Field>
                    )}
                  />
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter>
              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                <Button type="submit" form="member-form">保存</Button>
              </div>
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}
