const STORAGE_KEY = 'deepseek_api_key';

export function getApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
}

export function removeApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasApiKey(): boolean {
  const key = getApiKey();
  return key.length > 0;
}

/** Show only the last 4 chars, mask the rest */
export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••' + key.slice(-4);
  return '••••••••' + key.slice(-4);
}
