import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const userStr = sessionStorage.getItem('currentUser');
  if (userStr) {
    const user = JSON.parse(userStr);
    config.params = { ...config.params, currentUserId: user.id };
  }
  return config;
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

export default request;
