# FlowSync 亮暗主题系统

## 一、整体架构

```
src/main.tsx                   # 用 <ThemeProvider> 包裹应用
├── src/hooks/useTheme.tsx     # 主题状态管理 + React Context
├── src/index.css              # Tailwind v4 + CSS 变量（亮/暗两套 token）
├── src/App.tsx                # 页面路由
└── src/components/layout/
    └── Header.tsx             # 主题切换按钮（Sun/Moon）
```

| 层级 | 职责 |
|------|------|
| **CSS 变量** (`:root` / `.dark`) | 定义亮/暗两套颜色 token |
| **Tailwind v4 theme inline** | 将 CSS 变量映射为 Tailwind 工具类 |
| **useTheme hook** | React Context 管理当前主题状态 |
| **Header 按钮** | 用户交互入口，调用 toggleTheme |

---

## 二、Tailwind CSS v4 配置方式

本项目使用 **Tailwind CSS v4**（CSS-first 配置），无需传统的 `tailwind.config.js`。

`src/index.css` 顶部：

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));
```

- `@import "tailwindcss"` — Tailwind v4 引擎（自动扫描 `@theme` 和模板中的 class）
- `@custom-variant dark (&:is(.dark *))` — 定义 dark 变体：当祖先元素有 `.dark` class 时激活
- `@tailwindcss/vite` 插件在 `vite.config.ts` 中启用

Vite 配置 (`vite.config.ts`)：

```ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ...
})
```

---

## 三、背景色（`--background`）

### 亮色模式（`:root`）

```css
:root {
  --background: oklch(1 0 0);              /* 纯白 */
  --card: oklch(1 0 0);                    /* 卡片背景 - 纯白 */
  --popover: oklch(1 0 0);                 /* 弹出层背景 - 纯白 */
  --sidebar: oklch(0.985 0 0);             /* 侧栏背景 - 极浅灰 */
  --muted: oklch(0.97 0 0);                /* 弱化背景 - 浅灰 */
  --secondary: oklch(0.97 0 0);            /* 次要背景 - 浅灰 */
  --accent: oklch(0.97 0 0);              /* 强调背景 - 浅灰 */
  --destructive: oklch(0.577 0.245 27.325);/* 危险色 - 红 */
}
```

### 暗色模式（`.dark`）

```css
.dark {
  --background: oklch(0.145 0 0);          /* 深黑 */
  --card: oklch(0.205 0 0);               /* 卡片背景 - 深灰 */
  --popover: oklch(0.205 0 0);            /* 弹出层背景 - 深灰 */
  --sidebar: oklch(0.205 0 0);            /* 侧栏背景 - 深灰 */
  --muted: oklch(0.269 0 0);              /* 弱化背景 - 中深灰 */
  --secondary: oklch(0.269 0 0);          /* 次要背景 - 中深灰 */
  --accent: oklch(0.269 0 0);            /* 强调背景 - 中深灰 */
  --destructive: oklch(0.704 0.191 22.216);/* 危险色 - 暗红 */
}
```

---

## 四、字体色（`--foreground`）

### 亮色模式（`:root`）

```css
:root {
  --foreground: oklch(0.145 0 0);               /* 主文字 - 近黑 */
  --card-foreground: oklch(0.145 0 0);          /* 卡片文字 */
  --popover-foreground: oklch(0.145 0 0);       /* 弹出层文字 */
  --primary-foreground: oklch(0.985 0 0);       /* 主要按钮文字 - 白 */
  --secondary-foreground: oklch(0.205 0 0);     /* 次要按钮文字 */
  --muted-foreground: oklch(0.556 0 0);         /* 弱化文字 - 中灰 */
  --accent-foreground: oklch(0.205 0 0);        /* 强调文字 */
  --destructive-foreground: oklch(0.985 0 0);   /* 危险按钮文字 */
  --sidebar-foreground: oklch(0.145 0 0);       /* 侧栏文字 */
}
```

### 暗色模式（`.dark`）

```css
.dark {
  --foreground: oklch(0.985 0 0);               /* 主文字 - 白 */
  --card-foreground: oklch(0.985 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);       /* 主要按钮文字 - 深色 */
  --secondary-foreground: oklch(0.985 0 0);
  --muted-foreground: oklch(0.708 0 0);         /* 弱化文字 - 浅灰 */
  --accent-foreground: oklch(0.985 0 0);
  --destructive-foreground: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
}
```

---

## 五、边框色（`--border`）

### 亮色模式（`:root`）

```css
:root {
  --border: oklch(0.922 0 0);              /* 浅灰边框 */
  --input: oklch(0.922 0 0);              /* 输入框边框 */
  --ring: oklch(0.708 0 0);               /* 聚焦光环 */
  --sidebar-border: oklch(0.922 0 0);     /* 侧栏边框 */
}
```

### 暗色模式（`.dark`）

```css
.dark {
  --border: oklch(1 0 0 / 10%);           /* 半透明白色边框 */
  --input: oklch(1 0 0 / 15%);            /* 输入框边框 - 略亮 */
  --ring: oklch(0.556 0 0);              /* 聚焦光环 - 中灰 */
  --sidebar-border: oklch(1 0 0 / 10%);  /* 侧栏边框 */
}
```

**设计要点**：暗色模式下边框使用 `oklch(1 0 0 / 10%)`（白色 10% 透明度）而非纯色，让边框自然适应不同背景深度，同时保持柔和。

---

## 六、Tailwind 工具类映射（`@theme inline`）

`@theme inline {}` 将 CSS 变量注册为 Tailwind 语义工具类，让组件中可以直接使用：

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  /* ... sidebar, chart, status, priority 等 */
}
```

