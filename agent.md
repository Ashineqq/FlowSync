# FlowSync Agent Guidelines

This document provides rules and context for AI agents working on the FlowSync project.

## Project Overview

FlowSync is a team task management system for educational scenarios. Tech stack: React + Flask + PostgreSQL + DeepSeek AI.

## Architecture

```
frontend/  → Vite + React 18 + TypeScript + Tailwind CSS 4 + shadcn/ui (Base UI)
backend/   → Flask + SQLAlchemy + psycopg v3 + OpenAI SDK (DeepSeek)
```

- Frontend runs on port 5173, proxies `/api` to backend on port 5000
- Backend uses `postgresql+psycopg://` connection string (not psycopg2)
- Authentication: simplified token, `currentUserId` passed via Axios interceptor as query param

## Critical Rules

### Backend

1. **Python 3.14 compatibility:** Use `psycopg[binary]` NOT `psycopg2-binary`. Connection string must be `postgresql+psycopg://`.
2. **openai SDK proxy:** Pass `http_client=httpx.Client(proxy=None)` to avoid `proxies` parameter error.
3. **DeepSeek thinking mode:** Use `extra_body={"thinking": {"type": "enabled"}, "reasoning_effort": "high"}`. Do NOT pass `reasoning_effort` as a top-level parameter.
4. **Flask streaming context:** `generate()` generators lose `current_app` context. Capture all config and DB queries BEFORE entering the generator, pass via closure.
5. **to_dict() naming:** All fields must be camelCase. Include related object display names (e.g., `taskTitle`, `projectName`, `creatorName`).
6. **Permission filtering:** Always in Service layer, never in Controller. Use `current_user_id` and `is_leader` parameters.

### Frontend

1. **Tailwind CSS 4:** No `tailwind.config.js`. Use `@theme` in CSS. Import via `@tailwindcss/vite` plugin.
2. **shadcn/ui uses Base UI, NOT Radix UI.** Select needs `items` prop on Root. `onValueChange` type is `(value: string | null) => void`.
3. **Single BrowserRouter:** Only ONE `BrowserRouter` in `App.tsx`. Never create multiple routers.
4. **Auth state:** Use `React Context` via `AuthProvider`. All components share one auth state.
5. **Form validation:** Use `react-hook-form` + `zod` + `Field`/`FieldLabel`/`FieldError` components. Required fields use `<FieldLabel required>`.
6. **Select components:** Always use `<Field>` wrapper with `<FieldLabel>`. Add `className="w-full"` to `SelectTrigger`.
7. **Toast notifications:** Use `sonner`'s `toast`. Never use `alert()`.
8. **AI streaming state:** Use module-level store + `useSyncExternalStore` (not useState) so streaming persists across page navigation.
9. **Date picker:** Use custom `DatePicker` component (Popover + Calendar), not `<input type="date">`.

## API Conventions

- All responses use `{ success: boolean, message: string, data: T | null }` format
- Create/update endpoints use `id` field: `null` = create, has value = update
- GET endpoints read `currentUserId` from query params for permission filtering
- Member visibility rules:
  - Projects: owner_id = currentUserId OR has tasks assigned to currentUserId
  - Tasks: creator_id = currentUserId OR assignee_id = currentUserId
  - Task logs: for tasks where user is creator or assignee
  - Summaries: for tasks where user is creator/assignee, OR summary created_by currentUserId

## File Paths

- Backend entry: `backend/run.py`
- Frontend entry: `frontend/src/main.tsx`
- App routes: `frontend/src/App.tsx`
- Auth hook: `frontend/src/hooks/useAuth.tsx`
- AI streaming store: `frontend/src/store/taskBreakdown.ts`
- API request config: `frontend/src/api/request.ts`
- Field components: `frontend/src/components/ui/field.tsx`

## Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| `psycopg2-binary` compile error on Python 3.14 | No pre-built wheel | Use `psycopg[binary]` |
| `TypeError: proxies` in openai SDK | System proxy env vars | `http_client=httpx.Client(proxy=None)` |
| Login redirect not working | Multiple BrowserRouter instances | Single router in App |
| Select not showing selected label | Missing `items` prop on Root | Add `items={[{label, value}]}` |
| AI stream breaks on page navigate | Component unmount kills fetch | Module-level store with useSyncExternalStore |
| `Working outside of application context` | Generator runs after request context popped | Capture config before generator |
| `FieldLabel` and input too close | Missing `leading-relaxed pb-1` | Use FieldLabel component with proper styling |
| Toast notifications not showing | Missing Toaster in App | Add `<Toaster richColors />` to App.tsx |

## Seed Data

Three test users (auto-created on first run):
- `leader` / `123456` / 项目负责人 / 负责人
- `member1` / `123456` / 张三 / 成员
- `member2` / `123456` / 李四 / 成员

## Environment Variables

Backend:
- `DATABASE_URL`: PostgreSQL connection (default: `postgresql+psycopg://postgres:postgres@localhost:5432/flowsync`)
- `DEEPSEEK_API_KEY`: DeepSeek API key (required for AI features)
- `SECRET_KEY`: Flask secret (optional, has default)
