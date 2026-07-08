# FlowSync 技术规格说明书 (Spec-Driven)

> 部分内容由豆包生成

\*\*文档定位：\*\*本文档为 Spec-Driven 开发规格书，所有代码实现必须严格遵循本文档定义。技术栈：React + Flask + PostgreSQL + DeepSeek AI。

# 1. 项目概述

## 1.1 项目简介

FlowSync 是一个面向教学场景的小组任务协同管理系统，核心功能包括项目创建、AI 任务拆解、任务分配、进度记录、总结输出。项目接入 DeepSeek 大模型辅助任务自动拆分与负责人推荐。

## 1.2 核心理念

- 流程完整：项目 → 任务 → 进度 → 总结，全链路闭环
- 结构清楚：前后端分离，三层架构，代码易读
- 功能够用：满足教学演示需求，不做过度设计
- AI 赋能：AI 只给建议，不替人做决定

## 1.3 核心业务流程

1. 项目负责人创建项目
2. 调用 DeepSeek AI 进行任务拆解，生成任务列表与推荐负责人
3. 负责人勾选并导入 AI 生成的任务
4. 手动补充或调整任务，分配负责人、设置截止日期
5. 成员执行任务，更新状态、记录进度
6. 撰写阶段总结与最终总结
7. 总览页面查看全局统计

# 2. 技术栈

## 2.1 整体架构

前后端分离架构，前端 SPA 通过 REST API 与后端通信。

| 层次       | 技术                         | 版本                            | 端口   |
| -------- | -------------------------- | ----------------------------- | ---- |
| 前端构建     | Vite + React 18            | Vite 5.x, React 18.x          | 5173 |
| 前端语言     | TypeScript                 | 5.x                           | —    |
| 样式方案     | Tailwind CSS 4 + shadcn/ui | Tailwind v4, shadcn/ui latest | —    |
| HTTP 客户端 | Axios                      | latest                        | —    |
| 路由       | React Router               | 6.x                           | —    |
| 后端框架     | Flask                      | 3.x                           | 5000 |
| ORM 框架   | Flask-SQLAlchemy           | 3.x                           | —    |
| 数据库驱动    | psycopg2-binary            | latest                        | —    |
| 数据库      | PostgreSQL                 | 16                            | 5432 |
| AI 模型    | DeepSeek（OpenAI 兼容 SDK）    | deepseek-chat                 | —    |
| 跨域处理     | Flask-CORS                 | latest                        | —    |

## 2.2 Tailwind CSS 4 配置说明

\*\*重要：\*\*使用 Tailwind CSS v4，配置方式与 v3 完全不同。不使用 tailwind.config.js，改为 CSS 中 @theme 配置。

### 2.2.1 安装方式

```bash
npm install tailwindcss @tailwindcss/vite
```

### 2.2.2 vite.config.ts 配置

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

### 2.2.3 src/index.css 配置

```css
@import "tailwindcss";

@theme {
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(222.2 84% 4.9%);
  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(222.2 84% 4.9%);
  --color-popover: hsl(0 0% 100%);
  --color-popover-foreground: hsl(222.2 84% 4.9%);
  --color-primary: hsl(222.2 47.4% 11.2%);
  --color-primary-foreground: hsl(210 40% 98%);
  --color-secondary: hsl(210 40% 96.1%);
  --color-secondary-foreground: hsl(222.2 47.4% 11.2%);
  --color-muted: hsl(210 40% 96.1%);
  --color-muted-foreground: hsl(215.4 16.3% 46.9%);
  --color-accent: hsl(210 40% 96.1%);
  --color-accent-foreground: hsl(222.2 47.4% 11.2%);
  --color-destructive: hsl(0 84.2% 60.2%);
  --color-destructive-foreground: hsl(210 40% 98%);
  --color-border: hsl(214.3 31.8% 91.4%);
  --color-input: hsl(214.3 31.8% 91.4%);
  --color-ring: hsl(222.2 84% 4.9%);
  --radius-lg: 0.5rem;
  --radius-md: calc(0.5rem - 2px);
  --radius-sm: calc(0.5rem - 4px);
}

body {
  @apply bg-background text-foreground;
}
```

