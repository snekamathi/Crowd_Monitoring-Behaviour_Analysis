from flask import Flask
from database import db, User
from werkzeug.security import generate_password_hash

app = Flask(__name__)
# Absolute path to ensure we hit the right file
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///c:/Users/SNEKA/Documents/Crowd_Monitoring/backend/crowd_monitoring.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    # Ensure tables exist
    db.create_all()
    
    # Force reset User table
    print("Resetting User table...")
    try:
        User.query.delete()
    except Exception as e:
        print(f"Delete failed: {e}")
    
    # Add fresh users with guaranteed passwords
    admin = User(username='admin', password=generate_password_hash('Admin@CS2024!'), role='Admin')
    operator = User(username='operator', password=generate_password_hash('Oper#CS2024!'), role='Operator')
    authority = User(username='authority', password=generate_password_hash('Auth$CS2024!'), role='Authority')
    
    db.session.add_all([admin, operator, authority])
    db.session.commit()
    print("Users reset successfully.")
    
    # Double check
    all_users = User.query.all()
    for u in all_users:
        print(f"Verified User: {u.username}, Role: {u.role}")
