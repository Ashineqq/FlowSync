import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { login as loginApi } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { motion } from 'framer-motion';
import { useMouseGlow, AmbientGlow, GridOverlay } from './animations';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { containerRef, outerGlow, innerGlow, borderGlow, handleMouseMove } = useMouseGlow();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setLoading(true);
    try {
      const res: any = await loginApi(data.username, data.password);
      if (res.success && res.data) {
        login(res.data.user, res.data.token);
        navigate('/overview');
      } else {
        setError(res.message || '登录失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center justify-center bg-[#fafafa] overflow-hidden"
    >
      {/* Glow layers */}
      <AmbientGlow glow={outerGlow} />
      <AmbientGlow glow={innerGlow} />
      <GridOverlay />

      {/* Login card */}
      <div className="relative">
        {/* Card border glow — padding:1px exposes the gradient as a visible border */}
        <motion.div
          className="relative w-[460px] rounded-2xl"
          style={{ backgroundImage: borderGlow, padding: '1px' }}
        >
          <Card
            className="w-full border-0 rounded-2xl bg-white/95 backdrop-blur-xl"
            style={{
              boxShadow:
                '0 0 0 1px oklch(0 0 0 / 0.04), 0 4px 16px oklch(0 0 0 / 0.06), 0 12px 48px oklch(0 0 0 / 0.08), 0 24px 64px oklch(0 0 0 / 0.06)',
            }}
          >
            <CardHeader className="pb-4 pt-8">
              <CardTitle className="text-2xl text-center font-light tracking-wider text-[oklch(0.2 0 0)]">
                FlowSync
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-2">
              <form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup className="gap-5">
                  <Controller
                    name="username"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="login-username" required>工号</FieldLabel>
                        <Input
                          {...field}
                          id="login-username"
                          aria-invalid={fieldState.invalid}
                          placeholder="请输入用户名"
                          className="h-10"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="login-password" required>密码</FieldLabel>
                        <Input
                          {...field}
                          id="login-password"
                          type="password"
                          aria-invalid={fieldState.invalid}
                          placeholder="请输入密码"
                          className="h-10"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </FieldGroup>
                {error && <p className="text-sm text-destructive mt-3">{error}</p>}
              </form>
            </CardContent>
            <div className="px-8 pb-8 pt-2">
              <Button
                type="submit"
                form="login-form"
                className="w-full h-10 transition-all duration-300 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? '登录中...' : '登 录'}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