## 2.3 shadcn/ui 初始化

```bash
npx shadcn@latest init
# 选择 Tailwind v4 选项
# 设置组件目录为 src/components/ui
# 设置 utils 路径为 src/lib/utils
```

## 2.4 前后端通信

- 前端通过 Vite devServer proxy 将 /api 请求代理到后端 5000 端口
- 所有 API 响应统一使用 ApiResponse 封装格式
- 认证方式：简化 token，前端通过 Axios 拦截器附加 currentUserId 参数

## 2.5 统一响应格式 ApiResponse

```typescript
interface ApiResponse&lt;T&gt; {
  success: boolean;
  message: string;
  data: T | null;
}
```

```python
class ApiResponse:
    @staticmethod
    def success(data=None, message="操作成功"):
        return {"success": True, "message": message, "data": data}

    @staticmethod
    def error(message="操作失败"):
        return {"success": False, "message": message, "data": None}
```

# 3. 项目目录结构

## 3.1 整体目录

```plaintext
flowsync/
├── frontend/              # React 前端项目
│   ├── src/
│   │   ├── components/    # 通用组件
│   │   │   └── ui/        # shadcn/ui 组件
│   │   ├── pages/         # 页面组件
│   │   ├── api/           # API 请求封装
│   │   ├── types/         # TypeScript 类型定义
│   │   ├── lib/           # 工具函数
│   │   ├── hooks/         # 自定义 hooks
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── vite.config.ts
│   └── package.json
└── backend/               # Flask 后端项目
    ├── app/
    │   ├── __init__.py    # Flask 应用工厂
    │   ├── models/        # SQLAlchemy 模型
    │   ├── controllers/   # 控制器层（路由）
    │   ├── services/      # 业务逻辑层
    │   ├── dto/           # 数据传输对象
    │   └── common/        # 通用工具
    ├── config.py          # 配置文件
    ├── run.py             # 启动入口
    └── requirements.txt
```

## 3.2 后端目录详解

```plaintext
backend/app/
├── __init__.py            # create_app 应用工厂
├── models/
│   ├── __init__.py
│   ├── user.py            # User 模型
│   ├── project.py         # ProjectInfo 模型
│   ├── task.py            # TaskInfo 模型
│   ├── task_log.py        # TaskLog 模型
│   └── task_summary.py    # TaskSummary 模型
├── controllers/
│   ├── __init__.py
│   ├── auth_controller.py
│   ├── project_controller.py
│   ├── task_controller.py
│   ├── task_log_controller.py
│   ├── task_summary_controller.py
│   ├── overview_controller.py
│   ├── user_controller.py
│   └── ai_controller.py
├── services/
│   ├── __init__.py
│   ├── auth_service.py
│   ├── project_service.py
│   ├── task_service.py
│   ├── task_log_service.py
│   ├── task_summary_service.py
│   ├── overview_service.py
│   ├── user_service.py
│   └── deepseek_service.py
├── dto/
│   ├── __init__.py
│   ├── auth_dto.py
│   ├── ai_dto.py
│   └── common_dto.py
└── common/
    ├── __init__.py
    └── api_response.py
```

## 3.3 前端目录详解

