import request from './request';

export function getOverview() {
  return request.get('/overview');
}