### 组件中使用示例

| 用途 | Tailwind 类 | 对应的 CSS 变量 |
|------|-------------|----------------|
| 页面背景 | `bg-background` | `var(--background)` |
| 主文字 | `text-foreground` | `var(--foreground)` |
| 边框 | `border-border` | `var(--border)` |
| 卡片背景 | `bg-card` | `var(--card)` |
| 弱化文字 | `text-muted-foreground` | `var(--muted-foreground)` |
| 主要按钮 | `bg-primary text-primary-foreground` | `var(--primary)` / `var(--primary-foreground)` |
| 悬停高亮 | `hover:bg-accent hover:text-accent-foreground` | `var(--accent)` / `var(--accent-foreground)` |
| 聚焦环 | `focus-visible:ring-ring` | `var(--ring)` |

实际代码示例（`Sidebar.tsx`）：

```tsx
<aside className="w-56 bg-card border-r border-border">
  <h1 className="text-xl font-bold text-foreground">FlowSync</h1>
  <Link className={cn(
    'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    isActive && 'bg-primary text-primary-foreground'
  )}>
    ...
  </Link>
</aside>
```

---

## 七、亮暗主题切换实现

### 7.1 ThemeProvider（`src/hooks/useTheme.tsx`）

```tsx
type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  // 1. 优先读取 localStorage
  const stored = localStorage.getItem('flowsync-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  // 2. 回退到系统偏好
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

function applyTheme(theme: Theme) {
  // 在 <html> 上添加或移除 .dark class
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
```

**逻辑优先级**：
1. localStorage `flowsync-theme` → 用户手动选择持久化
2. `prefers-color-scheme` → 无存储记录时跟随系统
3. 默认 `light`

### 7.2 主题切换流程

```
用户点击 Sun/Moon 按钮
        │
        ▼
toggleTheme()  ──►  setThemeState(prev === 'light' ? 'dark' : 'light')
        │
        ├── useEffect(1)  applyTheme(theme)       ──► html.classList.toggle('dark')
        ├── useEffect(2)  localStorage.setItem()   ──► 持久化
        │
        ▼
    CSS 变量切换
        │
        ├── .dark 选择器激活 ──► CSS 变量重定义
        ├── Tailwind dark: 变体生效
        └── 所有组件自动更新颜色
```

### 7.3 三个 useEffect

