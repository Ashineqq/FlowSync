# FlowSync — 项目协同管理系统

前后端分离的项目协同管理应用。

- **前端**：React + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **后端**：Python Flask + SQLAlchemy + PostgreSQL
- **AI 功能**：接入 DeepSeek API，支持 AI 任务拆解

---

## 📦 环境要求

- Node.js >= 18
- Python >= 3.10
- PostgreSQL（默认连接 `localhost:5432`，数据库名 `flowsync`）

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

## 🗑️ 清空业务数据

需要重新实验时，执行以下命令可清空所有业务数据（**保留成员/用户数据不影响登录**）：

```bash
cd backend && venv/bin/python -c "
from app import create_app, db
app = create_app()
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
├── frontend/                 # React 前端
│   └── src/
│       ├── api/              # API 请求封装（axios）
│       ├── components/       # 通用组件
│       │   ├── common/       # 公共组件
│       │   └── ui/           # shadcn UI 组件
│       ├── hooks/            # 自定义 Hooks
│       ├── pages/            # 页面组件
│       ├── store/            # 状态管理
│       └── types/            # TypeScript 类型
│
├── backend/                  # Flask 后端
│   └── app/
│       ├── controllers/      # 路由控制器（蓝图）
│       ├── models/           # ORM 模型
│       └── services/         # 业务逻辑层
│
└── README.md
```

---

## 🧪 常用命令

| 用途 | 命令 |
|------|------|
| 后端启动 | `cd backend && venv/bin/python run.py` |
| 前端启动 | `cd frontend && npm run dev` |
| 清空数据 | 见上方 [清空所有表数据](#-清空所有表数据) |
| 前端编译检查 | `cd frontend && npx tsc --noEmit` |
