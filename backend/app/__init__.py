from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(app)

    from app.controllers.auth_controller import auth_bp
    from app.controllers.project_controller import project_bp
    from app.controllers.task_controller import task_bp
    from app.controllers.task_log_controller import task_log_bp
    from app.controllers.task_summary_controller import summary_bp
    from app.controllers.overview_controller import overview_bp
    from app.controllers.user_controller import user_bp
    from app.controllers.ai_controller import ai_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(task_log_bp)
    app.register_blueprint(summary_bp)
    app.register_blueprint(overview_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(ai_bp)

    return app
