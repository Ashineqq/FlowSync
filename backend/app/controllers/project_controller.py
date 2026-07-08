from flask import Blueprint, request
from app.common.api_response import ApiResponse
from app.common.auth import get_current_user_args
from app.services.project_service import ProjectService

project_bp = Blueprint('project', __name__)


@project_bp.route('/api/projects', methods=['GET'])
def get_projects():
    current_user_id, is_leader = get_current_user_args()
    projects = ProjectService.get_all(current_user_id, is_leader)
    return ApiResponse.success(projects)


@project_bp.route('/api/projects', methods=['POST'])
def save_project():
    data = request.get_json()
    if data.get('id'):
        result = ProjectService.update(data)
        if not result:
            return ApiResponse.error("项目不存在")
        return ApiResponse.success(result, "更新成功")
    else:
        result = ProjectService.create(data)
        return ApiResponse.success(result, "创建成功")


@project_bp.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    if ProjectService.delete(project_id):
        return ApiResponse.success(message="删除成功")
    return ApiResponse.error("项目不存在")
