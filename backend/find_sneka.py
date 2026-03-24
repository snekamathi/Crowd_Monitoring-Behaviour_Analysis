from app import app
from database import User
with app.app_context():
    user = User.query.filter((User.email.contains("sneka")) | (User.username.contains("sneka"))).first()
    if user:
        print(f"USER: {user.email}, UNAME: {user.username}, ROLE: {user.role}, NAME: {user.full_name}")
    else:
        print("SNEKA NOT FOUND")
