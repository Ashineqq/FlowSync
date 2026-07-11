import { useQuery, useMutation } from '@tanstack/react-query';
import { getUsers, createUser, updateUser } from '@/api';
import { queryClient } from '@/lib/queryClient';
import type { User } from '@/types';
import { toast } from 'sonner';

export const userKeys = {
  all: ['users'] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: getUsers,
  });
}

export function useCreateUser(onSuccess?: () => void) {
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('创建成功');
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      onSuccess?.();
    },
    onError: () => {
      toast.error('创建失败');
    },
  });
}

export function useUpdateUser(onSuccess?: () => void) {
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: Partial<User> }) => updateUser(userId, data),
    onSuccess: () => {
      toast.success('更新成功');
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      onSuccess?.();
    },
    onError: () => {
      toast.error('更新失败');
    },
  });
}
