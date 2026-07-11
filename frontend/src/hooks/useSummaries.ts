import { useQuery, useMutation } from '@tanstack/react-query';
import { getSummaries, saveSummary } from '@/api';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';

export const summaryKeys = {
  all: ['summaries'] as const,
};

export function useSummaries() {
  return useQuery({
    queryKey: summaryKeys.all,
    queryFn: getSummaries,
  });
}

export function useSaveSummary(onSuccess?: () => void) {
  return useMutation({
    mutationFn: saveSummary,
    onSuccess: () => {
      toast.success('创建成功');
      queryClient.invalidateQueries({ queryKey: summaryKeys.all });
      onSuccess?.();
    },
    onError: () => {
      toast.error('创建失败');
    },
  });
}