```plaintext
frontend/src/
├── components/
│   ├── ui/                # shadcn/ui 自动生成
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── tabs.tsx
│   │   └── separator.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx    # 左侧菜单
│   │   └── Header.tsx     # 顶部栏
│   └── common/
│       ├── StatusBadge.tsx
│       └── PriorityBadge.tsx
├── pages/
│   ├── Overview.tsx       # 总览
│   ├── ProjectList.tsx    # 项目管理
│   ├── TaskBreakdown.tsx  # AI 任务拆解
│   ├── TaskList.tsx       # 任务管理
│   ├── TaskLogList.tsx    # 进度跟踪
│   ├── SummaryList.tsx    # 总结中心
│   ├── MemberList.tsx     # 成员列表
│   ├── Profile.tsx        # 个人信息
│   └── Login.tsx          # 登录页
├── api/
│   ├── request.ts         # Axios 实例 + 拦截器
│   ├── auth.ts
│   ├── project.ts
│   ├── task.ts
│   ├── taskLog.ts
│   ├── summary.ts
│   ├── overview.ts
│   ├── user.ts
│   └── ai.ts
├── types/
│   ├── index.ts           # 所有类型定义
│   └── api.ts
├── lib/
│   └── utils.ts           # shadcn/ui 工具函数
├── hooks/
│   └── useAuth.ts         # 认证 hook
├── store/
│   └── user.ts            # 用户状态（简单用 localStorage 封装即可）
├── App.tsx
├── main.tsx
└── index.css
```

# 4. 数据库设计

## 4.1 数据库概述

数据库名：flowsync，共 5 张业务表。使用 PostgreSQL 16，通过 SQLAlchemy ORM 操作。

## 4.2 ER 关系

| 关系                              | 说明                                               |
| ------------------------------- | ------------------------------------------------ |
| sys\_user 1:N project\_info     | 一个用户可作为多个项目负责人 (owner\_id)                       |
| sys\_user 1:N task\_info        | 一个用户可负责多个任务 (assignee\_id) 和创建多个任务 (creator\_id) |
| project\_info 1:N task\_info    | 一个项目包含多个任务 (project\_id)                         |
| task\_info 1:N task\_info       | 任务支持父子关系 (parent\_id 自关联)                        |
| task\_info 1:N task\_log        | 一个任务有多条进度记录 (task\_id)                           |
| project\_info 1:N task\_summary | 一个项目有多条总结 (project\_id)                          |
| task\_info 1:N task\_summary    | 一个任务可关联多条总结 (task\_id 可选)                        |

## 4.3 表结构定义（SQLAlchemy 模型）

### 4.3.1 sys\_user（用户表）

```python
from app import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'sys_user'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(100), nullable=False)
    real_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(30), nullable=False)  # 负责人/成员
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(100), nullable=True)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'realName': self.real_name,
            'role': self.role,
            'phone': self.phone,
            'email': self.email,
            'createTime': self.create_time.isoformat() if self.create_time else None
        }
```

### 4.3.2 project\_info（项目表）

```python
from app import db
from datetime import datetime

class ProjectInfo(db.Model):
    __tablename__ = 'project_info'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), nullable=False)  # 未开始/进行中/已完成
    priority = db.Column(db.String(20), nullable=False)  # 低/中/高
    owner_id = db.Column(db.BigInteger, db.ForeignKey('sys_user.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)

    owner = db.relationship('User', backref='projects')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'ownerId': self.owner_id,
            'ownerName': self.owner.real_name if self.owner else None,
            'startDate': self.start_date.isoformat() if self.start_date else None,
            'endDate': self.end_date.isoformat() if self.end_date else None,
            'createTime': self.create_time.isoformat() if self.create_time else None
        }
```

### 4.3.3 task\_info（任务表）

