import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import type { Control, UseFormHandleSubmit } from 'react-hook-form';

export interface LoginFormData {
  username: string;
  password: string;
}

interface FrontFaceProps {
  control: Control<LoginFormData>;
  handleSubmit: UseFormHandleSubmit<LoginFormData>;
  error: string;
  loading: boolean;
  onSubmit: (data: LoginFormData) => Promise<void>;
}

export default function FrontFace({ control, handleSubmit, error, loading, onSubmit }: FrontFaceProps) {
  return (
    <Card
      className="w-[460px] h-full border border-border/40 rounded-2xl bg-card/95 backdrop-blur-xl shadow-xl"
    >
      <CardHeader className="pb-4 pt-8">
        <CardTitle className="text-2xl text-center font-light tracking-wider text-card-foreground">
          FlowSync
        </CardTitle>
      </CardHeader>
      <CardContent className="px-8 pb-2">
        <form id="login-form" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-5">
            <Controller
              name="username"
              control={control}
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
              control={control}
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
      <div className="px-8 pb-4 pt-2">
        <Button
          type="submit"
          form="login-form"
          className="w-full h-10 transition-all duration-300 active:scale-[0.98]"
          disabled={loading}
        >
          {loading ? '登录中...' : '登 录'}
        </Button>

        <Separator className="my-3" />

        <p className="text-xs text-center text-muted-foreground/60">
          点击空白区域查看介绍
        </p>
      </div>
    </Card>
  );
}
