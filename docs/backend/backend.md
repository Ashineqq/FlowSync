# FlowSync 后端开发文档

## 1. 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.12 | 运行环境 |
| Flask | 3.x | Web 框架 |
| Flask-SQLAlchemy | 3.x | ORM |
| Flask-CORS | latest | 跨域处理 |
| psycopg[binary] (v3) | >=3.2 | PostgreSQL 驱动 |
| openai | latest | DeepSeek API 调用 |
| httpx | latest | HTTP 客户端（绕过代理问题） |
| gunicorn | 23.x | 生产级 WSGI 服务器 |

## 2. 项目结构

```
backend/
├── app/
│   ├── __init__.py            # Flask 应用工厂 + 建表 + 种子数据
│   ├── common/
│   │   ├── __init__.py
│   │   ├── api_response.py    # 统一响应格式
│   │   └── auth.py            # 当前用户信息提取工具
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py            # 用户表
│   │   ├── project.py         # 项目表
│   │   ├── task.py            # 任务表
│   │   ├── task_log.py        # 进度记录表
│   │   └── task_summary.py    # 总结表
│   ├── controllers/
│   │   ├── __init__.py
│   │   ├── auth_controller.py
│   │   ├── project_controller.py
│   │   ├── task_controller.py
│   │   ├── task_log_controller.py
│   │   ├── task_summary_controller.py
│   │   ├── overview_controller.py
│   │   ├── user_controller.py
│   │   └── ai_controller.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── project_service.py
│   │   ├── task_service.py
│   │   ├── task_log_service.py
│   │   ├── task_summary_service.py
│   │   ├── overview_service.py
│   │   ├── user_service.py
│   │   └── deepseek_service.py
│   └── dto/
│       └── ...
├── config.py                  # 配置文件
├── Procfile                   # Render/gunicorn 启动配置
├── run.py                     # 本地开发入口（从 app 导入）
└── requirements.txt
```

## 3. 架构设计

### 3.1 三层架构

```
Controller（接收请求/参数校验/调用Service/返回响应）
    ↓
Service（业务逻辑/数据组装/事务控制）
    ↓
Model（数据结构/to_dict 方法）
```

**原则：**
- Controller 不写业务逻辑，只做路由分发
- Service 处理所有业务逻辑和数据过滤
- Model 只定义表结构和 `to_dict()`，不写查询逻辑

### 3.2 统一响应格式

```python
class ApiResponse:
    @staticmethod
    def success(data=None, message="操作成功"):
        return jsonify({"success": True, "message": message, "data": data})
    @staticmethod
    def error(message="操作失败"):
        return jsonify({"success": False, "message": message, "data": None})
```

前端 Axios 拦截器直接解析 `response.data`，所有接口返回格式一致。

### 3.3 权限过滤模式

权限控制在 **Service 层**实现，通过 `currentUserId` 和 `isLeader` 参数控制：

```python
# 控制器中提取用户信息
current_user_id, is_leader = get_current_user_args()

# 服务层中过滤数据
def get_all(current_user_id=None, is_leader=True):
    query = Model.query
    if not is_leader and current_user_id:
        query = query.filter(...)  # 成员只看自己的数据
    return query.all()
```

## 4. 数据库设计

### 4.1 表结构

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| sys_user | 用户 | username, password, real_name, role |
| project_info | 项目 | name, status, priority, owner_id |
| task_info | 任务 | project_id, parent_id, assignee_id, creator_id |
| task_log | 进度 | task_id, progress_percent, content, operator_id |
| task_summary | 总结 | project_id, task_id, summary_type, content, created_by |

### 4.2 字段映射规则

数据库 snake_case → `to_dict()` 转换为 camelCase → 前端直接使用 camelCase。

### 4.3 to_dict() 规范

每个 Model 的 `to_dict()` 需要：
- 字段名使用 camelCase（如 `projectId` 而非 `project_id`）
- 关联对象只取显示用字段（如 `task.title` → `taskTitle`）
- 日期格式化为字符串
- `creatorName` / `operatorName` 等显示字段必须包含

## 5. API 接口设计

### 5.1 接口总览

| 模块 | 接口 | 方法 | 权限 |
|------|------|------|------|
| 认证 | /api/auth/login | POST | 公开 |
| 项目 | /api/projects | GET/POST | 所有 |
| 项目 | /api/projects/{id} | DELETE | 所有 |
| 任务 | /api/tasks | GET/POST | 所有 |
| 任务 | /api/tasks/{id} | DELETE | 所有 |
| 进度 | /api/task-logs | GET/POST | 所有 |
| 总结 | /api/summaries | GET/POST | 所有 |
| 总览 | /api/overview | GET | 所有 |
| 用户 | /api/users | GET/POST | GET:所有, POST:负责人 |
| 用户 | /api/users/{id} | PUT | 负责人/本人 |
| 用户 | /api/users/update-password | POST | 所有 |
| AI | /api/ai/task-suggestion | POST | 负责人 |
| AI | /api/ai/task-plan | POST | 负责人 |
| AI | /api/ai/task-plan/stream | POST | 负责人 |
| AI | /api/ai/task-plan/import | POST | 负责人 |

### 5.2 认证方式

简化 token 认证：
- 登录返回 `simple-token-xxx` 格式的 token
- 前端通过 Axios 拦截器自动附加 `currentUserId` 查询参数
- 后端从 `request.args.get('currentUserId')` 获取当前用户
- `app/common/auth.py` 提供 `get_current_user_args()` 工具函数

