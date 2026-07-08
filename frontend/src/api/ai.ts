import { getApiKey } from '@/lib/api-key';
import request from './request';

export function getTaskSuggestion(data: {
  projectName: string;
  taskTitle: string;
  taskDescription: string;
}) {
  return request.post('/ai/task-suggestion', data);
}

export function getTaskPlan(data: {
  projectId: number;
  operatorId: number;
  projectName: string;
  goal: string;
  description: string;
}) {
  return request.post('/ai/task-plan', data);
}

export function importTaskPlan(data: {
  projectId: number;
  creatorId: number;
  items: any[];
}) {
  return request.post('/ai/task-plan/import', data);
}

export async function streamTaskPlan(
  data: { projectName: string; goal: string; description: string },
  onThinking: (text: string) => void,
  onChunk: (text: string) => void,
  onDone: (result: any) => void,
  onError: (error: string) => void
) {
  const userStr = sessionStorage.getItem('currentUser');
  const userId = userStr ? JSON.parse(userStr).id : '';
  const url = `/api/ai/task-plan/stream?currentUserId=${userId}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = getApiKey();
  const hasKey = !!apiKey;
  console.log('[AI Stream] 前端 API Key:', hasKey ? `已找到 (长度 ${apiKey.length})` : '未配置 (localStorage 中无 key)');
  if (hasKey) {
    headers['x-deepseek-api-key'] = apiKey;
    console.log('[AI Stream] 已添加 x-deepseek-api-key 请求头');
  } else {
    console.log('[AI Stream] 未发送 API Key 请求头，依赖后端环境变量');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    onError('请求失败');
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError('无法读取响应流');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') return;
        try {
          const msg = JSON.parse(payload);
          if (msg.type === 'thinking') {
            onThinking(msg.content);
          } else if (msg.type === 'chunk') {
            onChunk(msg.content);
          } else if (msg.type === 'done') {
            onDone(msg.content);
          } else if (msg.type === 'error') {
            onError(msg.content);
          }
        } catch {}
      }
    }
  }
}
