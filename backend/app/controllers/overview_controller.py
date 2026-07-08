from flask import Blueprint
from app.common.api_response import ApiResponse
from app.common.auth import get_current_user_args
from app.services.overview_service import OverviewService

overview_bp = Blueprint('overview', __name__)


@overview_bp.route('/api/overview', methods=['GET'])
def get_overview():
    current_user_id, is_leader = get_current_user_args()
    data = OverviewService.get_overview(current_user_id, is_leader)
    return ApiResponse.success(data)