```python
from app import db
from datetime import datetime

class TaskInfo(db.Model):
    __tablename__ = 'task_info'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey('project_info.id'), nullable=False)
    parent_id = db.Column(db.BigInteger, db.ForeignKey('task_info.id'), nullable=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(1000), nullable=True)
    assignee_id = db.Column(db.BigInteger, db.ForeignKey('sys_user.id'), nullable=True)
    creator_id = db.Column(db.BigInteger, db.ForeignKey('sys_user.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # 未开始/进行中/已完成
    priority = db.Column(db.String(20), nullable=False)  # 低/中/高
    due_date = db.Column(db.Date, nullable=True)
    ai_suggestion = db.Column(db.Text, nullable=True)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('ProjectInfo', backref='tasks')
    assignee = db.relationship('User', foreign_keys=[assignee_id], backref='assigned_tasks')
    creator = db.relationship('User', foreign_keys=[creator_id], backref='created_tasks')
    parent = db.relationship('TaskInfo', remote_side=[id], backref='children')

    def to_dict(self):
        return {
            'id': self.id,
            'projectId': self.project_id,
            'parentId': self.parent_id,
            'title': self.title,
            'description': self.description,
            'assigneeId': self.assignee_id,
            'assigneeName': self.assignee.real_name if self.assignee else None,
            'creatorId': self.creator_id,
            'creatorName': self.creator.real_name if self.creator else None,
            'status': self.status,
            'priority': self.priority,
            'dueDate': self.due_date.isoformat() if self.due_date else None,
            'aiSuggestion': self.ai_suggestion,
            'createTime': self.create_time.isoformat() if self.create_time else None
        }
```

### 4.3.4 task\_log（任务进度记录表）

```python
from app import db
from datetime import datetime

class TaskLog(db.Model):
    __tablename__ = 'task_log'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    task_id = db.Column(db.BigInteger, db.ForeignKey('task_info.id'), nullable=False)
    progress_percent = db.Column(db.Integer, nullable=False)
    content = db.Column(db.String(1000), nullable=False)
    operator_id = db.Column(db.BigInteger, db.ForeignKey('sys_user.id'), nullable=False)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)

    task = db.relationship('TaskInfo', backref='logs')
    operator = db.relationship('User', backref='task_logs')

    def to_dict(self):
        return {
            'id': self.id,
            'taskId': self.task_id,
            'taskTitle': self.task.title if self.task else None,
            'progressPercent': self.progress_percent,
            'content': self.content,
            'operatorId': self.operator_id,
            'operatorName': self.operator.real_name if self.operator else None,
            'createTime': self.create_time.isoformat() if self.create_time else None
        }
```

### 4.3.5 task\_summary（总结表）

```python
from app import db
from datetime import datetime

class TaskSummary(db.Model):
    __tablename__ = 'task_summary'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey('project_info.id'), nullable=False)
    task_id = db.Column(db.BigInteger, db.ForeignKey('task_info.id'), nullable=True)
    summary_type = db.Column(db.String(30), nullable=False)  # 阶段总结/最终总结
    content = db.Column(db.String(2000), nullable=False)
    created_by = db.Column(db.BigInteger, db.ForeignKey('sys_user.id'), nullable=False)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('ProjectInfo', backref='summaries')
    task = db.relationship('TaskInfo', backref='summaries')
    creator = db.relationship('User', backref='created_summaries')

    def to_dict(self):
        return {
            'id': self.id,
            'projectId': self.project_id,
            'projectName': self.project.name if self.project else None,
            'taskId': self.task_id,
            'taskTitle': self.task.title if self.task else None,
            'summaryType': self.summary_type,
            'content': self.content,
            'createdBy': self.created_by,
            'creatorName': self.creator.real_name if self.creator else None,
            'createTime': self.create_time.isoformat() if self.create_time else None
        }
```

## 4.4 初始化数据

```python
# 预置 3 个测试用户
# leader / 123456 / 项目负责人 / 负责人
# member1 / 123456 / 张三 / 成员
# member2 / 123456 / 李四 / 成员
```

# 5. 后端架构设计

## 5.1 Flask 应用工厂

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    db.init_app(app)
    CORS(app)

    # 注册蓝图
    from app.controllers.auth_controller import auth_bp
    from app.controllers.project_controller import project_bp
    from app.controllers.task_controller import task_bp
    from app.controllers.task_log_controller import task_log_bp
    from app.controllers.task_summary_controller import task_summary_bp
    from app.controllers.overview_controller import overview_bp
    from app.controllers.user_controller import user_bp
    from app.controllers.ai_controller import ai_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(project_bp, url_prefix='/api/projects')
    app.register_blueprint(task_bp, url_prefix='/api/tasks')
    app.register_blueprint(task_log_bp, url_prefix='/api/task-logs')
    app.register_blueprint(task_summary_bp, url_prefix='/api/summaries')
    app.register_blueprint(overview_bp, url_prefix='/api/overview')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')

    return app
