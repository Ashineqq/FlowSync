import { useQuery, useMutation } from '@tanstack/react-query';
import { getTasks, saveTask, deleteTask } from '@/api';
import { queryClient } from '@/lib/queryClient';
import type { Task } from '@/types';
import { toast } from 'sonner';

export const taskKeys = {
  all: ['tasks'] as const,
  byProject: (projectId?: number) => ['tasks', 'project', projectId] as const,
};

export function useTasks(projectId?: number) {
  return useQuery({
    queryKey: projectId ? taskKeys.byProject(projectId) : taskKeys.all,
    queryFn: () => getTasks(projectId),
  });
}

export function useSaveTask(onSuccess?: () => void) {
  return useMutation({
    mutationFn: saveTask,
    onSuccess: () => {
      toast.success('保存成功');
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      onSuccess?.();
    },
    onError: () => {
      toast.error('保存失败');
    },
  });
}

export function useDeleteTask(onSuccess?: () => void) {
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      toast.success('删除成功');
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      onSuccess?.();
    },
    onError: () => {
      toast.error('删除失败');
    },
  });
}
