from app import app
from database import AlertLog
import time

with app.app_context():
    print("Checking for recent alerts in DB...")
    logs = AlertLog.query.order_by(AlertLog.timestamp.desc()).limit(5).all()
    if not logs:
        print("No logs found.")
    for log in logs:
        print(f"[{log.timestamp}] Count: {log.crowd_count}, Risk: {log.risk_level}, Location: {log.location}")
