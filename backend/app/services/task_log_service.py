from app import db
from app.models.task_log import TaskLog
from app.models.task import TaskInfo


class TaskLogService:
    @staticmethod
    def get_all(task_id=None, current_user_id=None, is_leader=True):
        query = TaskLog.query
        if task_id:
            query = query.filter_by(task_id=task_id)
        if not is_leader and current_user_id:
            query = query.filter(
                TaskLog.task_id == TaskInfo.id,
                db.or_(
                    TaskInfo.creator_id == current_user_id,
                    TaskInfo.assignee_id == current_user_id
                )
            )
        return [l.to_dict() for l in query.order_by(TaskLog.id.desc()).all()]

    @staticmethod
    def create(data):
        log = TaskLog(
            task_id=data.get('taskId'),
            progress_percent=data.get('progressPercent', 0),
            content=data.get('content'),
            operator_id=data.get('operatorId')
        )
        db.session.add(log)
        db.session.commit()
        return log.to_dict()
