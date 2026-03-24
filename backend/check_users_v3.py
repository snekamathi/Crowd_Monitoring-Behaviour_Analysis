from flask import Flask
from database import db, User
from werkzeug.security import check_password_hash

import os
app = Flask(__name__)
# standard path
db_path = os.path.join(app.root_path, 'crowd_monitoring.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    for name, pwd in [('admin', 'admin123'), ('operator', 'operator123'), ('authority', 'authority123')]:
        user = User.query.filter_by(username=name).first()
        if user:
            match = check_password_hash(user.password, pwd)
            print(f"VERIFY: User '{name}' Role '{user.role}' Match '{pwd}': {match}")
        else:
            print(f"VERIFY: User '{name}' NOT FOUND")
