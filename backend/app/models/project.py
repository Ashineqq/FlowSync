from datetime import datetime
from app import db


class ProjectInfo(db.Model):
    __tablename__ = 'project_info'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    status = db.Column(db.String(20), nullable=False)
    priority = db.Column(db.String(20), nullable=False)
    owner_id = db.Column(db.BigInteger, db.ForeignKey('sys_user.id'))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)

    owner = db.relationship('User', backref='projects')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'ownerId': self.owner_id,
            'ownerName': self.owner.real_name if self.owner else None,
            'startDate': self.start_date.strftime('%Y-%m-%d') if self.start_date else None,
            'endDate': self.end_date.strftime('%Y-%m-%d') if self.end_date else None,
            'createTime': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None
        }
