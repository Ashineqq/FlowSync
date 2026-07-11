# FlowSync 数据请求与状态管理架构

> 本文档记录项目从 `useState+useEffect` 手动管理数据，迁移到 TanStack Query（服务端状态）+ Jotai（客户端状态）分层架构的全部经验和踩坑记录。

---

## 一、整体分层架构

```
UI 组件
  → TanStack Query (useQuery / useMutation)    ← 服务端状态
      → api 层 (接口函数 + TS 返回类型)           ← 请求封装
          → axios request (拦截器)               ← HTTP 管道
  → Jotai (useAtom / atomWithStorage)           ← 客户端状态
```

### 核心分工

| 状态类型 | 工具 | 用途 |
|---------|------|------|
| **服务端状态** | TanStack Query | 接口数据、缓存、loading、error、重试、自动刷新 |
| **客户端状态** | Jotai | 登录用户、token、主题、UI 开关 |
| **HTTP 管道** | axios interceptors | 鉴权注入、统一错误处理、状态码处理 |

---

## 二、axios request 封装（`src/api/request.ts`）

### 2.1 请求拦截器

```ts
request.interceptors.request.use((config) => {
  const userStr = sessionStorage.getItem('currentUser');
  if (userStr) {
    const user = JSON.parse(userStr);
    // 通过 params 挂载 currentUserId，保持后端现有传参方式
    config.params = { ...config.params, currentUserId: user.id };
  }
  return config;
});
```

**注意**：不通过 Authorization header 传 token/userId，统一用 params 方式，与后端现有约定保持一致。

### 2.2 响应拦截器

```ts
request.interceptors.response.use(
  (response) => {
    const body = response.data;
    // 后端统一结构 { success, code, message, data }
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success === false) {
        toast.error(body.message || '请求失败');
        return Promise.reject(new Error(body.message));
      }
      return body.data;  // ← 直接返回业务数据，去掉 { success, data } 包装
    }
    return body;
  },
  (error) => {
    const status = error.response?.status;
    switch (status) {
      case 401: toast.error('登录已过期，请重新登录');
               sessionStorage.removeItem('currentUser');
               window.location.href = '/login'; break;
      case 403: toast.error('无权限访问'); break;
      case 404: toast.error('资源不存在'); break;
      case 500: toast.error('服务器异常'); break;
      default:  toast.error('网络异常'); break;
    }
    return Promise.reject(error);
  }
);
```

### 2.3 🕳️ 踩坑：旧代码还在用 `res.success` 解包

**现象**：重构后某些页面（如 TaskBreakdown）项目列表为空、操作失败。

**原因**：拦截器已经解开 `{ success, data }` 包装，直接返回 `body.data`。但旧代码仍保留：
```ts
// ❌ 旧模式（已失效）
const res: any = await getProjects();
if (res.success) setProjects(res.data);

// ✅ 新模式（直接使用）
const data = await getProjects();
setProjects(data);
```

**解决**：所有 API 调用方的 `res.success` / `res.data` 解包代码必须移除。拦截器报错会自动触发 toast，业务层只需关注数据本身。

---

## 三、API 层（`src/api/index.ts`）

### 3.1 文件结构

```
src/api/
├── request.ts    ← axios 实例 + 拦截器
├── index.ts      ← 所有普通接口函数（auth / users / projects / tasks / logs / summaries / overview / AI）
└── stream.ts     ← SSE 流式请求（直接 fetch，不经过 axios）
```

### 3.2 规范

```ts
// 每个接口函数必须标注泛型返回类型
export function getProjects(): Promise<Project[]> {
  return request.get('/projects');
}

export function saveProject(data: Partial<Project>): Promise<Project> {
  return request.post('/projects', data);
}
```

- 返回类型 `Promise<T>` 中的 `T` 是**解包后的业务数据类型**（拦截器已去掉 `{ success, data }` 包装）
- API 层只做请求封装，不写业务逻辑、不管缓存

### 3.3 🕳️ 踩坑：SSE 流式请求不能用 axios

```ts
// ❌ axios 不支持 SSE 流式读取
const response = await request.post('/stream', data);  // 不行

// ✅ 使用原生 fetch + ReadableStream
export async function streamTaskPlan(...) {
  const response = await fetch(url, { method: 'POST', headers, body });
  const reader = response.body?.getReader();
  // ... 逐行解析 SSE
}
```

**解决**：SSE 流式请求拆到独立 `stream.ts`，使用 `fetch` + `ReadableStream`。这样 `index.ts` 也不依赖 `getApiKey`，职责更干净。

