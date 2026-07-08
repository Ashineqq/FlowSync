from app import db
from app.models.user import User


class UserService:
    @staticmethod
    def get_all():
        users = User.query.all()
        return [u.to_dict() for u in users]

    @staticmethod
    def create(data):
        username = data.get('username')
        if not username:
            return None, "用户名不能为空"
        if User.query.filter_by(username=username).first():
            return None, "用户名已存在"
        user = User(
            username=username,
            password=data.get('password', '123456'),
            real_name=data.get('realName'),
            role=data.get('role', '成员'),
        )
        db.session.add(user)
        db.session.commit()
        return user.to_dict(), "创建成功"

    @staticmethod
    def update(user_id, data):
        user = User.query.get(user_id)
        if not user:
            return None, "用户不存在"
        if 'realName' in data:
            user.real_name = data['realName']
        if 'role' in data:
            user.role = data['role']
        if 'password' in data and data['password']:
            user.password = data['password']
        db.session.commit()
        return user.to_dict(), "更新成功"

    @staticmethod
    def update_password(user_id, old_password, new_password):
        user = User.query.get(user_id)
        if not user:
            return None, "用户不存在"
        if user.password != old_password:
            return None, "旧密码错误"
        user.password = new_password
        db.session.commit()
        return user.to_dict(), "密码修改成功"
