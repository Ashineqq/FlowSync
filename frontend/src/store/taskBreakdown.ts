import { getApiKey } from '@/lib/api-key';

type Listener = () => void;
type StreamStatus = 'idle' | 'streaming' | 'done' | 'error';

interface StreamState {
  status: StreamStatus;
  projectId: string;
  thinkingText: string;
  contentText: string;
  summary: string;
  planItems: any[];
  selectedItems: number[];
  error: string;
}

let state: StreamState = {
  status: 'idle',
  projectId: '',
  thinkingText: '',
  contentText: '',
  summary: '',
  planItems: [],
  selectedItems: [],
  error: '',
};

let listeners: Set<Listener> = new Set();
let abortController: AbortController | null = null;

function notify() {
  listeners.forEach((fn) => fn());
}

function setState(partial: Partial<StreamState>) {
  state = { ...state, ...partial };
  notify();
}

export function getState(): StreamState {
  return state;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetState() {
  abortController?.abort();
  abortController = null;
  state = {
    status: 'idle',
    projectId: '',
    thinkingText: '',
    contentText: '',
    summary: '',
    planItems: [],
    selectedItems: [],
    error: '',
  };
  notify();
}

export async function startStream(projectId: string, data: { projectName: string; goal: string; description: string }) {
  abortController?.abort();
  abortController = new AbortController();

  setState({
    status: 'streaming',
    projectId,
    thinkingText: '',
    contentText: '',
    summary: '',
    planItems: [],
    selectedItems: [],
    error: '',
  });

  const userStr = sessionStorage.getItem('currentUser');
  const userId = userStr ? JSON.parse(userStr).id : '';
  const url = `/api/ai/task-plan/stream?currentUserId=${userId}`;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = getApiKey();
    if (apiKey) {
      headers['x-deepseek-api-key'] = apiKey;
    }
    console.log('[Store] API Key header:', apiKey ? `已添加 (长度 ${apiKey.length})` : '未配置');

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal: abortController.signal,
    });

    if (!response.ok) {
      setState({ status: 'error', error: '请求失败' });
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      setState({ status: 'error', error: '无法读取响应流' });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let thinkingAcc = '';
    let contentAcc = '';

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
              thinkingAcc += msg.content;
              setState({ thinkingText: thinkingAcc });
            } else if (msg.type === 'chunk') {
              contentAcc += msg.content;
              setState({ contentText: contentAcc });
            } else if (msg.type === 'done') {
              const items = msg.content?.items || [];
              setState({
                status: 'done',
                summary: msg.content?.summary || '',
                planItems: items,
                selectedItems: items.map((_: any, i: number) => i),
                contentText: '',
              });
            } else if (msg.type === 'error') {
              setState({ status: 'error', error: msg.content });
            }
          } catch {}
        }
      }
    }
  } catch (e: any) {
    if (e.name !== 'AbortError') {
      setState({ status: 'error', error: e.message || '流式请求失败' });
    }
  }
}

export function setPlanItems(items: any[]) {
  setState({ planItems: items });
}

export function setSelectedItems(items: number[]) {
  setState({ selectedItems: items });
}
