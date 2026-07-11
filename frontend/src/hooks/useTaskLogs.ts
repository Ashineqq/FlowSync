import { useQuery, useMutation } from '@tanstack/react-query';
import { getTaskLogs, saveTaskLog } from '@/api';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';

export const logKeys = {
  all: ['task-logs'] as const,
  byTask: (taskId?: number) => ['task-logs', 'task', taskId] as const,
};

export function useTaskLogs(taskId?: number) {
  return useQuery({
    queryKey: taskId ? logKeys.byTask(taskId) : logKeys.all,
    queryFn: () => getTaskLogs(taskId),
  });
}

export function useSaveTaskLog(onSuccess?: () => void) {
  return useMutation({
    mutationFn: saveTaskLog,
    onSuccess: () => {
      toast.success('创建成功');
      queryClient.invalidateQueries({ queryKey: logKeys.all });
      onSuccess?.();
    },
    onError: () => {
      toast.error('创建失败');
    },
  });
}
