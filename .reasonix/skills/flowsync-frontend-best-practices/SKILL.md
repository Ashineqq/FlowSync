---
name: flowsync-frontend-best-practices
description: 通用前端开发最佳实践 — Tailwind样式/路由架构/数据状态管理/TypeScript规范的完整指南与常见陷阱
---

# 前端开发最佳实践（通用版）

适用于 React + Vite + TypeScript + Tailwind CSS 技术栈的前端项目。
调用该 skill 时，自动审计并修复不符合以下规范的模式。

## 一、样式分层规范（Tailwind CSS）

### 1.1 Tailwind 任意值语法区分

有两种写法，根据属性是否有对应 Tailwind utility 来区分：

```
属性有对应 utility → {utility}-[value]   ✅ 优先使用
属性无对应 utility → [property:value]    ✅ 降级使用
```

**判定表：**

| CSS 属性 | 对应 utility | 正确写法 |
|----------|-------------|---------|
| `height` | `h-*` | `h-[460px]` |
| `width` | `w-*` | `w-[200px]` |
| `margin` | `m-*` / `mt-*` / `mb-*` 等 | `m-[12px]` |
| `padding` | `p-*` / `pt-*` / `pb-*` 等 | `p-[8px]` |
| `color` | `text-*` | `text-[#333]` |
| `background-color` | `bg-*` | `bg-[#ff0]` |
| `font-size` | `text-*` | `text-[15px]` |
| `gap` | `gap-*` | `gap-[18px]` |
| `transform` | 无 | `[transform:rotateY(180deg)]` |
| `backface-visibility` | 无 | `[backface-visibility:hidden]` |
| `perspective` | 无 | `[perspective:800px]` |
| `transform-style` | 无 | `[transform-style:preserve-3d]` |
| `rotate` (CSS 独立属性) | 无 | `[rotateY:180deg]` |
| 自定义属性 `--xxx` | 无 | `[--my-var:12px]` |

### 1.2 cn() 使用规则

所有带条件、动态切换的 className 必须使用 `cn()`（`clsx` + `tailwind-merge` 封装）。

```tsx
// ❌ 模板字符串拼接
<div className={`base ${cls}`}>

// ✅ 使用 cn()
<div className={cn('base', cls)}>

// ❌ 三元表达式直接生成
<div className={isActive ? 'bg-primary' : 'bg-muted'}>

// ✅ 使用 cn() 对象格式
<div className={cn('base', { 'bg-primary': isActive, 'bg-muted': !isActive })}>
```

### 1.3 framer-motion 的 CSS transform 陷阱

当使用 framer-motion 的 `animate` / `style` 控制 `rotate` / `scale` / `translate` 时，**必须注意 CSS 两套 transform 体系不互通**：

| 体系 | 书写方式 | 用途 |
|------|---------|------|
| 传统 `transform` 属性 | `transform: rotateY(180deg)` | **framer-motion 使用这套** |
| 现代独立属性 | `rotateY: 180deg` | 不与 framer-motion 叠加 |

**规则**：使用 framer-motion 的组件中，同元素或子元素的变换必须使用 `[transform:rotateY(Xdeg)]`，不得使用 `[rotateY:Xdeg]`（现代独立属性）。

```tsx
// ❌ 现代独立属性，不与 framer-motion 叠加
<div className="[rotateY:180deg]">

// ✅ 传统 transform，与 framer-motion 同体系
<div className="[transform:rotateY(180deg)]">
```

### 1.4 inline style 保留与迁移速查

```
值类型                             处理方式
──────────────────────────────────────────────
framer-motion MotionValue    → 必须保留 inline style
动态 string props ("auto")   → 必须保留 inline style
动态百分比 (${percent}%)      → 必须保留 inline style
纯静态数字 (`height: 460`)    → 迁移到 className（h-[460px]）
纯静态字符串 (`color: red`)   → 迁移到 className（text-red-500）
```

### 1.5 高频复用样式抽离

同一套复合样式出现 3 次及以上，抽离到 `.module.css` 文件中：

