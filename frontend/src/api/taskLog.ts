import request from './request';

export function getTaskLogs(taskId?: number) {
  return request.get('/task-logs', { params: taskId ? { taskId } : {} });
}

export function saveTaskLog(data: any) {
  return request.post('/task-logs', data);
}
