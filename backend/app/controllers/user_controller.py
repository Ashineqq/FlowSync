from flask import Blueprint, request
from app.common.api_response import ApiResponse
from app.common.auth import get_current_user_args
from app.services.user_service import UserService

user_bp = Blueprint('user', __name__)


@user_bp.route('/api/users', methods=['GET'])
def get_users():
    users = UserService.get_all()
    return ApiResponse.success(users)


@user_bp.route('/api/users', methods=['POST'])
def create_user():
    current_user_id, is_leader = get_current_user_args()
    if not is_leader:
        return ApiResponse.error("只有负责人可以添加成员")
    data = request.get_json()
    result, message = UserService.create(data)
    if not result:
        return ApiResponse.error(message)
    return ApiResponse.success(result, message)


@user_bp.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    current_user_id, is_leader = get_current_user_args()
    if not is_leader and current_user_id != user_id:
        return ApiResponse.error("只能编辑自己的信息")
    data = request.get_json()
    result, message = UserService.update(user_id, data)
    if not result:
        return ApiResponse.error(message)
    return ApiResponse.success(result, message)


@user_bp.route('/api/users/update-password', methods=['POST'])
def update_password():
    data = request.get_json()
    user_id = data.get('userId')
    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')

    if not user_id or not old_password or not new_password:
        return ApiResponse.error("参数不完整")

    result, message = UserService.update_password(user_id, old_password, new_password)
    if not result:
        return ApiResponse.error(message)

    return ApiResponse.success(result, message)
