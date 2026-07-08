from datetime import datetime
from app import db
from app.models.project import ProjectInfo
from app.models.task import TaskInfo


class ProjectService:
    @staticmethod
    def get_all(current_user_id=None, is_leader=True):
        query = ProjectInfo.query
        if not is_leader and current_user_id:
            # 成员可见：自己创建的项目 + 有任务分配给自己的项目
            task_project_ids = db.session.query(TaskInfo.project_id).filter(
                TaskInfo.assignee_id == current_user_id
            ).distinct()
            query = query.filter(
                db.or_(
                    ProjectInfo.owner_id == current_user_id,
                    ProjectInfo.id.in_(task_project_ids)
                )
            )
        return [p.to_dict() for p in query.order_by(ProjectInfo.id.desc()).all()]

    @staticmethod
    def create(data):
        project = ProjectInfo(
            name=data.get('name'),
            description=data.get('description'),
            status=data.get('status', '未开始'),
            priority=data.get('priority', '中'),
            owner_id=data.get('ownerId'),
            start_date=datetime.strptime(data['startDate'], '%Y-%m-%d').date() if data.get('startDate') else None,
            end_date=datetime.strptime(data['endDate'], '%Y-%m-%d').date() if data.get('endDate') else None
        )
        db.session.add(project)
        db.session.commit()
        return project.to_dict()

    @staticmethod
    def update(data):
        project = ProjectInfo.query.get(data.get('id'))
        if not project:
            return None
        project.name = data.get('name', project.name)
        project.description = data.get('description', project.description)
        project.status = data.get('status', project.status)
        project.priority = data.get('priority', project.priority)
        project.owner_id = data.get('ownerId', project.owner_id)
        if 'startDate' in data:
            project.start_date = datetime.strptime(data['startDate'], '%Y-%m-%d').date() if data['startDate'] else None
        if 'endDate' in data:
            project.end_date = datetime.strptime(data['endDate'], '%Y-%m-%d').date() if data['endDate'] else None
        db.session.commit()
        return project.to_dict()

    @staticmethod
    def delete(project_id):
        project = ProjectInfo.query.get(project_id)
        if not project:
            return False
        db.session.delete(project)
        db.session.commit()
        return True
