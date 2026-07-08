from datetime import datetime
from app import db


class TaskLog(db.Model):
    __tablename__ = 'task_log'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    task_id = db.Column(db.BigInteger, db.ForeignKey('task_info.id'))
    progress_percent = db.Column(db.Integer)
    content = db.Column(db.String(1000))
    operator_id = db.Column(db.BigInteger, db.ForeignKey('sys_user.id'))
    create_time = db.Column(db.DateTime, default=datetime.utcnow)

    task = db.relationship('TaskInfo', backref='logs')
    operator = db.relationship('User', backref='task_logs')

    def to_dict(self):
        return {
            'id': self.id,
            'taskId': self.task_id,
            'taskTitle': self.task.title if self.task else None,
            'progressPercent': self.progress_percent,
            'content': self.content,
            'operatorId': self.operator_id,
            'operatorName': self.operator.real_name if self.operator else None,
            'createTime': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None
        }
