import request from './request';

export function getProjects() {
  return request.get('/projects');
}

export function saveProject(data: any) {
  return request.post('/projects', data);
}

export function deleteProject(id: number) {
  return request.delete(`/projects/${id}`);
}