```

## 5.2 配置文件

```python
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'flowsync-secret-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/flowsync'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # DeepSeek API 配置
    DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', '')
    DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
    DEEPSEEK_MODEL = 'deepseek-chat'
```

## 5.3 启动入口

```python
from app import create_app, db

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # TODO: 初始化数据
    app.run(debug=True, port=5000)
```

## 5.4 依赖列表

```plaintext
Flask==3.0.0
Flask-SQLAlchemy==3.1.1
flask-cors==4.0.0
psycopg2-binary==2.9.9
openai==1.12.0
python-dotenv==1.0.0
```

# 6. API 接口设计

## 6.1 接口总览

| 模块 | 接口路径                       | 方法     | 说明                      |
| -- | -------------------------- | ------ | ----------------------- |
| 认证 | /api/auth/login            | POST   | 用户登录                    |
| 项目 | /api/projects              | GET    | 获取项目列表                  |
| 项目 | /api/projects              | POST   | 创建/编辑项目                 |
| 项目 | /api/projects/{id}         | DELETE | 删除项目                    |
| 任务 | /api/tasks                 | GET    | 获取任务列表（可按 projectId 筛选） |
| 任务 | /api/tasks                 | POST   | 创建/编辑任务                 |
| 任务 | /api/tasks/{id}            | DELETE | 删除任务                    |
| 进度 | /api/task-logs             | GET    | 获取进度记录列表（可按 taskId 筛选）  |
| 进度 | /api/task-logs             | POST   | 新增进度记录                  |
| 总结 | /api/summaries             | GET    | 获取总结列表                  |
| 总结 | /api/summaries             | POST   | 新增总结                    |
| 总览 | /api/overview              | GET    | 获取统计信息                  |
| 用户 | /api/users                 | GET    | 获取全部用户列表                |
| 用户 | /api/users/update-password | POST   | 修改密码                    |
| AI | /api/ai/task-suggestion    | POST   | 单任务 AI 建议               |
| AI | /api/ai/task-plan          | POST   | AI 任务拆解                 |
| AI | /api/ai/task-plan/import   | POST   | 导入 AI 拆解任务              |

## 6.2 公共参数

除登录和 AI 接口外，所有需要身份识别的接口通过 `currentUserId` 查询参数传递当前用户 ID。前端 Axios 拦截器自动附加。

## 6.3 认证模块

### POST /api/auth/login

**请求体：**

```json
{
  "username": "leader",
  "password": "123456"
}
```

**响应 data：**

```json
{
  "user": {
    "id": 1,
    "username": "leader",
    "realName": "项目负责人",
    "role": "负责人"
  },
  "token": "simple-token-xxx"
}
```

## 6.4 项目模块

### GET /api/projects

\*\*查询参数：\*\*无

\*\*响应 data：\*\*ProjectInfo 数组，按 id 倒序

### POST /api/projects

**请求体：**

```json
{
  "id": null,
  "name": "项目名称",
  "description": "项目说明",
  "status": "进行中",
  "priority": "高",
  "ownerId": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-06-30"
}
```

id 为空则创建，有值则更新。

### DELETE /api/projects/{id}

直接删除项目（教学简化，不级联删除任务）。

## 6.5 任务模块

### GET /api/tasks

\*\*查询参数：\*\*projectId（可选，按项目筛选）

\*\*响应 data：\*\*TaskInfo 数组，按 id 倒序

### POST /api/tasks

**请求体：**

```json
{
  "id": null,
  "projectId": 1,
  "parentId": null,
  "title": "任务标题",
  "description": "任务说明",
  "assigneeId": 2,
  "status": "未开始",
  "priority": "中",
  "dueDate": "2024-02-01"
}
```

### DELETE /api/tasks/{id}

直接删除任务。

## 6.6 进度记录模块

### GET /api/task-logs

\*\*查询参数：\*\*taskId（可选）

\*\*响应 data：\*\*TaskLog 数组，按 id 倒序

### POST /api/task-logs

**请求体：**

```json
{
  "taskId": 1,
  "progressPercent": 50,
  "content": "完成了需求分析部分",
  "operatorId": 2
}
```

## 6.7 总结模块

### GET /api/summaries

\*\*响应 data：\*\*TaskSummary 数组，按 id 倒序

### POST /api/summaries

**请求体：**

```json
{
  "projectId": 1,
  "taskId": null,
  "summaryType": "阶段总结",
  "content": "第一阶段总结内容...",
  "createdBy": 1
}
```

## 6.8 总览模块

### GET /api/overview

**响应 data：**

```json
{
  "userCount": 10,
  "projectCount": 5,
  "taskCount": 30,
  "summaryCount": 8
}
```

## 6.9 用户模块

### GET /api/users

\*\*响应 data：\*\*User 数组（不含 password 字段）

### POST /api/users/update-password

**请求体：**

```json
{
  "userId": 1,
  "oldPassword": "123456",
  "newPassword": "654321"
}
```

## 6.10 AI 模块

### POST /api/ai/task-suggestion

**请求体：**

```json
{
  "projectName": "项目名",
  "taskTitle": "任务名",
  "taskDescription": "任务说明"
}
```

**响应 data：**

```json
{
  "suggestion": "建议文本内容..."
}
```

### POST /api/ai/task-plan

**请求体：**

```json
{
  "projectId": 1,
  "operatorId": 1,
  "projectName": "项目名",
  "goal": "任务目标",
  "description": "补充说明"
}
```

**响应 data：**

```json
{
  "summary": "总体概述...",
  "items": [
    {
      "title": "任务1",
      "description": "任务说明",
      "priority": "高",
      "suggestedDays": 3,
      "assigneeId": 2
    }
  ]
}
```

### POST /api/ai/task-plan/import

**请求体：**

```json
{
  "projectId": 1,
  "creatorId": 1,
  "items": [
    {
      "title": "任务1",
      "description": "说明",
      "priority": "高",
      "assigneeId": 2
    }
  ]
}
```

\*\*响应 data：\*\*导入成功的任务数量

# 7. AI 能力设计（DeepSeek）

## 7.1 DeepSeek 调用方式

使用 OpenAI 兼容 SDK 调用 DeepSeek API。

```python
from openai import OpenAI
from flask import current_app
import json

