# FlowSync 路由架构演进与实践总结

> 本文档记录本项目从 `<BrowserRouter>` + 条件渲染 迁移到 `createBrowserRouter` + `loader` 的过程、动机、踩坑与最终方案。

---

## 一、为什么重构

### 旧架构问题

```
<BrowserRouter>
  <AppRoutes />            ← 每次渲染重新创建
    ├─ user? → Login Routes     ← 条件分支导致树卸载/挂载
    └─ !user? → Layout + Routes ← Routes 在 JSX 中内联生成
</BrowserRouter>
```

| 问题 | 表现 | 影响 |
|------|------|------|
| **路由树重建** | `AppRoutes` 组件每次渲染重新创建 `<Routes>` 元素树 | 任何 context 变化（auth、theme）都触发整棵路由树 diff |
| **条件分支卸载/挂载** | `if (!user)` 返回 Login 路由，否则返回 Layout+路由 | 登录/登出时整棵树卸载再挂载，白屏闪烁 |
| **Layout 包裹 Routes** | `<Layout><Routes>...</Routes></Layout>` | Layout 通过 `{children}` 而非 `<Outlet />`，React Router 无法优化嵌套渲染 |
| **auth 检查在组件中** | `useAuth()` 在组件 render 中判断 | 无法在渲染前拦截未授权访问 |

### 新架构优势

```
const router = createBrowserRouter([ ... ]);  ← 模块加载时执行一次
<RouterProvider router={router} />
```

| 优势 | 说明 |
|------|------|
| **静态路由表** | 路由定义在模块作用域，组件重新渲染时不会重建 |
| **loader 前置鉴权** | 渲染前执行 `authLoader`，未登录直接 redirect，Layout 不挂载 |
| **`<Outlet />` 嵌套** | Layout 用 `<Outlet />` 渲染子路由，由 React Router 内部管理 |
| **零条件分支** | 不再有 `if (!user)` 判断，公开路由与受保护路由分离 |

---

## 二、最终架构

### 2.1 模块结构

| 文件 | 职责 |
|------|------|
| `src/App.tsx` | 创建静态路由表 + 渲染 `<RouterProvider>` |
| `src/hooks/useAuth.tsx` | AuthProvider + `getAuthUser()` 独立函数（供 loader 使用） |
| `src/components/layout/Layout.tsx` | 侧栏 + 顶栏 + `<Outlet />` |

### 2.2 路由表定义

```tsx
// src/App.tsx — 在模块作用域执行一次
const router = createBrowserRouter([
  // 公开路由 — 无需鉴权
  { path: '/login', element: <Login /> },

  // 受保护路由 — loader 鉴权
  {
    path: '/',
    element: <Layout />,
    loader: authLoader,
    children: [
      { path: 'overview', element: <Overview /> },
      { path: 'projects', element: <ProjectList /> },
      // ... 其余业务路由
    ],
  },

  // 兜底 — 未匹配路由重定向
  { path: '*', loader: async () => redirect('/overview') },
]);
```

### 2.3 Layout 组件

```tsx
export default function Layout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />  {/* 由 React Router 管理子路由渲染 */}
        </main>
      </div>
    </div>
  );
}
```

---

## 三、Loader 鉴权模式

### 3.1 standalone 函数

路由 loader 在 React 组件树**外部**运行，不能使用 `useContext()` 等 hooks。所以需要一个不依赖 React 的鉴权函数：

```tsx
// src/hooks/useAuth.tsx

/** 独立鉴权函数：直接从 sessionStorage 读取用户 */
export function getAuthUser(): User | null {
  try {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? (JSON.parse(userStr) as User) : null;
  } catch {
    return null;
  }
}
```

### 3.2 authLoader

```tsx
function authLoader() {
  const user = getAuthUser();
  if (!user) return redirect('/login');
  return null;  // 放行，继续渲染
}
```

### 3.3 登出流程

登出后需要**手动跳转**，因为 `createBrowserRouter` 的 loader 只在初始导航时执行，不会自动响应状态变化：

```tsx
// Header.tsx
import { useNavigate } from 'react-router-dom';

const handleLogout = () => {
  logout();
  navigate('/login', { replace: true });  // 必须手动跳转
};
```

