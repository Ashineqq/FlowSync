import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { login as loginApi } from '@/api/auth';
import KineticGrid from '@/components/common/KineticGrid';
import TiltedCard from '@/components/ui/tiltedCard';
import FrontFace from './FrontFace';
import BackFace from './BackFace';
import type { LoginFormData } from './FrontFace';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema) as Resolver<LoginFormData>,
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
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

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const tag = target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'button' || tag === 'label' || tag === 'textarea' || tag === 'select') return;
    if (target.closest('input') || target.closest('button') || target.closest('label') || target.closest('select') || target.closest('textarea')) return;
    setFlipped((v) => !v);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <KineticGrid
        background="transparent"
        dotColor="var(--muted-foreground)"
        lineColor="var(--border)"
        trailColor="var(--primary)"
        spacing={30}
        radius={300}
        strength={4}
        trail={false}
      />

      <TiltedCard
        containerWidth="auto"
        containerHeight="auto"
        scaleOnHover={1.02}
        rotateAmplitude={8}
        tooltipText={flipped ? '点击空白区域返回登录' : '点击空白区域查看介绍'}
      >
        <motion.div
          className="[transform-style:preserve-3d] h-[460px]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          onClick={handleCardClick}
        >
          {/* 正面 — 登录 */}
          <div className="[backface-visibility:hidden] h-full">
            <FrontFace
              control={form.control}
              handleSubmit={form.handleSubmit}
              error={error}
              loading={loading}
              onSubmit={onSubmit}
            />
          </div>

          {/* 背面 — 介绍 */}
          <div className="absolute inset-0 [backface-visibility:hidden]"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <BackFace />
          </div>
        </motion.div>
      </TiltedCard>
    </div>
  );
}
