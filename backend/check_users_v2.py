from flask import Flask
from database import db, User
from werkzeug.security import check_password_hash

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///crowd_monitoring.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    users = User.query.all()
    print(f"DEBUG: Found {len(users)} users.")
    for u in users:
        print(f"DEBUG: User: {u.username}, Role: {u.role}")
        match = check_password_hash(u.password, 'admin123')
        print(f"DEBUG: Password check for {u.username} with 'admin123': {match}")