```css
/* flip-card.module.css */
@layer components {
  .card-flip-back {
    @apply absolute inset-0 [backface-visibility:hidden];
  }
  .card-flip-container {
    @apply [transform-style:preserve-3d];
  }
}
```

### 1.6 禁止行为
- ✅ 所有静态 className 直接写字符串
- ✅ 动态 className 统一走 `cn()`
- ❌ 不在 className 内堆砌 3 个及以上原生 `[属性:值]`
- ❌ 不手动拼接 className 字符串
- ❌ 不新建全局普通 CSS 文件（只能有唯一的全局入口）

---

## 二、路由架构规范（React Router v6.4+）

### 2.1 使用 Data Router（createBrowserRouter）

```tsx
// ✅ 路由表在模块作用域静态定义，每次渲染不重建
const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <Layout />,
    loader: authLoader,
    children: [
      { path: 'projects', element: <ProjectList /> },
    ],
  },
  { path: '*', loader: async () => redirect('/overview') },
]);

function App() {
  return <RouterProvider router={router} />;
}
```

### 2.2 使用 `<Outlet />` 而非 `{children}`

```tsx
// ✅ 推荐：Layout 用 <Outlet />
function Layout() {
  return (
    <div>
      <Sidebar />
      <main><Outlet /></main>
    </div>
  );
}

// ❌ 不推荐：Layout 用 {children} 包裹
function Layout({ children }) {
  return <div><Sidebar /><main>{children}</main></div>;
}
```

### 2.3 Loader 鉴权模式

```tsx
// loader 在 React 组件树外运行，不能使用 hooks
function authLoader() {
  const user = getAuthUser(); // 直接从 sessionStorage/localStorage 读
  if (!user) return redirect('/login');
  return null; // 放行
}
```

### 2.4 登出后跳转

```tsx
// 使用 createBrowserRouter 时，loader 只在导航时触发
// 登出后必须手动跳转，因为 router 不会自动响应状态变化
const handleLogout = () => {
  logout();                                // 清除登录态
  navigate('/login', { replace: true });  // 手动跳转 + 替换历史
};
```

---

## 三、数据请求与状态管理

### 3.1 整体分层

```
UI 组件 → TanStack Query（服务端状态）→ api 层（接口函数 + 类型）→ axios（拦截器）
Jotai / Zustand（客户端状态）→ 登录态 / token / 主题 / UI 开关
```

**核心分工**：
- **TanStack Query** — 只管服务端数据（缓存、loading、error、重试、自动刷新）
- **Jotai / Zustand** — 只管客户端状态（用户、token、主题、UI 开关）
- **axios interceptors** — 只做管道（鉴权注入、统一错误处理、状态码处理）
- **api 层** — 封装接口函数并标注 TS 返回类型

### 3.2 axios 拦截器模板

```ts
// api/request.ts
import axios from 'axios';
import { toast } from 'sonner';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 请求拦截器：注入鉴权参数
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一解包 + 错误处理
request.interceptors.response.use(
  (response) => {
    const body = response.data;
    // 如果后端返回 { success, data } 结构，自动解包
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success === false) {
        toast.error(body.message || '请求失败');
        return Promise.reject(new Error(body.message));
      }
      return body.data;
    }
    return body;
  },
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const status = error.response?.status;
    switch (status) {
      case 401: toast.error('登录已过期');
               localStorage.removeItem('token');
               window.location.href = '/login'; break;
      case 403: toast.error('无权限访问'); break;
      case 404: toast.error('资源不存在'); break;
      case 500: toast.error('服务器异常'); break;
      default:  toast.error('网络异常'); break;
    }
    return Promise.reject(error);
  }
);

export default request;
```

### 3.3 API 函数规范

```ts
// api/index.ts — 每个函数必须标注 Promise<T> 返回类型
export function getProjects(): Promise<Project[]> {
  return request.get('/projects');
}

export function saveProject(data: Partial<Project>): Promise<Project> {
  return request.post('/projects', data);
}
```

### 3.4 TanStack Query 使用规范

**QueryClient 单例**（集中配置，全局唯一）：

```ts
// lib/queryClient.ts
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

**useQuery / useMutation 模式**：

```ts
// hooks/useProjects.ts
import { queryClient } from '@/lib/queryClient';

