---
name: deployment
description: 全栈部署指南 Vercel+Render+PostgreSQL — 选型对比、部署步骤、8 个踩坑记录
---

# Full-Stack Deployment Guide

FlowSync 项目完整部署经验总结（Vercel + Render + Neon/PostgreSQL）。

> 记录了从 Zeabur → Fly.io → Render 的选型过程及所有踩坑点。

---

## 一、架构选型（最终方案）

```
用户 → Vercel (前端 SPA)
         │
         │ /api/* → rewrite
         ▼
       Render (后端 Flask + Gunicorn)
         │
         │ postgresql+psycopg:// (internal)
         ▼
       Render PostgreSQL
```

| 层 | 平台 | 费用 | 原因 |
|----|------|------|------|
| 前端 | **Vercel** | 免费 | 原生支持 Vite，GitHub 自动部署，100GB 带宽 |
| 后端 | **Render** | 免费（休眠） | 原生 Python 支持，无需 Docker，新加坡节点 |
| 数据库 | **Render PostgreSQL** | 免费（1GB） | 和内网互通，延迟最低 |

---

## 二、完整部署步骤

### 步骤 1：数据库

1. Render Dashboard → **New +** → **PostgreSQL**
2. Region: **Singapore**
3. Plan: **Free**
4. 创建后拿 **Internal Database URL**（形如 `postgresql://user:pass@dpg-xxx.internal:5432/dbname`）
5. 加上 `+psycopg` 改为：`postgresql+psycopg://user:pass@dpg-xxx.internal:5432/dbname`

### 步骤 2：后端

1. Render Dashboard → **New +** → **Web Service** → 连 GitHub
2. 配置：

| 配置项 | 值 |
|--------|-----|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
| Plan | **Free** |
| Region | **Singapore** |

3. 环境变量（3 条）：

| 变量 | 值 |
|------|-----|
| `DATABASE_URL` | `postgresql+psycopg://user:pass@dpg-xxx.internal:5432/dbname` |
| `SECRET_KEY` | 随机字符串 |
| `DEEPSEEK_API_KEY` | 留空（用户页面配置） |

### 步骤 3：前端

1. Vercel Dashboard → Import Git Repository
2. Root Directory: `frontend`
3. 创建 `vercel.json`：

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://你的后端.onrender.com/api/:path*"
    }
  ]
}
```

### 步骤 4：后续更新

```bash
# 改前端 → push GitHub，Vercel 自动部署
git push origin main

# 改后端 → push GitHub，Render 自动重新构建
git push origin main
```

---

## 三、踩坑记录

### 🕳️ 坑 1：psycopg2-binary 编译失败

**现象**：`pip install psycopg2-binary` 时报 `gcc` 编译错误，`wheel` 构建失败。

**原因**：`psycopg2-binary` 在部分 Python 版本/架构上需要从源码编译，依赖 `libpq-dev` + `gcc`。

**修复**：改用 `psycopg[binary]>=3.2`（psycopg 3），纯二进制 wheel 无需编译。

```txt
# ✅ 正确
psycopg[binary]>=3.2

# ❌ 错误（编译失败）
psycopg2-binary==2.9.9
```

### 🕳️ 坑 2：DATABASE_URL 必须加 `+psycopg`

**现象**：SQLAlchemy 报错找不到数据库驱动。

**原因**：`psycopg[binary]` 是 psycopg 3，SQLAlchemy 需要 `postgresql+psycopg://` 前缀来识别驱动。直接用 `postgresql://` 会去找 `psycopg2`（未安装）。

```txt
# ✅ 正确
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db

# ❌ 错误
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### 🕳️ 坑 3：Fly.io 需要信用卡验证

**现象**：`fly launch` 报错 `requested machine count exceeds organization limit`，提示需添加支付方式。

**替代方案**：改用 **Render**，免费方案无需信用卡，原生 Python + PostgreSQL 支持。

### 🕳️ 坑 4：Zeabur gunicorn 入口点错误

**现象**：`Failed to find attribute 'app' in 'app'`

**原因**：Zeabur 自动检测到 `app/` 目录作为 Python 包，执行 `gunicorn app:app`，但 `app/__init__.py` 中没有模块级的 `app` 变量（只有 `create_app()` 函数）。

**修复**：在 `app/__init__.py` 末尾添加 `app = create_app()`。

### 🕳️ 坑 5：`run.py` 的建表逻辑在 gunicorn 下不执行

**现象**：部署后数据库表不存在。

**原因**：`db.create_all()` 和 `seed_data()` 原来在 `run.py` 的模块级执行，但 gunicorn 加载的是 `app:app`（直接从 `app/__init__.py`），不经过 `run.py`。

**修复**：将建表和种子数据逻辑移到 `app/__init__.py` 末尾（在 `app = create_app()` 之后）。

### 🕳️ 坑 6：Render Internal vs External Database URL

**现象**：连接数据库超时。

**原因**：后端和数据库都在 Render 同一区域，应该用 **Internal Database URL**（内网地址，`.internal` 后缀），而不是 External URL（公网地址）。

**原则**：同一 Render 区域内的服务用 Internal URL，跨区域/外部访问用 External URL。

### 🕳️ 坑 7：Vercel API 代理（rewrite）

**现象**：前端能打开，但登录/数据请求 404。

**原因**：前端是 SPA 部署在 Vercel，API 请求 `/api/*` 需要 rewrite 到 Render 后端。没有 `vercel.json` 的 rewrite 配置就会 404。

**修复**：`vercel.json` 中配置 source/destination rewrite。

### 🕳️ 坑 8：Zeabur PostgreSQL 镜像拉取失败

**现象**：`Image pull failed`（postgres:latest）

**原因**：Zeabur 默认 PostgreSQL 镜像 tag 为 `latest`（即 18），该版本镜像不存在。

**修复**：镜像 tag 改为 `16-alpine`。

---

## 四、关键文件清单

| 文件 | 用途 |
|------|------|
| `backend/app/__init__.py` | Flask 应用工厂 + `app = create_app()` + 建表+种子数据 |
| `backend/requirements.txt` | 依赖列表（psycopg[binary] 而非 psycopg2） |
| `backend/Procfile` | Render/Zeabur 用（gunicorn app:app） |
| `frontend/vercel.json` | Vercel rewrites 配置（/api/* → Render 后端） |
| `backend/Dockerfile.fly` | Fly.io 用（选 Render 后弃用） |

---

## 五、费用对比

| 平台 | 免费额度 | 超出费用 | 信用卡 |
|------|---------|---------|--------|
| **Vercel** | 100GB 带宽/月 | 很少超 | 不需要 |
| **Render** | 1GB DB + Web Service（休眠） | $7/月起 | 不需要（免费方案） |
| Fly.io | 3 台共享 VM + 3GB 存储 | ~$2-3/月 | **需要** |
| Zeabur | ~$5 免费额度 | 后付费 | 需要 |
| Neon | 0.5GB DB + 100h 计算/月 | $19/月起 | 不需要 |
