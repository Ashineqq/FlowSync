import json
import httpx
from openai import OpenAI
from flask import current_app
from app.models.user import User


class DeepSeekService:
    @staticmethod
    def get_client():
        return OpenAI(
            api_key=current_app.config['DEEPSEEK_API_KEY'],
            base_url=current_app.config['DEEPSEEK_BASE_URL'],
            http_client=httpx.Client(proxy=None)
        )

    @staticmethod
    def get_task_suggestion(project_name, task_title, task_description):
        api_key = current_app.config.get('DEEPSEEK_API_KEY', '')
        if not api_key:
            return "AI建议不可用：未配置 DEEPSEEK_API_KEY"
        try:
            client = DeepSeekService.get_client()
            response = client.chat.completions.create(
                model=current_app.config['DEEPSEEK_MODEL'],
                messages=[
                    {"role": "system", "content": "你是一个项目任务分析助手，请根据项目和任务信息给出合理的任务建议。"},
                    {"role": "user", "content": f"项目：{project_name}\n任务：{task_title}\n描述：{task_description}\n请给出任务执行建议，包括注意事项和关键步骤。"}
                ],
                extra_body={"thinking": {"type": "enabled"}, "reasoning_effort": "high"}
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"AI建议生成失败：{str(e)}"

    @staticmethod
    def get_task_plan(project_name, goal, description):
        api_key = current_app.config.get('DEEPSEEK_API_KEY', '')
        if not api_key:
            print("[DeepSeek ERROR] DEEPSEEK_API_KEY is not set")
            return DeepSeekService._get_default_plan()
        try:
            client = DeepSeekService.get_client()
            users = User.query.all()
            user_list = ", ".join([f"{u.id}({u.real_name})" for u in users])

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

            response = client.chat.completions.create(
                model=current_app.config['DEEPSEEK_MODEL'],
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                extra_body={"thinking": {"type": "enabled"}, "reasoning_effort": "high"}
            )

            result = json.loads(response.choices[0].message.content)
            result = DeepSeekService._validate_plan(result, users)
            return result
        except Exception as e:
            print(f"[DeepSeek ERROR] {type(e).__name__}: {e}")
            return DeepSeekService._get_default_plan()

    @staticmethod
    def stream_task_plan(project_name, goal, description):
        api_key = current_app.config.get('DEEPSEEK_API_KEY', '')
        model = current_app.config.get('DEEPSEEK_MODEL', '')
        print(f"[DeepSeek Stream] 模型: {model}, API Key: {api_key[:8]}...{api_key[-4:] if len(api_key) > 12 else '(empty)'}")

        if not api_key:
            print("[DeepSeek Stream] API Key 未配置")
            yield {'type': 'error', 'content': '未配置 DEEPSEEK_API_KEY'}
            return

        client = DeepSeekService.get_client()
        users = User.query.all()
        user_list = ", ".join([f"{u.id}({u.real_name})" for u in users])
        print(f"[DeepSeek Stream] 用户列表: {user_list}")

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

        try:
            print(f"[DeepSeek Stream] 正在调用 API...")
            stream = client.chat.completions.create(
                model=current_app.config['DEEPSEEK_MODEL'],
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                stream=True,
                extra_body={"thinking": {"type": "enabled"}, "reasoning_effort": "high"}
            )
            print(f"[DeepSeek Stream] API 调用成功, 开始接收流数据...")

            reasoning_content = ""
            content = ""
            chunk_count = 0

            for chunk in stream:
                chunk_count += 1
                if not chunk.choices:
                    print(f"[DeepSeek Stream] chunk #{chunk_count}: 无 choices")
                    continue
                delta = chunk.choices[0].delta

                # 思维链内容
                if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
                    reasoning_content += delta.reasoning_content
                    yield {'type': 'thinking', 'content': delta.reasoning_content}

                # 最终回答内容
                if delta.content:
                    content += delta.content
                    yield {'type': 'chunk', 'content': delta.content}

                if chunk_count % 20 == 0:
                    print(f"[DeepSeek Stream] 已接收 {chunk_count} 个 chunks, thinking={len(reasoning_content)} chars, content={len(content)} chars")

            print(f"[DeepSeek Stream] 流接收完毕, 共 {chunk_count} chunks, thinking={len(reasoning_content)} chars, content={len(content)} chars")
            print(f"[DeepSeek Stream] content 前200字: {content[:200]}")

            # 解析最终结果
            try:
                result = json.loads(content)
                result = DeepSeekService._validate_plan(result, users)
                print(f"[DeepSeek Stream] JSON 解析成功, {len(result.get('items', []))} 个任务")
                yield {'type': 'done', 'content': result}
            except json.JSONDecodeError as e:
                print(f"[DeepSeek Stream] JSON 解析失败: {e}, 使用兜底方案")
                yield {'type': 'done', 'content': DeepSeekService._get_default_plan()}

        except Exception as e:
            print(f"[DeepSeek Stream ERROR] {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            yield {'type': 'done', 'content': DeepSeekService._get_default_plan()}

    @staticmethod
    def _validate_plan(plan, users):
        user_ids = [u.id for u in users]
        if 'items' in plan:
            for item in plan['items']:
                if item.get('assigneeId') not in user_ids:
                    item['assigneeId'] = user_ids[0] if user_ids else None
        return plan

    @staticmethod
    def _get_default_plan():
        return {
            "summary": "任务自动拆解（AI服务不可用）",
            "items": [
                {
                    "title": "准备资料",
                    "description": "收集和准备项目所需的相关资料",
                    "priority": "高",
                    "suggestedDays": 2,
                    "assigneeId": 1
                },
                {
                    "title": "执行主体",
                    "description": "完成项目的主要工作内容",
                    "priority": "中",
                    "suggestedDays": 5,
                    "assigneeId": 1
                },
                {
                    "title": "检查总结",
                    "description": "检查工作成果并进行总结",
                    "priority": "中",
                    "suggestedDays": 2,
                    "assigneeId": 1
                }
            ]
        }
