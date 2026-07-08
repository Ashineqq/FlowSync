import uuid
from app.models.user import User


class AuthService:
    @staticmethod
    def login(username, password):
        user = User.query.filter(User.username == username.lower()).first()
        if not user or user.password != password:
            return None
        token = f"simple-token-{uuid.uuid4().hex[:16]}"
        return {
            'user': user.to_dict(),
            'token': token
        }
