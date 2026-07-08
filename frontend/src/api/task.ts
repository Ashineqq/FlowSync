import request from './request';

export function getTasks(projectId?: number) {
  return request.get('/tasks', { params: projectId ? { projectId } : {} });
}

export function saveTask(data: any) {
  return request.post('/tasks', data);
}

export function deleteTask(id: number) {
  return request.delete(`/tasks/${id}`);
}