### 3.4 完整生命周期

```
用户访问 /overview
  → authLoader 执行
  → getAuthUser() 读 sessionStorage
  → 有用户 → 放行，渲染 Layout ➔ Overview
  → 无用户 → redirect('/login')

用户点击"退出"
  → logout() 清除 sessionStorage
  → navigate('/login', { replace: true })
  → 直接渲染 Login 页面（公开路由，无 loader）

用户登录
  → login() 写入 sessionStorage
  → navigate('/overview')
  → authLoader 执行 → 读到用户 → 渲染 Layout ➔ Overview
```

---

## 四、踩坑记录

### 🕳️ 坑 1：登出后页面不跳转

**现象**：点击退出后，页面停留在原位置，只是 UI 可能变空白或报错。

**原因**：`createBrowserRouter` 路由表是静态的，`loader` 只在导航时触发。`logout()` 清除了 sessionStorage 但组件仍在渲染旧的 Layout，router 不会自动重新执行 `authLoader`。

**解决**：`logout()` 后手动 `navigate('/login', { replace: true })`。

---

### 🕳️ 坑 2：loader 中不能使用 useAuth()

**现象**：直接在 loader 中调用 `useAuth()` 报错 "useAuth must be used within AuthProvider"。

**原因**：loader 运行在 React 组件树之外，没有 Context 可用。

**解决**：提取 `getAuthUser()` 独立函数，直接操作 `sessionStorage`，不依赖 React。

```tsx
// ✅ loader 中可用
function authLoader() {
  const user = getAuthUser();  // 读 sessionStorage
  if (!user) return redirect('/login');
  return null;
}

// ❌ loader 中不可用
function authLoader() {
  const { user } = useAuth();  // Error!
}
```

---

### 🕳️ 坑 3：`{ replace: true }` 的作用

没有 `replace: true` 时，登出后用户按浏览器"返回"按钮会回到已登出的受保护页面，触发 loader 重定向到 `/login`，产生冗余历史记录。

```
❌ 无 replace：  /overview → /login → (返回) → /overview → authLoader → /login
✅ 有 replace：  /overview → /login (替换了历史) → (返回) → 更早的页面
```

---

### 🕳️ 坑 4：Layout 用 `{children}` 还是 `<Outlet />`

```tsx
// ❌ 旧：Layout 包裹 Routes — 每次路由切换都重新渲染 Layout 子元素
function Layout({ children }) {
  return <div><Sidebar /><Header />{children}</div>;
}

// ✅ 新：Layout 使用 <Outlet /> — React Router 管理嵌套
function Layout() {
  return <div><Sidebar /><Header /><Outlet /></div>;
}
```

区别：
- `{children}` — 由父组件 props 驱动，子元素在父组件渲染时一次性传入
- `<Outlet />` — 由 React Router 内部管理，只渲染当前匹配的子路由组件

---

## 五、与旧架构对比

| 维度 | 旧架构 | 新架构 |
|------|--------|--------|
| 路由定义 | JSX `<Routes>` 内联 | `createBrowserRouter` 静态数组 |
| 重建时机 | 每次 `AppRoutes` 渲染 | 仅模块加载时一次 |
| Auth 检查 | `useAuth()` 在组件中条件判断 | `loader` 在渲染前拦截 |
| 嵌套渲染 | `Layout` 用 `{children}` | Layout 用 `<Outlet />` |
| 路由渲染 | `<BrowserRouter>` | `<RouterProvider>` |
| 登出处理 | context 变化自动重渲染 | 需手动 `navigate()` |

---

## 六、适用场景判断

### 适合 `createBrowserRouter` + `loader`

- ✅ 需要渲染前鉴权/数据预取
- ✅ 路由表固定，不动态增减
- ✅ 需要 `useLoaderData()` 在组件中获取 loader 返回数据
- ✅ 使用 React Router v6.4+

### 适合 `<BrowserRouter>` + JSX Routes

- ❌ 路由根据运行态动态生成
- ❌ 不需要 loader 前置处理
- ❌ React Router 版本低于 v6.4
