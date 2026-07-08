class TaskSuggestionDTO:
    def __init__(self, project_name, task_title, task_description):
        self.project_name = project_name
        self.task_title = task_title
        self.task_description = task_description


class TaskPlanDTO:
    def __init__(self, project_id, operator_id, project_name, goal, description):
        self.project_id = project_id
        self.operator_id = operator_id
        self.project_name = project_name
        self.goal = goal
        self.description = description


class TaskPlanImportDTO:
    def __init__(self, project_id, creator_id, items):
        self.project_id = project_id
        self.creator_id = creator_id
        self.items = items
