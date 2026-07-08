from flask import Blueprint, request
from app.common.api_response import ApiResponse
from app.common.auth import get_current_user_args
from app.services.task_log_service import TaskLogService

task_log_bp = Blueprint('task_log', __name__)


@task_log_bp.route('/api/task-logs', methods=['GET'])
def get_task_logs():
    task_id = request.args.get('taskId')
    current_user_id, is_leader = get_current_user_args()
    logs = TaskLogService.get_all(task_id, current_user_id, is_leader)
    return ApiResponse.success(logs)


@task_log_bp.route('/api/task-logs', methods=['POST'])
def create_task_log():
    data = request.get_json()
    result = TaskLogService.create(data)
    return ApiResponse.success(result, "创建成功")
