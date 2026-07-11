import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 分钟内数据视为新鲜
      gcTime: 10 * 60 * 1000,          // 缓存保留 10 分钟
      retry: 1,                         // 失败重试 1 次
      refetchOnWindowFocus: true,      // 切换窗口不自动刷新
    },
  },
});