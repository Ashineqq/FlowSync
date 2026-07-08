from datetime import datetime
from app import db


class User(db.Model):
    __tablename__ = 'sys_user'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    real_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(30), nullable=False)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'realName': self.real_name,
            'role': self.role,
            'createTime': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None
        }
