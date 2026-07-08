from app import create_app, db
from app.models.user import User

app = create_app()


def seed_data():
    if User.query.count() == 0:
        users = [
            User(username='leader', password='123456', real_name='项目负责人', role='负责人'),
            User(username='member1', password='123456', real_name='张三', role='成员'),
            User(username='member2', password='123456', real_name='李四', role='成员')
        ]
        db.session.add_all(users)
        db.session.commit()
        print("Seed data created successfully")


with app.app_context():
    db.create_all()
    seed_data()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
