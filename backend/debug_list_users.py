from app import app
from database import db, User
import sys

with app.app_context():
    try:
        users = User.query.all()
        print(f"Total users: {len(users)}")
        for u in users:
            print(f"ID: {u.id}, Name: {u.full_name}, Email: {u.email}, Role: {u.role}")
    except Exception as e:
        print(f"Error: {e}")
sys.stdout.flush()
