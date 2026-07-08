# FlowSync — 项目协同管理系统

前后端分离的项目协同管理应用。

- **前端**：React + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **后端**：Python Flask + SQLAlchemy + PostgreSQL
- **AI 功能**：接入 DeepSeek API，支持 AI 任务拆解
- **部署**：前端 Vercel + 后端 Render + 数据库 Render PostgreSQL

---

## 📦 环境要求

- Node.js >= 18
- Python >= 3.10
- PostgreSQL（默认连接 `localhost:5432`，数据库名 `flowsync`）

> 本项目使用 `psycopg[binary]`（psycopg 3）作为 PostgreSQL 驱动，**不要**安装 `psycopg2`。

---

## 🚀 快速启动

### 1️⃣ 后端启动

```bash
# 进入后端目录
cd backend

# 创建虚拟环境（仅首次）
python3 -m venv venv

# 安装依赖（仅首次）
venv/bin/pip install -r requirements.txt

# （可选）配置环境变量
# export DATABASE_URL=postgresql+psycopg://用户:密码@localhost:5432/flowsync
# export DEEPSEEK_API_KEY=your_key_here

# 启动后端（会自动创建表并写入初始用户数据）
venv/bin/python run.py
```

后端默认运行在 **http://localhost:5000**。

> 初始用户：`leader` / `123456`（负责人）、`member1` / `123456`、`member2` / `123456`

### 2️⃣ 前端启动

```bash
# 进入前端目录（新开一个终端）
cd frontend

# 安装依赖（仅首次）
npm install

# 启动开发服务器
npm run dev
```

前端默认运行在 **http://localhost:5173**，已配置代理将 `/api` 请求转发到后端 5000 端口。

---

## 🔧 部署

项目使用 **Vercel（前端）+ Render（后端 + PostgreSQL）** 部署。

| 平台 | 用途 | 费用 |
|------|------|------|
| [Vercel](https://vercel.com) | 前端 SPA | 免费 |
| [Render](https://render.com) | 后端 Flask + PostgreSQL | 免费（休眠） |

详细部署步骤请参考 [skills/deployment/SKILL.md](skills/deployment/SKILL.md)。

---

## 🗑️ 清空业务数据

需要重新实验时，执行以下命令可清空所有业务数据（**保留成员/用户数据不影响登录**）：

```bash
cd backend && venv/bin/python -c "
from app import db
from app.models.user import User
with app.app_context():
    db.session.execute(db.text('DELETE FROM task_log'))
    db.session.execute(db.text('DELETE FROM task_summary'))
    db.session.execute(db.text('DELETE FROM task_info'))
    db.session.execute(db.text('DELETE FROM project_info'))
    db.session.commit()
    print('✅ 业务数据已清空，成员列表保留')
"
```

> 清空后需要**重新启动后端**（`venv/bin/python run.py`），它会重新创建表结构（数据已存在则不会覆盖）。

---

## 📁 项目结构

```
flowsync/
├── frontend/                    # React 前端
│   ├── src/
│   │   ├── api/                 # API 请求封装
│   │   ├── components/          # 通用组件
│   │   │   ├── common/          # 公共组件
│   │   │   ├── ui/              # shadcn UI 组件
│   │   │   └── login/           # 登录页（拆分为 index + animations）
│   │   ├── hooks/               # 自定义 Hooks
│   │   ├── lib/                 # 工具函数（含 api-key.ts）
│   │   ├── pages/               # 页面组件
│   │   ├── store/               # 状态管理
│   │   └── types/               # TypeScript 类型
│   └── vercel.json              # Vercel 部署配置（API rewrite）
│
├── backend/                     # Flask 后端
│   ├── app/
│   │   ├── __init__.py          # 应用工厂 + 建表 + 种子数据
│   │   ├── controllers/         # 路由控制器（蓝图）
│   │   ├── models/              # ORM 模型
│   │   └── services/            # 业务逻辑层
│   ├── Procfile                 # Render/gunicorn 启动配置
│   ├── run.py                   # 本地开发入口
│   └── requirements.txt
│
├── skills/                      # 项目技能文档
│   ├── motion/SKILL.md          # Framer Motion 动画调试指南
│   └── deployment/SKILL.md      # 全栈部署指南
│
└── README.md
```

---

## 🧪 常用命令

| 用途 | 命令 |
|------|------|
| 后端启动 | `cd backend && venv/bin/python run.py` |
| 前端启动 | `cd frontend && npm run dev` |
| 清空数据 | 见上方 [清空业务数据](#-清空业务数据) |
| 前端编译检查 | `cd frontend && npx tsc --noEmit` |
| 前端构建 | `cd frontend && npm run build` |

---

## ⚠️ 开发注意事项

### DATABASE_URL 格式

本项目使用 `psycopg[binary]`（psycopg 3），数据库连接串必须使用 `postgresql+psycopg://` 前缀：

```bash
# ✅ 正确
export DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/flowsync

# ❌ 错误（会找 psycopg2，未安装）
export DATABASE_URL=postgresql://user:pass@localhost:5432/flowsync
```

### 本地 PostgreSQL 没有启动？

如果本地没有 PostgreSQL，可以使用 Render 提供的 External Database URL 远程连接：

```bash
export DATABASE_URL=postgresql+psycopg://user:pass@dpg-xxx.singapore-postgres.render.com:5432/dbname
```

### API Key 配置

DeepSeek API Key 不再从环境变量读取（已在生产环境中移除 fallback），统一在页面的「个人信息 → API Key 配置」中设置，存储在浏览器 localStorage。
