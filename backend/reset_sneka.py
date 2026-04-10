from app import app, db, bcrypt
from database import User

with app.app_context():
    user = User.query.filter_by(email='snekamathi2004@gmail.com').first()
    if user:
        new_password = 'Admin@CS2024!'
        user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        db.session.commit()
        print(f"[OK] Password reset for {user.email} (role: {user.role})")
        print(f"     New password: {new_password}")
    else:
        print("[ERROR] User not found!")
        # List all users
        all_users = User.query.all()
        for u in all_users:
            print(f"  - {u.email} ({u.role})")
