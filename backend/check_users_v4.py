from flask import Flask
from database import db, User
import os

app = Flask(__name__)
db_path = os.path.join(app.root_path, 'crowd_monitoring.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    users = User.query.all()
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"Email: {u.email}, Role: {u.role}, Full Name: {u.full_name}")
