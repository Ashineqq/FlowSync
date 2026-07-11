import { useQuery, useMutation } from '@tanstack/react-query';
import { getProjects, saveProject, deleteProject } from '@/api';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';

export const projectKeys = {
  all: ['projects'] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: getProjects,
  });
}

export function useSaveProject(onSuccess?: () => void) {
  return useMutation({
    mutationFn: saveProject,
    onSuccess: () => {
      toast.success('保存成功');
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      onSuccess?.();
    },
    onError: () => {
      toast.error('保存失败');
    },
  });
}

export function useDeleteProject(onSuccess?: () => void) {
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      toast.success('删除成功');
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      onSuccess?.();
    },
    onError: () => {
      toast.error('删除失败');
    },
  });
}
