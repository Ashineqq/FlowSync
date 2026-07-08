from datetime import datetime
from app import db
from app.models.task import TaskInfo


class TaskService:
    @staticmethod
    def get_all(project_id=None, current_user_id=None, is_leader=True):
        query = TaskInfo.query
        if project_id:
            query = query.filter_by(project_id=project_id)
        if not is_leader and current_user_id:
            query = query.filter(
                db.or_(
                    TaskInfo.creator_id == current_user_id,
                    TaskInfo.assignee_id == current_user_id
                )
            )
        return [t.to_dict() for t in query.order_by(TaskInfo.id.desc()).all()]

    @staticmethod
    def create(data):
        task = TaskInfo(
            project_id=data.get('projectId'),
            parent_id=data.get('parentId'),
            title=data.get('title'),
            description=data.get('description'),
            assignee_id=data.get('assigneeId'),
            creator_id=data.get('creatorId'),
            status=data.get('status', '未开始'),
            priority=data.get('priority', '中'),
            due_date=datetime.strptime(data['dueDate'], '%Y-%m-%d').date() if data.get('dueDate') else None,
            ai_suggestion=data.get('aiSuggestion')
        )
        db.session.add(task)
        db.session.commit()
        return task.to_dict()

    @staticmethod
    def update(data):
        task = TaskInfo.query.get(data.get('id'))
        if not task:
            return None
        task.project_id = data.get('projectId', task.project_id)
        task.parent_id = data.get('parentId', task.parent_id)
        task.title = data.get('title', task.title)
        task.description = data.get('description', task.description)
        task.assignee_id = data.get('assigneeId', task.assignee_id)
        task.status = data.get('status', task.status)
        task.priority = data.get('priority', task.priority)
        if 'dueDate' in data:
            task.due_date = datetime.strptime(data['dueDate'], '%Y-%m-%d').date() if data['dueDate'] else None
        task.ai_suggestion = data.get('aiSuggestion', task.ai_suggestion)
        db.session.commit()
        return task.to_dict()

    @staticmethod
    def delete(task_id):
        task = TaskInfo.query.get(task_id)
        if not task:
            return False
        db.session.delete(task)
        db.session.commit()
        return True
