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

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
