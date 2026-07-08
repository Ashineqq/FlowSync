# FlowSync 前端开发文档

## 1. 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型系统 |
| Vite | 8.x | 构建工具 |
| Tailwind CSS | 4.x | 样式方案 |
| shadcn/ui (Base UI) | latest | UI 组件库 |
| React Router | 6.x | 路由 |
| Axios | latest | HTTP 客户端 |
| react-hook-form | latest | 表单管理 |
| zod | latest | 表单校验 |
| sonner | latest | Toast 通知 |
| date-fns | latest | 日期格式化 |
| react-day-picker | latest | 日历组件 |

## 2. 项目结构

```
frontend/src/
├── api/                  # API 请求封装
│   ├── request.ts        # Axios 实例 + 拦截器
│   ├── auth.ts
│   ├── project.ts
│   ├── task.ts
│   ├── taskLog.ts
│   ├── summary.ts
│   ├── overview.ts
│   ├── user.ts
│   └── ai.ts             # 包含流式请求
├── components/
│   ├── ui/               # shadcn/ui 组件（Base UI 版本）
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx     # Base UI Select
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── tabs.tsx
│   │   ├── separator.tsx
│   │   ├── calendar.tsx   # react-day-picker
│   │   ├── popover.tsx    # Base UI Popover
│   │   └── field.tsx      # 表单字段组件
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── common/
│       ├── StatusBadge.tsx
│       ├── PriorityBadge.tsx
│       └── DatePicker.tsx
├── hooks/
│   └── useAuth.tsx        # React Context 认证状态
├── pages/                 # 页面组件
├── store/
│   └── taskBreakdown.ts   # AI 任务拆解流式状态管理
├── types/
│   ├── index.ts           # 所有类型定义
│   └── api.ts             # ApiResponse 类型
├── lib/
│   └── utils.ts           # cn() 工具函数
├── App.tsx
├── main.tsx
└── index.css              # Tailwind CSS 4 配置
```

## 3. 架构设计

### 3.1 认证状态管理

使用 React Context 实现，不依赖外部状态库：

```tsx
// hooks/useAuth.tsx
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  // login/logout 函数通过 setUser 更新 Context
}

// 使用方式
const { user, login, logout, isLeader } = useAuth();
```

**关键：** `AuthProvider` 包裹在 `App` 外层，确保所有组件共享同一状态。

### 3.2 路由结构

单一 `BrowserRouter` 在 `App` 组件中，不因状态变化而重建：

```tsx
function App() {
  return (
    <BrowserRouter>
      <AppRoutes />  {/* 内部根据 user 状态切换路由 */}
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  if (!user) return <Routes>...登录路由...</Routes>;
  return <Layout><Routes>...业务路由...</Routes></Layout>;
}
```

**关键：** `BrowserRouter` 只有一个，避免状态变化导致 Router 重建丢失导航。

### 3.3 API 请求层

```typescript
// api/request.ts
const request = axios.create({ baseURL: '/api', timeout: 30000 });

// 请求拦截器：自动附加 currentUserId
request.interceptors.request.use((config) => {
  const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  config.params = { ...config.params, currentUserId: user.id };
  return config;
});

// 响应拦截器：统一解析
request.interceptors.response.use((response) => response.data);
```

### 3.4 流式状态管理（AI 任务拆解）

使用模块级 store + `useSyncExternalStore`，状态不随组件卸载丢失：

```typescript
// store/taskBreakdown.ts
let state = { status: 'idle', thinkingText: '', contentText: '', ... };
let listeners = new Set();

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function getState() { return state; }
export function startStream(data) { /* fetch SSE 流 */ }
```

**为什么不用 useState：** 组件卸载时 state 会重置，但 fetch 流应该在后台继续运行。

## 4. Tailwind CSS 4 配置

**与 v3 完全不同：** 不使用 `tailwind.config.js`，改为 CSS 中 `@theme` 配置。

```css
/* index.css */
@import "tailwindcss";

@theme {
  --color-primary: hsl(222.2 47.4% 11.2%);
  --radius-lg: 0.5rem;
  /* ... */
}
```

**vite.config.ts：** 使用 `@tailwindcss/vite` 插件：

```typescript
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

## 5. shadcn/ui（Base UI 版本）

### 5.1 与 Radix UI 的区别

当前 shadcn/ui 使用 **Base UI**（MUI 团队）而非 Radix UI。

| 组件 | Radix UI | Base UI |
|------|----------|---------|
| Select | `<Select>` + `<SelectItem value="...">` | `<Select items={[...]}>` + `<SelectItem value="...">` |
| Dialog | `Content` | `Popup` |
| Popover | `Content` | `Popup` |

### 5.2 Select 正确用法

必须传 `items` 属性给 Root：

```tsx
<Select items={[{ label: '选项1', value: '1' }]} value={val} onValueChange={setVal}>
  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>标签</SelectLabel>
      {items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
    </SelectGroup>
  </SelectContent>
</Select>
```

**注意：**
- `onValueChange` 类型为 `(value: string | null) => void`
- `SelectTrigger` 加 `className="w-full"` 确保宽度填充

### 5.3 Popover/Calendar 组件

手动创建（shadcn CLI 对 Base UI 支持不完整）：

- `popover.tsx` — 基于 `@base-ui/react/popover`
- `calendar.tsx` — 基于 `react-day-picker`

## 6. 表单管理（react-hook-form + zod）

### 6.1 标准模式

```tsx
const schema = z.object({
  name: z.string().min(1, '请输入名称'),
  role: z.string().min(1, '请选择角色'),
});

const form = useForm({ resolver: zodResolver(schema), defaultValues: {...} });

<form onSubmit={form.handleSubmit(onSubmit)} id="my-form">
  <Controller name="name" control={form.control}
    render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel required>名称</FieldLabel>
        <Input {...field} aria-invalid={fieldState.invalid} />
        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </Field>
    )}
  />
