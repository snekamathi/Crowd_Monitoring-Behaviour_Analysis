from app import app, bcrypt
from database import db, User

with app.app_context():
    # Force reset User table
    print("Resetting User table...")
    try:
        db.session.query(User).delete()
        db.session.commit()
    except Exception as e:
        print(f"Delete failed: {e}")
        db.session.rollback()
    
    # Add fresh users with ALL required fields
    # passwords: Admin@CS2024!, Oper#CS2024!, Auth$CS2024!
    admin = User(
        full_name="System Administrator", 
        email="admin@crowdsense.ai", 
        role='Admin', 
        password=bcrypt.generate_password_hash('Admin@CS2024!').decode('utf-8')
    )
    operator = User(
        full_name="Operations Monitor", 
        email="operator@crowdsense.ai", 
        role='Operator', 
        password=bcrypt.generate_password_hash('Oper#CS2024!').decode('utf-8')
    )
    authority = User(
        full_name="Safety Authority", 
        email="authority@crowdsense.ai", 
        role='Authority', 
        password=bcrypt.generate_password_hash('Auth$CS2024!').decode('utf-8')
    )
    
    # Adding 'tamil' as requested/seen in screenshot
    tamil = User(
        full_name="tamil",
        email="admin@gmail.com",
        role='Admin',
        password=bcrypt.generate_password_hash('Admin@CS2024!').decode('utf-8')
    )

    db.session.add_all([admin, operator, authority, tamil])
    db.session.commit()
    print("Users restored successfully.")
    
    all_users = User.query.all()
    for u in all_users:
        print(f"Verified User: {u.full_name} ({u.role}), Email: {u.email}")
