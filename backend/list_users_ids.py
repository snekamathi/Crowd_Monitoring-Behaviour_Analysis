from app import app
from database import db, User

with app.app_context():
    users = User.query.all()
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}")