### 5.3 创建/更新接口规范

使用 `id` 字段区分创建和更新：
```json
// 创建
{"id": null, "name": "...", ...}
// 更新
{"id": 123, "name": "...", ...}
```

## 6. 权限模型

### 6.1 角色定义

| 角色 | 说明 |
|------|------|
| 负责人 | 最高权限，可操作所有数据 |
| 成员 | 只能操作和查看自己有权限的数据 |

### 6.2 权限矩阵

| 模块 | 负责人 | 成员 |
|------|--------|------|
| 项目管理 | 所有项目，可新建/编辑/删除 | 自己创建的 + 有任务分配给自己的项目，可新建，不可编辑/删除 |
| 任务管理 | 所有任务，可新建/编辑/删除 | 创建人或负责人是自己的任务，仅可改状态 |
| 任务拆解 | 可见所有项目，可使用 AI | 可见自己创建的项目，不可使用 AI |
| 进度跟踪 | 所有进度记录 | 自己有权限的任务的进度 |
| 总结中心 | 所有总结 | 自己有权限的任务的总结 + 自己创建的总结 |
| 成员列表 | 可添加/编辑所有成员 | 只能编辑自己 |
| 个人信息 | 修改密码 | 修改密码 |

## 7. AI 集成（DeepSeek）

### 7.1 模型配置

- 模型：`deepseek-v4-flash`
- API 地址：`https://api.deepseek.com`
- 思考模式：开启 `{"thinking": {"type": "enabled"}, "reasoning_effort": "high"}`

### 7.2 流式输出

使用 SSE（Server-Sent Events）实现流式输出：
- 前端通过 `fetch` + `ReadableStream` 消费
- 后端通过 `Response(generate(), mimetype='text/event-stream')` 返回
- 事件类型：`thinking`（思维链）、`chunk`（最终回答）、`done`（完成）、`error`（错误）

### 7.3 API Key 来源

**当前方案：** API Key 不再从环境变量读取。前端在「个人信息」页面将 Key 存入 `localStorage`，请求时通过请求头 `x-deepseek-api-key` 发送。

后端优先读取请求头中的 Key：

```python
api_key = request.headers.get('x-deepseek-api-key', '')
```

如请求头为空，直接返回错误，不再 fallback 到环境变量。

### 7.4 流式输出的关键坑

**Flask 生成器的上下文丢失问题：**

`generate()` 是惰性生成器，Flask 迭代它时请求上下文已释放，`current_app` 不可用。

**解决方案：** 在请求上下文中预先捕获所有配置和查询结果，通过闭包传入生成器：

```python
# 在请求上下文中捕获
api_key = current_app.config.get('DEEPSEEK_API_KEY', '')
users = User.query.all()

# 通过闭包传入生成器
def generate():
    client = OpenAI(api_key=api_key, ...)
    # 不再需要 current_app
```

### 7.5 openai SDK 版本兼容

**问题：** `reasoning_effort` 作为顶层参数不被旧版 SDK 支持。

**解决方案：** 放入 `extra_body`：

```python
extra_body={"thinking": {"type": "enabled"}, "reasoning_effort": "high"}
```

## 8. 踩过的坑

### 8.1 psycopg2 编译失败（Python 3.14）

**问题：** `psycopg2-binary` 没有 Python 3.14 的预编译 wheel。

**解决方案：** 改用 `psycopg[binary]==3.1.18`，连接协议改为 `postgresql+psycopg://`。

### 8.2 openai SDK proxy 参数报错

**问题：** 系统有代理环境变量，新版 openai SDK 不再接受 `proxies` 参数。

**解决方案：** 传入 `httpx.Client(proxy=None)`：

```python
http_client=httpx.Client(proxy=None)
```

### 8.3 Model.to_dict() 缺少字段

**问题：** `TaskLog.to_dict()` 缺少 `taskTitle`，`TaskSummary.to_dict()` 缺少 `projectName` 和 `taskTitle`，且 `createdByName` 命名与前端不一致。

**解决方案：** `to_dict()` 中补充所有前端需要的显示字段，命名统一为 camelCase。

## 9. 启动方式

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 设置环境变量
export DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/flowsync
# 注意：DEEPSEEK_API_KEY 不再从环境变量读取，用户在前端页面中配置

# 启动
python run.py
```

启动时自动建表和种子数据（leader/member1/member2 三个用户）。

### 9.1 部署

项目部署使用 **Render（后端 + PostgreSQL）+ Vercel（前端）**。

部署配置文件：
- `Procfile` — gunicorn 启动入口 `app:app`
- `Dockerfile.fly` — 备用（Fly.io 用）

详见 [skills/deployment/SKILL.md](../skills/deployment/SKILL.md)。

## 10. 开发规范

1. **命名规范：** 表名 snake_case，Model 类 PascalCase，字段 snake_case
2. **字段映射：** 数据库 snake_case → `to_dict()` 转 camelCase
3. **代码分层：** Controller 只做路由分发，Service 处理业务逻辑，Model 只定义结构
4. **权限过滤：** 统一在 Service 层实现，通过 `current_user_id` 和 `is_leader` 参数控制
5. **新增接口：** 必须在 Service 层实现业务逻辑，Controller 只做参数校验和调用
