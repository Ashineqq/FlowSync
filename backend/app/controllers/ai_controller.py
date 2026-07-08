import json
import traceback
import httpx
from openai import OpenAI
from flask import Blueprint, request, Response, current_app
from app.common.api_response import ApiResponse
from app.services.deepseek_service import DeepSeekService
from app.services.task_service import TaskService
from app.models.user import User

ai_bp = Blueprint('ai', __name__)


@ai_bp.route('/api/ai/task-suggestion', methods=['POST'])
def get_task_suggestion():
    data = request.get_json()
    project_name = data.get('projectName')
    task_title = data.get('taskTitle')
    task_description = data.get('taskDescription')

    if not project_name or not task_title:
        return ApiResponse.error("项目名称和任务标题不能为空")

    suggestion = DeepSeekService.get_task_suggestion(project_name, task_title, task_description)
    return ApiResponse.success({'suggestion': suggestion})


@ai_bp.route('/api/ai/task-plan', methods=['POST'])
def get_task_plan():
    data = request.get_json()
    project_name = data.get('projectName')
    goal = data.get('goal')
    description = data.get('description')

    if not project_name or not goal:
        return ApiResponse.error("项目名称和目标不能为空")

    plan = DeepSeekService.get_task_plan(project_name, goal, description)
    return ApiResponse.success(plan)


@ai_bp.route('/api/ai/task-plan/stream', methods=['POST'])
def stream_task_plan():
    data = request.get_json()
    print(f"[AI Stream] 收到请求: {json.dumps(data, ensure_ascii=False)}")

    project_name = data.get('projectName')
    goal = data.get('goal')
    description = data.get('description')

    if not project_name or not goal:
        return ApiResponse.error("项目名称和目标不能为空")

    # 在请求上下文中捕获所有配置
    api_key = current_app.config.get('DEEPSEEK_API_KEY', '')
    base_url = current_app.config.get('DEEPSEEK_BASE_URL', '')
    model = current_app.config.get('DEEPSEEK_MODEL', '')

    print(f"[AI Stream] 模型: {model}, API Key: {api_key[:8]}...{api_key[-4:] if len(api_key) > 12 else '(empty)'}")

    if not api_key:
        return ApiResponse.error("未配置 DEEPSEEK_API_KEY")

    # 在请求上下文中查询用户列表
    users = User.query.all()
    users_data = [(u.id, u.real_name) for u in users]
    print(f"[AI Stream] 用户列表: {users_data}")

    print(f"[AI Stream] 开始流式生成: project={project_name}, goal={goal}")

    def generate():
        try:
            client = OpenAI(
                api_key=api_key,
                base_url=base_url,
                http_client=httpx.Client(proxy=None)
            )

            user_list = ", ".join([f"{uid}({name})" for uid, name in users_data])

            system_prompt = """你是一个项目任务拆解助手。请把大任务拆成可以直接执行的小任务。
输出必须是严格的JSON格式：
{
  "summary": "任务拆解总结",
  "items": [
    {
      "title": "子任务标题",
      "description": "子任务描述",
      "priority": "高/中/低",
      "suggestedDays": 3,
      "assigneeId": 1
    }
  ]
}
注意：assigneeId必须从提供的用户列表中选择。"""

            user_prompt = f"项目名称：{project_name}\n目标：{goal}\n描述：{description}\n可分配的用户列表：{user_list}"

            print(f"[AI Stream] 正在调用 API...")
            stream = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                stream=True,
                extra_body={"thinking": {"type": "enabled"}, "reasoning_effort": "high"}
            )
            print(f"[AI Stream] API 调用成功, 开始接收流数据...")

            reasoning_content = ""
            content = ""
            chunk_count = 0

            for chunk in stream:
                chunk_count += 1
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta

                if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
                    reasoning_content += delta.reasoning_content
                    yield f"data: {json.dumps({'type': 'thinking', 'content': delta.reasoning_content}, ensure_ascii=False)}\n\n"

                if delta.content:
                    content += delta.content
                    yield f"data: {json.dumps({'type': 'chunk', 'content': delta.content}, ensure_ascii=False)}\n\n"

                if chunk_count % 20 == 0:
                    print(f"[AI Stream] 已接收 {chunk_count} chunks, thinking={len(reasoning_content)}, content={len(content)}")

            print(f"[AI Stream] 流完毕, 共 {chunk_count} chunks, content前200字: {content[:200]}")

            try:
                result = json.loads(content)
                user_ids = [uid for uid, _ in users_data]
                if 'items' in result:
                    for item in result['items']:
                        if item.get('assigneeId') not in user_ids:
                            item['assigneeId'] = user_ids[0] if user_ids else None
                print(f"[AI Stream] JSON 解析成功, {len(result.get('items', []))} 个任务")
                yield f"data: {json.dumps({'type': 'done', 'content': result}, ensure_ascii=False)}\n\n"
            except json.JSONDecodeError as e:
                print(f"[AI Stream] JSON 解析失败: {e}")
                yield f"data: {json.dumps({'type': 'done', 'content': DeepSeekService._get_default_plan()}, ensure_ascii=False)}\n\n"

        except Exception as e:
            print(f"[AI Stream] 异常: {type(e).__name__}: {e}")
            traceback.print_exc()
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)}, ensure_ascii=False)}\n\n"

        yield "data: [DONE]\n\n"

    return Response(generate(), mimetype='text/event-stream',
                    headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})


@ai_bp.route('/api/ai/task-plan/import', methods=['POST'])
def import_task_plan():
    data = request.get_json()
    project_id = data.get('projectId')
    creator_id = data.get('creatorId')
    items = data.get('items', [])

    if not project_id or not creator_id:
        return ApiResponse.error("项目ID和创建者ID不能为空")

    count = 0
    for item in items:
        task_data = {
            'projectId': project_id,
            'title': item.get('title'),
            'description': item.get('description'),
            'priority': item.get('priority', '中'),
            'assigneeId': item.get('assigneeId'),
            'creatorId': creator_id,
            'status': '未开始'
        }
        TaskService.create(task_data)
        count += 1

    return ApiResponse.success({'count': count}, f"成功导入{count}个任务")