class DeepSeekService:
    @staticmethod
    def _get_client():
        return OpenAI(
            api_key=current_app.config['DEEPSEEK_API_KEY'],
            base_url=current_app.config['DEEPSEEK_BASE_URL']
        )

    @staticmethod
    def _get_model():
        return current_app.config['DEEPSEEK_MODEL']
```

## 7.2 单任务建议

```python
SYSTEM_PROMPT_SUGGESTION = """
你是一个简单直接的项目任务助手。请用最容易理解的中文输出，给出：
1. 建议拆分的子任务
2. 执行顺序
3. 风险提醒
控制在300字以内。
"""

@staticmethod
def get_task_suggestion(project_name, task_title, task_description):
    try:
        client = DeepSeekService._get_client()
        user_prompt = f"""
项目名称：{project_name}
任务标题：{task_title}
任务说明：{task_description}
请给出任务建议。
"""
        response = client.chat.completions.create(
            model=DeepSeekService._get_model(),
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_SUGGESTION.strip()},
                {"role": "user", "content": user_prompt.strip()}
            ],
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"AI 建议生成失败：{str(e)}"
```

## 7.3 AI 任务拆解（核心能力）

### 7.3.1 System Prompt

```plaintext
你是一个项目任务拆解助手。请把大任务拆成可以直接执行的小任务。
我会给你可选的成员名单，请为每个任务推荐一个最合适的负责人，
在 assigneeId 字段填写该成员的 id（必须是名单中已有的 id）。

