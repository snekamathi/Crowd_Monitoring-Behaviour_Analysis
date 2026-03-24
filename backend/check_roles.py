from app import app, db, User
with app.app_context():
    for u in User.query.all():
        print(f"User: {u.email}, Role: {u.role}")