---

## 四、Jotai 客户端状态（`src/store/atoms.ts`）

### 4.1 Atom 定义

```ts
import { atomWithStorage } from 'jotai/utils';

// 用户信息 — 持久化到 sessionStorage（与 axios 拦截器读取源一致）
export const userAtom = atomWithStorage<User | null>('currentUser', null, {
  getItem: (key) => { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) : null; },
  setItem: (key, value) => { if (value) sessionStorage.setItem(key, JSON.stringify(value)); else sessionStorage.removeItem(key); },
  removeItem: (key) => sessionStorage.removeItem(key),
});

// 派生状态（纯计算，不存储）
export const isLoggedInAtom = atom((get) => get(userAtom) !== null);
export const isLeaderAtom = atom((get) => get(userAtom)?.role === '负责人');

// 主题 — 持久化到 localStorage
export const themeAtom = atomWithStorage<Theme>('flowsync-theme', 'light', ...);
```

### 4.2 使用原则

- `atomWithStorage` — 需要持久化的状态（user、theme、token）
- `atom((get) => ...)` — 派生状态（`isLoggedIn`、`isLeader`）
- 只读场景用 `useAtomValue`，只写场景用 `useSetAtom`，减少不必要重渲染
- 读写都要用 `useAtom`

### 4.3 🕳️ 踩坑：atomWithStorage 的 storage 对象必须提供 getItem/setItem/removeItem

```ts
// ❌ 直接传入 storage 对象不完整
export const userAtom = atomWithStorage('currentUser', null);

// ✅ 显式提供 getItem/setItem/removeItem
export const userAtom = atomWithStorage<User | null>('currentUser', null, {
  getItem: (key) => { ... },
  setItem: (key, value) => { ... },
  removeItem: (key) => { ... },
});
```

### 4.4 从 Context 迁移到 Jotai

| 旧模式 | 新模式 |
|--------|--------|
| `AuthProvider` + `useContext` | Jotai `atomWithStorage` + `useAtom` |
| `ThemeProvider` + `useContext` | Jotai `atomWithStorage` + `useAtom` |
| `useAuth()` 读 Context | `useAuth()` 读 Jotai atom |
| `getAuthUser()` 读 sessionStorage | 保持不变（router loader 仍需要） |

---

## 五、为什么选择 TanStack Query（对比手动管理）

### 5.1 传统 `useState + useEffect` 模式的问题

```tsx
// ❌ 旧模式：每个组件都要自己管
const [data, setData] = useState<Project[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  setLoading(true);
  fetchProjects()
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

**痛点**：
- 每个组件重复写 loading / error / data 三板斧
- 离开页面重新挂载时重复请求（无缓存）
- 两个组件需要同一数据时各自请求（无去重）
- 写操作后需要手动刷新列表（手动调用 loadData）
- 失败重试、窗口聚焦刷新等需求需要自己实现

### 5.2 TanStack Query 解决的核心问题

| 能力 | 手动管理 | TanStack Query |
|------|---------|---------------|
| **缓存管理** | 无，每次重新请求 | 自动缓存，`staleTime` 内不重复请求 |
| **请求去重** | 无，两个组件各发一次 | 自动，相同 `queryKey` 合并为一次请求 |
| **loading / error 状态** | 每个组件自己声明 | `data` / `isLoading` / `isError` 自动提供 |
| **后台刷新** | 自己实现 `setInterval` | `refetchInterval` 或 stale 时自动刷新 |
| **失败重试** | 自己写 retry 逻辑 | `retry: 1` 一行配置 |
| **窗口聚焦刷新** | 自己监听 `visibilitychange` | `refetchOnWindowFocus` 一行开关 |
| **写后刷新** | 手动调用 `loadData()` | `invalidateQueries` 自动触发 |
| **乐观更新** | 极复杂 | `onMutate` 一行回滚逻辑 |
| **分页/无限滚动** | 自己维护 page 状态 | `useInfiniteQuery` 内置 |

### 5.3 实际效果对比（以 ProjectList 为例）

**重构前**（旧模式）：
```tsx
// ProjectList.tsx — 约 30 行状态管理代码
const [projects, setProjects] = useState<Project[]>([]);
const [loading, setLoading] = useState(true);
const [dialogOpen, setDialogOpen] = useState(false);
// ... loadProjects / onSubmit / handleDelete 都要手动 setState + toast
```

**重构后**（TanStack Query）：
```tsx
// ProjectList.tsx — 0 行状态声明
const { data: projects = [], isLoading } = useProjects();
const saveMutation = useSaveProject(() => {
  setDialogOpen(false);
  setEditingProject(null);
  form.reset();
});
// 写操作后 invalidateQueries 自动刷新列表
```

减少了：
- `useState` + `useEffect` 手写数据请求 → **0 行**
- loading / error 状态管理 → **0 行**
- 手动调用 `loadData()` 刷新 → **0 行**
- 手动 `try/catch` + toast → **0 行**（interceptor 统一处理）

---

## 六、TanStack Query 服务端状态

### 6.1 QueryClient 单例

```ts
// src/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 分钟内数据视为新鲜
      gcTime: 10 * 60 * 1000,          // 缓存保留 10 分钟
      retry: 1,                         // 失败重试 1 次
      refetchOnWindowFocus: false,      // 切换窗口不自动刷新
    },
  },
});
```

**全局唯一实例**，在 `main.tsx` 注入到 `QueryClientProvider`，同时在 hooks 中直接 `import { queryClient }` 使用，无需再调用 `useQueryClient()`。

### 6.2 Hook 模式

```ts
// 查询 — useQuery
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });
  // 组件中直接使用 data / isLoading / isError
}

