from app import db
from app.models.user import User
from app.models.project import ProjectInfo
from app.models.task import TaskInfo
from app.models.task_log import TaskLog
from app.models.task_summary import TaskSummary
from app.services.project_service import ProjectService


class OverviewService:
    @staticmethod
    def get_overview(current_user_id=None, is_leader=True):
        if is_leader:
            return {
                'userCount': User.query.count(),
                'projectCount': ProjectInfo.query.count(),
                'taskCount': TaskInfo.query.count(),
                'logCount': TaskLog.query.count(),
                'summaryCount': TaskSummary.query.count(),
            }

        # 复用 ProjectService 的过滤逻辑
        projects = ProjectService.get_all(current_user_id, is_leader)
        project_count = len(projects)

        my_tasks = TaskInfo.query.filter(
            db.or_(
                TaskInfo.creator_id == current_user_id,
                TaskInfo.assignee_id == current_user_id
            )
        )
        task_ids = [t.id for t in my_tasks.all()]
        task_count = len(task_ids)

        log_count = TaskLog.query.filter(TaskLog.task_id.in_(task_ids)).count() if task_ids else 0

        summary_count = TaskSummary.query.filter(
            db.or_(
                TaskSummary.task_id.in_(task_ids),
                TaskSummary.created_by == current_user_id
            )
        ).count() if task_ids else 0

        return {
            'userCount': User.query.count(),
            'projectCount': project_count,
            'taskCount': task_count,
            'logCount': log_count,
            'summaryCount': summary_count,
        }
