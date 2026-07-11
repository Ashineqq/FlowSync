import { getApiKey } from '@/lib/api-key';

/** SSE 流式请求（不使用 axios，直接 fetch） */
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
  if (apiKey) {
    headers['x-deepseek-api-key'] = apiKey;
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
        } catch {
          // ignore parse errors
        }
      }
    }
  }
}