// 修改 — useMutation + invalidateQueries
export function useSaveProject(onSuccess?: () => void) {
  return useMutation({
    mutationFn: saveProject,
    onSuccess: () => {
      toast.success('保存成功');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onSuccess?.();
    },
  });
}
```

### 6.3 queryKey 规范

| 实体 | queryKey | 说明 |
|------|----------|------|
| 项目列表 | `['projects']` | 全量失效 |
| 任务列表 | `['tasks']` | 全量失效 |
| 按项目筛选任务 | `['tasks', 'project', projectId]` | 可精准失效 |
| 用户列表 | `['users']` | 全量失效 |
| 进度列表 | `['task-logs']` | 全量失效 |
| 按任务筛选进度 | `['task-logs', 'task', taskId]` | 可精准失效 |
| 总结列表 | `['summaries']` | 全量失效 |
| 总览统计 | `['overview']` | 单条 |

### 6.4 数据流

```
登录 → useAuth().login 存 Jotai(sessionStorage)
  → 后续请求 axios 拦截器自动从 sessionStorage 读 user.id 挂 params.currentUserId
  → 页面 useQuery 拉取数据，自动缓存
  → useMutation 提交后 invalidateQueries 自动刷新列表
  → 401 拦截器清用户跳登录
```

---

## 七、从 Context 到 Jotai 迁移总结

### 7.1 移除了哪些 Provider

| 旧 Provider | 删除原因 | 替代方式 |
|-------------|----------|----------|
| `<AuthProvider>` | 状态移至 Jotai atom | `useAuth()` 直接读 `userAtom` |
| `<ThemeProvider>` | 状态移至 Jotai atom | `useTheme()` 直接读 `themeAtom` |

### 7.2 main.tsx 最终结构

```tsx
<StrictMode>
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
</StrictMode>
```

---

## 八、文件索引

| 文件 | 内容 |
|------|------|
| `src/api/request.ts` | axios 实例、请求拦截器（注入 currentUserId）、响应拦截器（解包 + toast 错误处理） |
| `src/api/index.ts` | 所有普通接口函数，标注 TS 返回类型 |
| `src/api/stream.ts` | SSE 流式请求（fetch + ReadableStream） |
| `src/lib/queryClient.ts` | TanStack Query 单例，配置 staleTime / gcTime / retry |
| `src/store/atoms.ts` | Jotai atoms：userAtom、tokenAtom、themeAtom、派生状态 |
| `src/hooks/useAuth.tsx` | 基于 Jotai 的认证 hook + 保留 getAuthUser() 给 loader |
| `src/hooks/useTheme.tsx` | 基于 Jotai 的主题 hook |
| `src/hooks/useProjects.ts` | useQuery + useMutation + invalidateQueries |
| `src/hooks/useTasks.ts` | 同上 |
| `src/hooks/useUsers.ts` | 同上 |
| `src/hooks/useTaskLogs.ts` | 同上 |
| `src/hooks/useSummaries.ts` | 同上 |
| `src/hooks/useOverview.ts` | useQuery 只读 |
| `src/main.tsx` | 仅 QueryClientProvider，无 AuthProvider / ThemeProvider |
