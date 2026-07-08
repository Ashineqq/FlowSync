import request from './request';

export function getSummaries() {
  return request.get('/summaries');
}

export function saveSummary(data: any) {
  return request.post('/summaries', data);
}
