export interface User {
  id: number;
  username: string;
  realName: string;
  role: string;
  createTime?: string;
}

/** 后端统一响应结构 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  code?: number;
  message?: string;
  data: T;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  priority: string;
  ownerId: number;
  ownerName?: string;
  startDate?: string;
  endDate?: string;
  createTime?: string;
}

export interface Task {
  id: number;
  projectId: number;
  parentId?: number;
  title: string;
  description?: string;
  assigneeId?: number;
  assigneeName?: string;
  creatorId: number;
  creatorName?: string;
  status: string;
  priority: string;
  dueDate?: string;
  aiSuggestion?: string;
  createTime?: string;
}

export interface TaskLog {
  id: number;
  taskId: number;
  taskTitle?: string;
  progressPercent: number;
  content: string;
  operatorId: number;
  operatorName?: string;
  createTime?: string;
}

export interface TaskSummary {
  id: number;
  projectId: number;
  projectName?: string;
  taskId?: number;
  taskTitle?: string;
  summaryType: string;
  content: string;
  createdBy: number;
  creatorName?: string;
  createTime?: string;
}

export interface OverviewStats {
  userCount: number;
  projectCount: number;
  taskCount: number;
  logCount: number;
  summaryCount: number;
}

export interface AiTaskPlanItem {
  title: string;
  description: string;
  priority: string;
  suggestedDays: number;
  assigneeId: number;
}

export interface AiTaskPlanResponse {
  summary: string;
  items: AiTaskPlanItem[];
}
