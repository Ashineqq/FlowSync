from datetime import datetime
from app import db


class TaskInfo(db.Model):
    __tablename__ = 'task_info'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey('project_info.id'))
    parent_id = db.Column(db.BigInteger, db.ForeignKey('task_info.id'), nullable=True)
    title = db.Column(db.String(100))
    description = db.Column(db.String(1000))
    assignee_id = db.Column(db.BigInteger, db.ForeignKey('sys_user.id'))
    creator_id = db.Column(db.BigInteger, db.ForeignKey('sys_user.id'))
    status = db.Column(db.String(20))
    priority = db.Column(db.String(20))
    due_date = db.Column(db.Date)
    ai_suggestion = db.Column(db.Text)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('ProjectInfo', backref='tasks')
    assignee = db.relationship('User', foreign_keys=[assignee_id], backref='assigned_tasks')
    creator = db.relationship('User', foreign_keys=[creator_id], backref='created_tasks')
    parent = db.relationship('TaskInfo', remote_side=[id], backref='subtasks')

    def to_dict(self):
        return {
            'id': self.id,
            'projectId': self.project_id,
            'parentId': self.parent_id,
            'title': self.title,
            'description': self.description,
            'assigneeId': self.assignee_id,
            'assigneeName': self.assignee.real_name if self.assignee else None,
            'creatorId': self.creator_id,
            'creatorName': self.creator.real_name if self.creator else None,
            'status': self.status,
            'priority': self.priority,
            'dueDate': self.due_date.strftime('%Y-%m-%d') if self.due_date else None,
            'aiSuggestion': self.ai_suggestion,
            'createTime': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None
        }
