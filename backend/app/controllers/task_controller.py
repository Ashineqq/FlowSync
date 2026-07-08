from flask import Blueprint, request
from app.common.api_response import ApiResponse
from app.common.auth import get_current_user_args
from app.services.task_service import TaskService

task_bp = Blueprint('task', __name__)


@task_bp.route('/api/tasks', methods=['GET'])
def get_tasks():
    project_id = request.args.get('projectId')
    current_user_id, is_leader = get_current_user_args()
    tasks = TaskService.get_all(project_id, current_user_id, is_leader)
    return ApiResponse.success(tasks)


@task_bp.route('/api/tasks', methods=['POST'])
def save_task():
    data = request.get_json()
    if data.get('id'):
        result = TaskService.update(data)
        if not result:
            return ApiResponse.error("任务不存在")
        return ApiResponse.success(result, "更新成功")
    else:
        result = TaskService.create(data)
        return ApiResponse.success(result, "创建成功")


@task_bp.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    if TaskService.delete(task_id):
        return ApiResponse.success(message="删除成功")
    return ApiResponse.error("任务不存在")