const projectKeys = { all: ['projects'] as const };

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: getProjects,
  });
  // 组件中直接用 data / isLoading / isError
}

export function useSaveProject(onSuccess?: () => void) {
  return useMutation({
    mutationFn: saveProject,
    onSuccess: () => {
      toast.success('保存成功');
      queryClient.invalidateQueries({ queryKey: projectKeys.all }); // ← 自动刷新
      onSuccess?.();
    },
  });
}
```

**queryKey 命名规范**：
- 列表：`['entity']`（如 `['projects']`）
- 详情：`['entity', id]`（如 `['project', projectId]`）
- 筛选：`['entity', 'filter', value]`（如 `['tasks', 'project', projectId]`）

### 3.5 客户端状态（Jotai 示例）

```ts
// store/atoms.ts
import { atomWithStorage } from 'jotai/utils';

// 持久化状态（使用 atomWithStorage，自动同步 storage）
export const userAtom = atomWithStorage<User | null>('currentUser', null, {
  getItem: (key) => {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
  setItem: (key, value) => {
    if (value) sessionStorage.setItem(key, JSON.stringify(value));
    else sessionStorage.removeItem(key);
  },
  removeItem: (key) => sessionStorage.removeItem(key),
});

// 派生状态（纯计算）
export const isLoggedInAtom = atom((get) => get(userAtom) !== null);
```

**使用原则**：
- 只读用 `useAtomValue`，只写用 `useSetAtom`，减少重渲染
- 需要持久化的用 `atomWithStorage`（指定完整 storage 对象）
- 纯计算用 `atom((get) => ...)`

### 3.6 🕳️ 常见陷阱

| 陷阱 | 正确做法 |
|------|---------|
| 拦截器已解包 `{ success, data }`，但页面还在用 `res.success` | 直接使用返回值 `const data = await getProjects()` |
| SSE 流式请求用 axios | SSE 用 fetch + ReadableStream，拆到独立文件 |
| 登出后页面不跳转（createBrowserRouter） | 手动 `navigate('/login', { replace: true })` |
| loader 中使用 `useAuth()` 等 hooks | loader 运行在 React 树外，用独立函数读 storage |
| 每个 hook 都调 `useQueryClient()` | 用全局单例 `import { queryClient }` |

---

## 四、TypeScript 类型规范

### 4.1 后端响应类型

```ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  code?: number;
  message?: string;
  data: T;
}
```

### 4.2 API 函数必须标注返回类型

```ts
// ✅ 正确：标注 Promise<T>
export function getUsers(): Promise<User[]> { ... }

// ❌ 错误：any
export function getUsers(): Promise<any> { ... }
// ❌ 错误：不标注
export function getUsers() { ... }
```

---

## 五、强制检查清单

| 规范 | 检查方法 | 违规处理 |
|------|---------|---------|
| 动态 className 用 cn() | 搜索 `className={\`|className={` | 改 cn() |
| 有 utility 时不用 `[prop:val]` | 搜索 `\[(height\|width\|margin\|padding\|color\|background-color\|font-size\|gap):` | 改 utility 前缀 |
| framer-motion 用 transform | 搜索 `\[rotateY:\|\[scale:\|\[translate:` | 改 `[transform:...]` |
| 路由用 data router | 检查有无 `createBrowserRouter` | 迁移 |
| API 函数标注返回类型 | 检查 `api/` 下函数签名 | 添加 `Promise<T>` |
| 写操作后 invalidate | 检查 mutation 的 onSuccess | 添加 |
| 页面用 useQuery | 搜索 `useState+useEffect` 中的请求 | 迁移 |

---

## 六、技术栈版本建议

| 技术 | 最低版本 | 说明 |
|------|---------|------|
| React | 18+ | 推荐 19 |
| TypeScript | 5+ | |
| Vite | 6+ | |
| Tailwind CSS | 4+ | CSS-first 配置 |
| React Router | 6.4+ | 支持 data router / loader |
| TanStack Query | 5+ | |
| axios | 1.x | |
| framer-motion | 11+ | |
