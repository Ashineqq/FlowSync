from flask import Blueprint, request
from app.common.api_response import ApiResponse
from app.common.auth import get_current_user_args
from app.services.task_summary_service import TaskSummaryService

summary_bp = Blueprint('summary', __name__)


@summary_bp.route('/api/summaries', methods=['GET'])
def get_summaries():
    current_user_id, is_leader = get_current_user_args()
    summaries = TaskSummaryService.get_all(current_user_id, is_leader)
    return ApiResponse.success(summaries)


@summary_bp.route('/api/summaries', methods=['POST'])
def create_summary():
    data = request.get_json()
    result = TaskSummaryService.create(data)
    return ApiResponse.success(result, "创建成功")
