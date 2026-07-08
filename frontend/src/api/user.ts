import request from './request';

export function getUsers() {
  return request.get('/users');
}

export function createUser(data: { username: string; realName: string; role: string; password?: string }) {
  return request.post('/users', data);
}

export function updateUser(userId: number, data: { realName?: string; role?: string; password?: string }) {
  return request.put(`/users/${userId}`, data);
}

export function updatePassword(data: { userId: number; oldPassword: string; newPassword: string }) {
  return request.post('/users/update-password', data);
}
