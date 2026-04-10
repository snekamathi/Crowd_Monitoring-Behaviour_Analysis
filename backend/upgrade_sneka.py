from app import app
from database import db, User
with app.app_context():
    user = User.query.filter_by(email='snekamathi2004@gmail.com').first()
    if user:
        user.role = 'Admin'
        db.session.commit()
        print(f"[OK] Upgraded {user.email} to Admin.")
    else:
        print("[ERROR] snekamathi not found!")
