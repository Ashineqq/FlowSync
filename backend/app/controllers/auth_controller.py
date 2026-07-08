from flask import Blueprint, request
from app.common.api_response import ApiResponse
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return ApiResponse.error("用户名和密码不能为空")

    result = AuthService.login(username, password)
    if not result:
        return ApiResponse.error("用户名或密码错误")

    return ApiResponse.success(result)
