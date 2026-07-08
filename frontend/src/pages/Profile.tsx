import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { updatePassword } from '@/api/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { getApiKey, setApiKey, removeApiKey, hasApiKey, maskApiKey } from '@/lib/api-key';

const passwordSchema = z.object({
  oldPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(6, '新密码长度不能少于6位'),
  confirmPassword: z.string().min(1, '请确认新密码'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const hasKey = hasApiKey();

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: PasswordForm) => {
    setLoading(true);
    try {
      const res: any = await updatePassword({
        userId: user?.id || 0,
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      if (res.success) {
        toast.success('密码修改成功');
        form.reset();
      } else {
        toast.error('修改失败', { description: res.message });
      }
    } catch {
      toast.error('修改失败', { description: '网络错误，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    const key = apiKeyInput.trim();
    if (!key) {
      toast.error('请输入 API Key');
      return;
    }
    if (!key.startsWith('sk-')) {
      toast.error('API Key 格式不正确，应以 sk- 开头');
      return;
    }
    setApiKey(key);
    setApiKeyInput('');
    setShowApiKeyInput(false);
    toast.success('API Key 已保存');
  };

  const handleRemoveApiKey = () => {
    removeApiKey();
    setApiKeyInput('');
    setShowApiKeyInput(false);
    toast.success('API Key 已移除');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">个人信息</h2>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">用户名</label>
              <p className="mt-1">{user?.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">姓名</label>
              <p className="mt-1">{user?.realName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">角色</label>
              <p className="mt-1">
                <Badge variant={user?.role === '负责人' ? 'default' : 'secondary'}>
                  {user?.role}
                </Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">创建时间</label>
              <p className="mt-1">{user?.createTime || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md">
            <FieldGroup>
              <Controller
                name="oldPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel required>当前密码</FieldLabel>
                    <Input {...field} type="password" aria-invalid={fieldState.invalid} placeholder="请输入当前密码" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="newPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel required>新密码</FieldLabel>
                    <Input {...field} type="password" aria-invalid={fieldState.invalid} placeholder="请输入新密码" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel required>确认新密码</FieldLabel>
                    <Input {...field} type="password" aria-invalid={fieldState.invalid} placeholder="请再次输入新密码" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
            <Button type="submit" className="mt-4" disabled={loading}>
              {loading ? '修改中...' : '修改密码'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Key 配置</CardTitle>
        </CardHeader>
        <CardContent className="max-w-md space-y-4">
          {hasKey && !showApiKeyInput && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">当前状态</p>
                <p className="text-sm font-medium">
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                    已配置
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Key</p>
                <p className="font-mono text-sm">{maskApiKey(getApiKey())}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowApiKeyInput(true)}>
                  修改
                </Button>
                <Button variant="destructive" size="sm" onClick={handleRemoveApiKey}>
                  移除
                </Button>
              </div>
            </div>
          )}

          {(!hasKey || showApiKeyInput) && (
            <div className="space-y-3">
              <Field>
                <FieldLabel>{hasKey ? '输入新的 API Key' : 'DeepSeek API Key'}</FieldLabel>
                <Input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </Field>
              <div className="flex gap-2">
                <Button onClick={handleSaveApiKey}>
                  {hasKey ? '更新' : '保存'}
                </Button>
                {showApiKeyInput && (
                  <Button variant="outline" onClick={() => { setShowApiKeyInput(false); setApiKeyInput(''); }}>
                    取消
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