```tsx
// 1. 应用主题 - 每次 theme 变化时同步到 DOM
useEffect(() => { applyTheme(theme); }, [theme]);

// 2. 持久化 - 每次 theme 变化时存入 localStorage
useEffect(() => { localStorage.setItem(STORAGE_KEY, theme); }, [theme]);

// 3. 监听系统偏好变化 - 仅当用户从未手动选择时自动切换
useEffect(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setThemeState(e.matches ? 'dark' : 'light');
    }
  };
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}, []);
```

**关键细节**：第三个 effect 仅在 `localStorage` 中**没有**存储值时生效。一旦用户手动点击过切换按钮，系统偏好变化不再覆盖用户选择。

### 7.4 组件中使用

通过 `useTheme()` hook 消费：

```tsx
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}
```

### 7.5 顶层挂载（`src/main.tsx`）

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
)
```

---

## 八、圆角系统

```css
:root {
  --radius: 0.625rem;       /* 基础半径 ~10px */
}

@theme inline {
  --radius-sm: calc(var(--radius) * 0.6);   /* ~6px  */
  --radius-md: calc(var(--radius) * 0.8);   /* ~8px  */
  --radius-lg: var(--radius);               /* 10px  */
  --radius-xl: calc(var(--radius) * 1.4);   /* ~14px */
  --radius-2xl: calc(var(--radius) * 1.8);  /* ~18px */
  --radius-3xl: calc(var(--radius) * 2.2);  /* ~22px */
  --radius-4xl: calc(var(--radius) * 2.6);  /* ~26px */
}
```

---

## 九、语义颜色扩展

除了基础色外，系统还定义了业务语义颜色：

| 变量 | 亮色 | 暗色 | 用途 |
|------|------|------|------|
| `--success` | `oklch(0.6 0.18 145)` 绿 | `oklch(0.65 0.15 145)` 亮绿 | 成功文字/图标 |
| `--success-bg` | `oklch(0.93 0.06 145)` 浅绿 | `oklch(0.2 0.06 145)` 深绿 | 成功背景 |
| `--success-border` | `oklch(0.85 0.12 145)` 绿边 | `oklch(0.35 0.1 145)` 暗绿边 | 成功边框 |
| `--status-pending` | 中灰 | 浅灰 | 待处理状态文字 |
| `--status-progress` | 蓝 | 亮蓝 | 进行中状态文字 |
| `--status-done` | 绿 | 亮绿 | 已完成状态文字 |
| `--priority-low` | 中灰 | 浅灰 | 低优先级文字 |
| `--priority-medium` | 黄/绿 | 亮黄 | 中优先级文字 |
| `--priority-high` | 橙红 | 亮红 | 高优先级文字 |
| `--progress-bg` | 浅灰 | 深灰 | 进度条背景 |
| `--progress-fill` | 蓝 | 亮蓝 | 进度条填充 |
| `--chart-1~5` | 多种色相 | 加亮版本 | 统计图表色 |

---

## 十、颜色空间说明

本项目使用 **OKLCH** 颜色空间（`oklch(L C H)`），而非传统的 HSL 或 RGB。

| 特性 | OKLCH | HSL/RGB |
|------|-------|---------|
| 人眼感知均匀性 | ✅ 线性感知 | ❌ 非线性 |
| 暗色模式亮度反转 | ✅ 只需调整 L 值 | ❌ 需大幅调整 |
| 色相一致性 | ✅ 不同亮度下色相稳定 | ❌ HSL 色相会偏移 |

**暗色模式的典型做法**：将 L（亮度）值从亮色的 0.92~1.0 范围反转到 0.1~0.3 范围，同时略微调整 C（色度）值让颜色在暗背景下依然鲜明。

---

## 十一、开发指南：添加新颜色

1. 在 `src/index.css` 的 `:root {}` 中添加亮色值，在 `.dark {}` 中添加暗色值：

```css
:root {
  --my-color: oklch(...);   /* light */
}
.dark {
  --my-color: oklch(...);   /* dark */
}
```

2. 在 `@theme inline {}` 中注册映射：

```css
@theme inline {
  --color-my-color: var(--my-color);
}
```

3. 在组件中使用：

```tsx
<div className="bg-my-color text-my-color-foreground">
```