</form>
```

### 6.2 组件统一使用

所有表单统一使用 `Field` + `FieldLabel` + `FieldError` 组件：

- `FieldLabel` 的 `required` 属性自动渲染红色 `*`
- `Field` 的 `space-y-4` 统一控制 label 与 input 间距
- `FieldLabel` 使用 `leading-relaxed pb-1` 确保足够间距

### 6.3 Dialog 中的表单

使用 Card 结构：

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="p-0">
    <Card>
      <CardHeader><CardTitle>标题</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} id="form-id">
          <FieldGroup>...</FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="form-id">保存</Button>
      </CardFooter>
    </Card>
  </DialogContent>
</Dialog>
```

## 7. 日期选择器

手动创建 `DatePicker` 组件，基于 Popover + Calendar：

```tsx
<DatePicker value={formData.date} onChange={(val) => setFormData({...formData, date: val})} />
```

- 值格式：`yyyy-MM-dd` 字符串
- 使用 `date-fns` 的 `format` 进行格式化

## 8. Toast 通知（sonner）

### 8.1 安装配置

```bash
npm install sonner
```

在 `App.tsx` 中添加 Toaster：

```tsx
import { Toaster } from 'sonner';
<Toaster position="top-right" richColors />
```

### 8.2 使用

```tsx
toast.success('操作成功');
toast.error('操作失败', { description: '详细信息' });
```

**不要使用** `alert()` 或 `window.confirm()`。

## 9. 踩过的坑

### 9.1 登录/退出后页面不跳转

**问题：** `BrowserRouter` 被重建，`navigate()` 失效。

**解决方案：** 单一 `BrowserRouter` 在 `App` 中，不因 `user` 状态变化而重建。

### 9.2 useAuth 状态不共享

**问题：** 每个组件调用 `useAuth()` 得到独立的 `useState` 副本。

**解决方案：** 使用 `createContext` + `AuthProvider` 共享状态。

### 9.3 Select 组件不显示选中项

**问题：** Base UI Select 需要 `items` 属性来映射值到标签。

**解决方案：** 在 `Select` Root 上传入 `items={[{label, value}]}` 数组。

### 9.4 AI 流式输出中断

**问题：** 切换页面时组件卸载，fetch 流被中断。

**解决方案：** 使用模块级 store + `useSyncExternalStore`，fetch 在组件外运行。

### 9.5 导入选中任务时 projectId 为空

**问题：** `selectedProjectId` 是组件本地状态，页面切换后重置。

**解决方案：** 将 `projectId` 存入 store，导入时从 store 取值。

### 9.6 TaskBreakdown label 样式不统一

**问题：** 使用原生 `<label>` 而非 `FieldLabel` 组件。

**解决方案：** 统一使用 `<Field><FieldLabel required>...</FieldLabel>` 模式。

### 9.7 DatePicker 日期输入框样式丑

**问题：** 原生 `<input type="date">` 样式不可控。

**解决方案：** 创建 `DatePicker` 组件，基于 Popover + Calendar。

### 9.8 文件扩展名导致 TSX 报错

**问题：** `useAuth.ts` 包含 JSX 但扩展名是 `.ts`。

**解决方案：** 重命名为 `.tsx`。

## 10. 启动方式

```bash
cd frontend

npm install
npx shadcn@latest init  # 选择 Tailwind v4
npx shadcn@latest add button input table dialog select textarea card badge tabs separator
npm install react-hook-form @hookform/resolvers zod sonner date-fns react-day-picker
npm run dev
# 启动在 http://localhost:5173
```

## 11. 开发规范

1. **组件命名：** PascalCase（`ProjectList.tsx`）
2. **文件组织：** 页面在 `pages/`，通用组件在 `components/common/`，UI 组件在 `components/ui/`
3. **API 封装：** 每个模块一个文件，统一使用 `request` 实例
4. **表单：** 统一使用 `react-hook-form` + `zod` + `Field` 组件
5. **通知：** 使用 `sonner` 的 `toast`，不要用 `alert()`
6. **状态：** 简单状态用 `useState`，跨组件共享用 Context，流式/后台任务用模块级 store
7. **样式：** 使用 Tailwind CSS 4，不写内联样式
8. **类型：** 所有组件和 API 返回值必须有类型定义