重要：
- 每个任务都必须填写 assigneeId，不能为空
- 同一个人可以负责多个任务
- 只返回严格 JSON，不要解释，不要 markdown

JSON 格式：
{"summary": "...", "items": [{"title": "...", "description": "...", "priority": "高", "suggestedDays": 3, "assigneeId": 1}]}
```

### 7.3.2 User Prompt 模板

```plaintext
项目名称：{projectName}

任务目标：{goal}

补充说明：{description}

可选成员名单（id - 姓名）：
1 - 系统管理员
2 - 项目负责人
3 - 张三
4 - 李四
```

### 7.3.3 处理流程

1. 查询全部用户列表（id + 姓名）
2. 构建 System Prompt + User Prompt
3. 调用 DeepSeek chat.completions.create，要求 JSON 输出
4. 解析返回的 JSON，提取 summary 和 items
5. 校验每个 item 的 assigneeId 是否在用户列表中，不在则兜底替换为第一个用户
6. 返回 AiTaskPlanResponse

### 7.3.4 兜底机制

当 DeepSeek 调用失败或 JSON 解析失败时，自动生成兜底方案：

- 任务1：准备资料（优先级：高）
- 任务2：执行主体（优先级：中）
- 任务3：检查总结（优先级：中）
- assigneeId 留空，由用户导入前手动选择

# 8. 前端架构设计

## 8.1 Axios 封装

```typescript
import axios from 'axios';
import type { ApiResponse } from '@/types/api';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 请求拦截器：附加 currentUserId
request.interceptors.request.use((config) => {
  const userStr = sessionStorage.getItem('currentUser');
  if (userStr) {
    const user = JSON.parse(userStr);
    config.params = {
      ...config.params,
      currentUserId: user.id,
    };
  }
  return config;
});

// 响应拦截器：统一处理
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

