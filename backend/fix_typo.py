from flask import Flask
from database import db, User
import os

app = Flask(__name__)
db_path = os.path.join(app.root_path, 'crowd_monitoring.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    # Correct the typo: gamil -> gmail
    typo_user = User.query.filter_by(email='snekamathi2004@gamil.com').first()
    if typo_user:
        typo_user.email = 'snekamathi2004@gmail.com'
        db.session.commit()
        print("FIX: Corrected 'gamil.com' to 'gmail.com' for user snekamathi2004")
    else:
        print("User with typo not found. Maybe already fixed.")
