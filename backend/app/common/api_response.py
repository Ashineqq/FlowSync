from flask import jsonify


class ApiResponse:
    @staticmethod
    def success(data=None, message="操作成功"):
        return jsonify({"success": True, "message": message, "data": data})

    @staticmethod
    def error(message="操作失败"):
        return jsonify({"success": False, "message": message, "data": None})
