import axios from 'axios';
import { toast } from 'sonner';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

/** 请求拦截器：自动注入 currentUserId */
request.interceptors.request.use((config) => {
  const userStr = sessionStorage.getItem('currentUser');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      config.params = { ...config.params, currentUserId: user.id };
    } catch {
      // ignore parse error
    }
  }
  return config;
});

/** 响应拦截器：统一处理业务错误 + HTTP 状态码 */
request.interceptors.response.use(
  (response) => {
    const body = response.data;

    // 后端统一结构 { success, code, message, data }
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success === false) {
        toast.error(body.message || '请求失败');
        return Promise.reject(new Error(body.message || '请求失败'));
      }
      return body.data;
    }

    // 非标准结构，直接返回
    return body;
  },
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const status = error.response?.status;

    switch (status) {
      case 401:
        toast.error('登录已过期，请重新登录');
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
        break;
      case 403:
        toast.error('无权限访问');
        break;
      case 404:
        toast.error('资源不存在');
        break;
      case 500:
        toast.error('服务器异常，请稍后重试');
        break;
      default:
        toast.error('网络异常，请检查网络连接');
        break;
    }

    return Promise.reject(error);
  }
);

export default request;
