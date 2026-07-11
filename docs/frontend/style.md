# FlowSync 前端样式避坑指南 (style.md)

> 本文档记录本项目实战中遇到的 Tailwind CSS 样式陷阱和最佳实践，补充规范文档中未覆盖的边界情况。

---

## 一、Tailwind 任意值语法：区分两条路径

Tailwind v4 的任意值（arbitrary value）有两种写法，**用错会导致样式不生效或行为异常**：

| 场景 | 语法 | 示例 | 说明 |
|------|------|------|------|
| 属性有对应 Tailwind utility | `{utility}-[value]` | `h-[460px]` `w-[200px]` `bg-[#ff0]` | 优先使用此方式 |
| 属性无对应 Tailwind utility | `[property:value]` | `[backface-visibility:hidden]` `[perspective:800px]` | 降级使用 |

### 判断方法

```tsx
/* ✅ 正确：height 有 h-* utility，用 h-[460px] */
className="h-[460px]"

/* ❌ 错误：height 有 h-* utility，却写了原始 CSS 属性 */
className="[height:460px]"

/* ✅ 正确：backface-visibility 没有对应 utility，用原始 CSS 属性 */
className="[backface-visibility:hidden]"

/* ✅ 正确：transform-style 没有对应 utility */
className="[transform-style:preserve-3d]"

/* ✅ 正确：perspective 没有对应 utility */
className="[perspective:800px]"
```

### 常见属性的 utility 对照

| CSS 属性 | 对应 Tailwind utility | 任意值写法 |
|----------|-----------------------|-----------|
| `height` | `h-*` | `h-[460px]` |
| `width` | `w-*` | `w-[200px]` |
| `margin` | `m-*` / `mt-*` / `mb-*` 等 | `m-[12px]` |
| `padding` | `p-*` / `pt-*` / `pb-*` 等 | `p-[8px]` |
| `color` | `text-*` | `text-[#333]` |
| `background-color` | `bg-*` | `bg-[var(--my-color)]` |
| `font-size` | `text-*` | `text-[15px]` |
| `gap` | `gap-*` | `gap-[18px]` |
| `transform` | 无 | `[transform:rotateY(180deg)]` |
| `backface-visibility` | 无 | `[backface-visibility:hidden]` |
| `perspective` | 无 | `[perspective:800px]` |
| `transform-style` | 无 | `[transform-style:preserve-3d]` |
| `rotate` (独立属性) | 无 | `[rotateY:180deg]` |
| CSS 自定义属性 | 无 | `[--my-var:12px]` |

---

## 二、🚨 大坑：CSS transform 双系统不互通

这是本项目遇到的最隐蔽的坑。现代 CSS 有两套操作 3D 变换的属性：

### 传统 system (framer-motion 使用)
```css
transform: rotateY(180deg) scale(0.5) translateX(10px);
```

### 现代独立属性
```css
rotate: y 180deg;
scale: 0.5;
translate: 10px;
```

**关键问题：这两套系统互不叠加。** framer-motion 的 `animate={{ rotateY: 180 }}` 操作的是 `transform` 属性（传统系统）。如果元素用 `rotateY: 180deg`（现代独立属性），它不会与 framer-motion 的 transform 动画叠加。

### 本项目实际案例

```tsx
<motion.div
  className="[transform-style:preserve-3d] h-[460px]"
  animate={{ rotateY: flipped ? 180 : 0 }}     {/* framer-motion 操作 transform */}
>
  {/* 正面 */}
  <div className="[backface-visibility:hidden] h-full">...</div>

  {/* 背面 — 需要预旋转 180° */}
  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
    {/* ✅ transform:rotateY(180deg) — 与父级 framer-motion 同体系 */}
    {/* ❌ 如果用 rotateY:180deg — 独立属性体系，父级 transform 动画不叠加 */}
  </div>
</motion.div>
```

### 规则

> **当组件使用了 framer-motion 的 `animate`/`style` 控制 `rotate`/`scale`/`translate` 时，同元素或子元素的同类变换必须使用 `transform` 函数式写法（即 `[transform:rotateY(Xdeg)]`），不得使用现代独立属性（`[rotateY:Xdeg]`）。**

