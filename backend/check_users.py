from app import app
from database import db, User
from werkzeug.security import check_password_hash

with app.app_context():
    users = User.query.all()
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"Username: {u.username}, Role: {u.role}")
        # Test if password 'admin123' works for 'admin'
        if u.username == 'admin':
            match = check_password_hash(u.password, 'admin123')
            print(f"Password 'admin123' matches: {match}")
    exit(0)
