from datetime import datetime
from app import db


class TaskSummary(db.Model):
    __tablename__ = 'task_summary'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey('project_info.id'))
    task_id = db.Column(db.BigInteger, db.ForeignKey('task_info.id'), nullable=True)
    summary_type = db.Column(db.String(30))
    content = db.Column(db.String(2000))
    created_by = db.Column(db.BigInteger, db.ForeignKey('sys_user.id'))
    create_time = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('ProjectInfo', backref='summaries')
    task = db.relationship('TaskInfo', backref='summaries')
    creator = db.relationship('User', backref='summaries')

    def to_dict(self):
        return {
            'id': self.id,
            'projectId': self.project_id,
            'projectName': self.project.name if self.project else None,
            'taskId': self.task_id,
            'taskTitle': self.task.title if self.task else None,
            'summaryType': self.summary_type,
            'content': self.content,
            'createdBy': self.created_by,
            'creatorName': self.creator.real_name if self.creator else None,
            'createTime': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None
        }