---

## 三、inline `style` — 什么时候必须保留

按照规范，静态样式值应迁移到 className。但以下情况**必须保留** `style={{}}`：

| 场景 | 示例 | 原因 |
|------|------|------|
| framer-motion MotionValue | `style={{ x, y, opacity, rotateX }}` | framer-motion 通过 JS 驱动这些值 |
| 动态字符串 props | `style={{ height: containerHeight }}` | 值来自 props（如 `"auto"`、`"100%"`） |
| 动态百分比计算 | `style={{ width: \`${percent}%\` }}` | 值来自 state，无法用静态 class |
| Canvas 元素尺寸 | `canvas.style.width = W + "px"` | 通过 DOM API 设置，非 React style |

### 值得迁移的（纯静态数字或字符串）

```tsx
/* ❌ 不应使用 inline style */
<div style={{ height: 460 }}>

/* ✅ 应迁移到 className */
<div className="h-[460px]">
```

---

## 四、`cn()` 使用检查清单

| 规则 | 示例 | 说明 |
|------|------|------|
| ✅ 模板字符串拼接 → cn() | `cn('base', className)` | 替代 `` `base ${className}` `` |
| ✅ 三元 className → cn() | `cn('base', { 'active': isActive })` | 替代三元表达式 |
| ✅ 固定静态 class | 直接 `className="..."` | 不需要 cn() |
| ❌ 禁止 cn() 包裹无关内容 | — | cn() 只处理 className |

### 常见错误写法纠正

```tsx
/* ❌ 模板字符串拼接 */
<Icon className={`h-4 w-4 ${card.color}`} />

/* ✅ 使用 cn() */
<Icon className={cn('h-4 w-4', card.color)} />

/* ❌ 三元表达式直接生成 className */
<div className={isActive ? 'bg-primary' : 'bg-muted'}>

/* ✅ 使用 cn() 对象格式 */
<div className={cn('base', { 'bg-primary': isActive, 'bg-muted': !isActive })}>
```

---

## 五、CSS Module 抽离时机

规范要求同一复合样式出现 **3 次及以上** 时抽离。实际操作中注意：

### 适合抽离的模式（含复杂 CSS）

```css
/* flip-card.module.css */
@layer components {
  .card-flip-back {
    @apply absolute inset-0 [backface-visibility:hidden];
  }
  .card-flip-front {
    @apply [backface-visibility:hidden] h-full;
  }
  .card-flip-container {
    @apply [transform-style:preserve-3d];
  }
}
```

### 不必抽离的模式（仅 1-3 个简单工具类）

```tsx
/* ✅ 这种不需要抽离 */
<div className="flex justify-end gap-2 w-full">
```

---

## 六、动态 vs 静态 className 判定速记

```
                                    ┌─ 值是 state / prop / MotionValue？
                                    │    是 → ❌ 不能放 className
               ┌─ 是动态条件 ───────┤
               │                    └─ 值是 boolean 真假条件？
               │                        是 → ✅ 用 cn({ 'class': bool })
               │
className ─────┤
               │                    ┌─ 属性有 Tailwind utility？
               │                    │    是 → ✅ {utility}-[value] 写法
               └─ 是静态值 ────────┤
                                    └─ 属性无 Tailwind utility？
                                         是 → ✅ [property:value] 写法
```

---

## 七、典型反例速查

| 错误写法 | 正确写法 | 违反原则 |
|----------|----------|----------|
| `className={\`h-4 w-4 ${color}\`}` | `className={cn('h-4 w-4', color)}` | 规则 2.4：动态样式必须用 cn() |
| `[height:460px]` | `h-[460px]` | 规则 1.2：有 utility 时用 utility 前缀 |
| `[rotateY:180deg]`（配合 framer-motion） | `[transform:rotateY(180deg)]` | framer-motion 兼容性 |
| `style={{ height: 460 }}` | `className="h-[460px]"` | 规则 1.2：静态值优先 className |
| `` className={`base ${cls}`} `` | `className={cn('base', cls)}` | 规则 2.4：禁止字符串拼接 |

