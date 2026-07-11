import request from './request';
import type { User, Project, Task, TaskLog, TaskSummary, OverviewStats, AiTaskPlanResponse } from '@/types';

// ── Auth ──

interface LoginResponse {
  user: User;
  token: string;
}

export function login(username: string, password: string): Promise<LoginResponse> {
  return request.post('/auth/login', { username, password });
}

// ── Users ──

export function getUsers(): Promise<User[]> {
  return request.get('/users');
}

export function createUser(data: { username: string; realName: string; role: string; password?: string }): Promise<User> {
  return request.post('/users', data);
}

export function updateUser(userId: number, data: { realName?: string; role?: string; password?: string }): Promise<User> {
  return request.put(`/users/${userId}`, data);
}

export function updatePassword(data: { userId: number; oldPassword: string; newPassword: string }): Promise<void> {
  return request.post('/users/update-password', data);
}

// ── Projects ──

export function getProjects(): Promise<Project[]> {
  return request.get('/projects');
}

export function saveProject(data: Partial<Project>): Promise<Project> {
  return request.post('/projects', data);
}

export function deleteProject(id: number): Promise<void> {
  return request.delete(`/projects/${id}`);
}

// ── Tasks ──

export function getTasks(projectId?: number): Promise<Task[]> {
  return request.get('/tasks', { params: projectId ? { projectId } : {} });
}

export function saveTask(data: Partial<Task>): Promise<Task> {
  return request.post('/tasks', data);
}

export function deleteTask(id: number): Promise<void> {
  return request.delete(`/tasks/${id}`);
}

// ── Task Logs ──

export function getTaskLogs(taskId?: number): Promise<TaskLog[]> {
  return request.get('/task-logs', { params: taskId ? { taskId } : {} });
}

export function saveTaskLog(data: Partial<TaskLog>): Promise<TaskLog> {
  return request.post('/task-logs', data);
}

// ── Summaries ──

export function getSummaries(): Promise<TaskSummary[]> {
  return request.get('/summaries');
}

export function saveSummary(data: Partial<TaskSummary>): Promise<TaskSummary> {
  return request.post('/summaries', data);
}

// ── Overview ──

export function getOverview(): Promise<OverviewStats> {
  return request.get('/overview');
}

// ── AI ──

export function getTaskSuggestion(data: {
  projectName: string;
  taskTitle: string;
  taskDescription: string;
}): Promise<string> {
  return request.post('/ai/task-suggestion', data);
}

export function getTaskPlan(data: {
  projectId: number;
  operatorId: number;
  projectName: string;
  goal: string;
  description: string;
}): Promise<AiTaskPlanResponse> {
  return request.post('/ai/task-plan', data);
}

export function importTaskPlan(data: {
  projectId: number;
  creatorId: number;
  items: any[];
}): Promise<void> {
  return request.post('/ai/task-plan/import', data);
}
