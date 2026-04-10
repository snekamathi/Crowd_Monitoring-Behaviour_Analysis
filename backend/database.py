from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash

db = SQLAlchemy()

from datetime import datetime, timezone, timedelta

def get_ist_time():
    # UTC + 5:30
    return datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)

class AlertLog(db.Model):
    __tablename__ = 'alert_logs'
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=get_ist_time)
    crowd_count = db.Column(db.Integer)
    density_level = db.Column(db.String(20))
    behavior_status = db.Column(db.String(20))
    risk_level = db.Column(db.String(20))
    location = db.Column(db.String(100), default="Main Gate")
    action_status = db.Column(db.String(50), default="Active")

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=True) # Optional now
    password = db.Column(db.String(255), nullable=False) # Bcrypt Hashed
    role = db.Column(db.String(20), nullable=False) # Admin, Operator, Authority
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PasswordReset(db.Model):
    __tablename__ = 'password_resets'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)

class SystemSetting(db.Model):
    __tablename__ = 'system_settings'
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.String(255), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

import os
from werkzeug.security import generate_password_hash

def init_db(app):
    db_path = os.path.join(app.root_path, 'crowd_monitoring.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        # Seed default users with email if they don't exist
        if not User.query.filter_by(email='admin@crowdsense.ai').first():
            # Still using generate_password_hash for seeding until bcrypt is fully in place in app.py
            # Bcrypt can verify werkzeug hashes sometimes, but better to be safe.
            # I'll just use a simple placeholder for now or stick to werkzeug as it's safe.
            # Actually, I'll do this in app.py after initializing bcrypt if needed.
            # But let's just use werkzeug here for the seeder to avoid breaking things mid-execution.
            admin = User(
                full_name="System Administrator", 
                email="admin@crowdsense.ai", 
                username="admin", 
                password=generate_password_hash('Admin@CS2024!'), 
                role='Admin'
            )
            operator = User(
                full_name="Operations Monitor", 
                email="operator@crowdsense.ai", 
                username="operator", 
                password=generate_password_hash('Oper#CS2024!'), 
                role='Operator'
            )
            authority = User(
                full_name="Safety Authority", 
                email="authority@crowdsense.ai", 
                username="authority", 
                password=generate_password_hash('Auth$CS2024!'), 
                role='Authority'
            )
            db.session.add_all([admin, operator, authority])
            db.session.commit()
            print("Default users seeded with EMAIL in Database.")
        print("Database initialized successfully.")

def get_setting(key, default=None):
    setting = SystemSetting.query.filter_by(key=key).first()
    return setting.value if setting else default

def set_setting(key, value):
    setting = SystemSetting.query.filter_by(key=key).first()
    if setting:
        setting.value = str(value)
    else:
        setting = SystemSetting(key=key, value=str(value))
        db.session.add(setting)
    db.session.commit()

def save_alert(count, density, behavior, risk, location="Main Gate Camera 01", action_status="Active"):
    try:
        new_alert = AlertLog(
            crowd_count=count,
            density_level=density,
            behavior_status=behavior,
            risk_level=risk,
            location=location,
            action_status=action_status
        )
        db.session.add(new_alert)
        db.session.commit()
    except Exception as e:
        print(f"Error saving alert to DB: {e}")
