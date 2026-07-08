from app import db
from app.models.task_summary import TaskSummary
from app.models.task import TaskInfo


class TaskSummaryService:
    @staticmethod
    def get_all(current_user_id=None, is_leader=True):
        query = TaskSummary.query
        if not is_leader and current_user_id:
            query = query.outerjoin(TaskInfo, TaskSummary.task_id == TaskInfo.id).filter(
                db.or_(
                    TaskInfo.creator_id == current_user_id,
                    TaskInfo.assignee_id == current_user_id,
                    TaskSummary.created_by == current_user_id
                )
            )
        return [s.to_dict() for s in query.order_by(TaskSummary.id.desc()).all()]

    @staticmethod
    def create(data):
        summary = TaskSummary(
            project_id=data.get('projectId'),
            task_id=data.get('taskId'),
            summary_type=data.get('summaryType'),
            content=data.get('content'),
            created_by=data.get('createdBy')
        )
        db.session.add(summary)
        db.session.commit()
        return summary.to_dict()
