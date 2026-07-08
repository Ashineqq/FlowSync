from app.models.user import User


def get_current_user_args():
    """从请求参数中获取当前用户ID和角色，返回 (current_user_id, is_leader)"""
    from flask import request
    user_id = request.args.get('currentUserId', type=int)
    if not user_id:
        return None, False
    user = User.query.get(user_id)
    if not user:
        return None, False
    return user.id, user.role == '负责人'