export default request;
```

## 8.2 认证状态管理

```typescript
import { useState, useEffect } from 'react';
import type { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const login = (userData: User, token: string) => {
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
    sessionStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('token');
    setUser(null);
  };

  const isLeader = user?.role === '负责人';

  return { user, login, logout, isLeader };
}
```

## 8.3 路由结构

```typescript
// 主布局：侧边栏 + 内容区
// 路由列表：
// /login - 登录页
// /overview - 总览
// /projects - 项目管理
// /task-breakdown - 任务拆解（仅负责人可见）
// /tasks - 任务管理
// /task-logs - 进度跟踪
// /summaries - 总结中心
// /members - 成员列表
// /profile - 个人信息
```

## 8.4 页面组件设计

### 8.4.1 布局组件

- **Sidebar**：左侧导航菜单，根据角色（isLeader）动态显示/隐藏「任务拆解」菜单
- **Header**：顶部栏，显示当前用户、退出登录

### 8.4.2 各页面功能

| 页面                 | 核心组件                | 功能说明                       |
| ------------------ | ------------------- | -------------------------- |
| 总览 Overview        | 4 个 Card 统计卡片       | 展示用户数、项目数、任务数、总结数          |
| 项目管理 ProjectList   | Table + Dialog 表单   | 列表展示、新建/编辑/删除项目（仅负责人可操作）   |
| 任务拆解 TaskBreakdown | Form + Table + 导入按钮 | 选择项目、输入目标、AI 生成拆解结果、勾选导入   |
| 任务管理 TaskList      | 筛选 + Table + Dialog | 按项目筛选、CRUD 任务、成员仅能改自己任务的状态 |
| 进度跟踪 TaskLogList   | 筛选 + Table + Dialog | 按任务筛选、新增进度记录               |
| 总结中心 SummaryList   | Table + Dialog      | 总结列表、新增阶段/最终总结             |
| 成员列表 MemberList    | Table               | 展示所有系统成员                   |
| 个人信息 Profile       | Card + 修改密码表单       | 查看个人资料、修改登录密码              |

## 8.5 权限控制（前端）

- 菜单级：isLeader 为 false 时隐藏「任务拆解」菜单项
- 按钮级：isLeader 为 false 时隐藏新建/编辑/删除按钮
- 表单级：成员编辑任务时，除「状态」字段外全部 disabled
- 后端不做权限校验（教学简化设计）

# 9. 权限设计

## 9.1 角色定义

| 角色值 | 角色名称  | 说明                              |
| --- | ----- | ------------------------------- |
| 负责人 | 项目负责人 | 最高业务权限，可创建/编辑/删除项目和任务，可使用 AI 拆解 |
| 成员  | 普通成员  | 可查看所有数据，可更新自己负责任务的状态，可新增进度和总结   |

## 9.2 权限矩阵

| 功能模块 | 操作         | 负责人 | 成员 |
| ---- | ---------- | --- | -- |
| 总览   | 查看统计       | ✅   | ✅  |
| 项目管理 | 查看列表       | ✅   | ✅  |
| 项目管理 | 新建/编辑/删除   | ✅   | ❌  |
| 任务拆解 | 查看菜单       | ✅   | ❌  |
| 任务拆解 | 生成+导入      | ✅   | ❌  |
| 任务管理 | 查看列表       | ✅   | ✅  |
| 任务管理 | 新建/编辑全部/删除 | ✅   | ❌  |
| 任务管理 | 更新自己任务状态   | ✅   | ✅  |
| 进度跟踪 | 查看+新增      | ✅   | ✅  |
| 总结中心 | 查看+新增      | ✅   | ✅  |
| 成员列表 | 查看         | ✅   | ✅  |
| 个人信息 | 修改密码       | ✅   | ✅  |

# 10. 开发规范

## 10.1 命名规范

- 数据库表名：snake\_case，前缀区分模块（sys\_, task\_ 等）
- 数据库字段：snake\_case
- Python 模型类：PascalCase（User, ProjectInfo）
- Python 方法/变量：snake\_case
- 前端 TypeScript 接口：PascalCase
- 前端组件：PascalCase（ProjectList.tsx）
- API 返回字段：camelCase

## 10.2 前后端字段映射

数据库 snake\_case → 后端 to\_dict() 转换为 camelCase → 前端直接使用 camelCase。

## 10.3 代码分层原则

- **Controller 层**：只负责接收请求、参数校验、调用 Service、返回响应
- **Service 层**：业务逻辑处理、数据组装、事务控制
- **Model 层**：只定义数据结构和 to\_dict 方法，不写业务逻辑

## 10.4 Git 规范（可选）

- main：主分支，稳定代码
- dev：开发分支
- feature/xxx：功能分支

# 11. 项目初始化步骤

## 11.1 数据库初始化

```bash
# 创建数据库
createdb -U postgres flowsync

# 后端启动时自动建表（db.create_all()）
# 然后手动执行初始化数据 SQL
```

## 11.2 后端启动

```bash
cd backend
pip install -r requirements.txt

# 设置环境变量
export DEEPSEEK_API_KEY=your_api_key_here

python run.py
# 启动在 http://localhost:5000
```

## 11.3 前端启动

```bash
cd frontend
npm install

# 初始化 shadcn/ui
npx shadcn@latest init

# 添加需要的组件
npx shadcn@latest add button input table dialog select textarea card badge tabs separator

npm run dev
# 启动在 http://localhost:5173
```

## 11.4 环境变量

后端需要的环境变量：

- `DATABASE_URL`：PostgreSQL 连接串（默认 postgresql://test:postgres\@localhost:5432/flowsync）
- `DEEPSEEK_API_KEY`：DeepSeek API 密钥（必填，否则 AI 功能不可用）
- `SECRET_KEY`：Flask 密钥（可选，有默认值）

\*\*规格说明完毕。\*\*本文档定义了 FlowSync 项目的全部技术规格，所有代码实现需严格遵循此文档。开发时按模块顺序：数据库模型 → Service 层 → Controller 层 → 前端页面 → AI 集成。
