import time
import requests
from datetime import datetime

class AlertSystem:
    def __init__(self, enable_sms=False, enable_email=False, sms_phone="", report_email=""):
        self.enable_sms = enable_sms
        self.enable_email = enable_email
        self.sms_phone = sms_phone
        self.report_email = report_email
        
        # Node.js Alert Microservice URL (Requirement 9)
        self.node_api_base = "https://crowd-monitoring-alerts.onrender.com/api"
        
        # Requirement 5 & 6: Trigger-Reset Logic
        self.is_alert_sent = False
        
        # Cooldown management: {behavior_type: last_alert_time}
        self.last_alert_time = 0
        self.cooldown_seconds = 60  # Requirement 5: 30-60 seconds
        
        print("Initialization: Automatic SMS & Email Alert Pipeline Active.")

    def update_config(self, enable_sms, enable_email, sms_phone, report_email):
        """Allows dynamic updates from database (Requirement 4)"""
        self.enable_sms = enable_sms
        self.enable_email = enable_email
        self.sms_phone = sms_phone
        self.report_email = report_email

    def evaluate_and_trigger(self, count, behavior, risk_cat, high_threshold, location="Webcam"):
        """
        Continuously evaluates conditions (Requirement 1, 2, 3)
        """
        now = time.time()
        
        # Requirement 2: Alert Conditions
        condition_met = (count >= high_threshold) or ("Abnormal" in behavior) or ("Panic" in behavior)

        if condition_met:
            # Check if this is a new incident or we should re-alert after cooldown
            should_alert = not self.is_alert_sent or (now - self.last_alert_time > self.cooldown_seconds)
            
            actions = []
            if should_alert:
                actions = self._dispatch(risk_cat, behavior, count, location)
                if actions:
                    self.is_alert_sent = True
                    self.last_alert_time = now
            
            # Return True for 'triggered' so the system knows to log this incident
            return True, actions
        else:
            # Requirement 6: Reset Condition
            if self.is_alert_sent:
                print(f"[ALERT-PIPE] Conditions cleared (Count: {count}). Resetting alert flag.")
                self.is_alert_sent = False
        
        return False, []

    def send_sms(self, message):
        """Manual SMS for testing (Requirement 6)"""
        if not self.enable_sms or not self.sms_phone: return
        print(f"[ALERT-TEST] Sending Test SMS to {self.sms_phone}...")
        try:
            payload = {
                "to": self.sms_phone,
                "location": "Manual Test",
                "camera": "System Check",
                "count": 0,
                "risk": "Test Alert",
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            requests.post(f"{self.node_api_base}/send-sms", json=payload, timeout=5)
        except Exception as e:
            print(f"[ALERT-TEST] SMS Error: {e}")

    def send_email(self, message, location, timestamp, count, risk):
        """Manual Email for testing (Requirement 6)"""
        if not self.enable_email or not self.report_email: return
        print(f"[ALERT-TEST] Sending Test Email to {self.report_email}...")
        try:
            payload = {
                "to": self.report_email,
                "location": location,
                "timestamp": timestamp,
                "count": count,
                "risk": risk
            }
            requests.post(f"{self.node_api_base}/send-email", json=payload, timeout=5)
        except Exception as e:
            print(f"[ALERT-TEST] Email Error: {e}")

    def _dispatch(self, risk_level, behavior, crowd_count, location):
        """Internal dispatcher to Node.js Microservice (Requirement 4)"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        actions_taken = []
        
        # --- REQUIREMENT 2 & 5: Synchronize with Central Alert System ---
        try:
            central_payload = {
                "location": location,
                "count": crowd_count,
                "behavior": behavior,
                "risk": risk_level,
                "timestamp": timestamp,
                "status": "New"
            }
            # This triggers the Authority dashboard instantly via polling
            res = requests.post(f"{self.node_api_base}/alerts", json=central_payload, timeout=3)
            if res.status_code == 200:
                print(f"[ALERT-PIPE] Success: Alert pushed to Central Store for {location} (Count: {crowd_count})")
        except Exception as e:
            print(f"[ALERT-PIPE] Centralized Alert Store Failure: {e}")

        # 1. SMS
        if self.enable_sms and self.sms_phone:
            try:
                payload = {
                    "to": self.sms_phone,
                    "location": location,
                    "camera": "Live Feed 01",
                    "count": crowd_count,
                    "risk": risk_level,
                    "timestamp": timestamp
                }
                res = requests.post(f"{self.node_api_base}/send-sms", json=payload, timeout=5)
                if res.status_code == 200:
                    actions_taken.append("SMS")
            except Exception as e:
                print(f"[ALERT-PIPE] SMS Delivery Failure: {e}")
            
        # 2. Email
        if self.enable_email and self.report_email:
            try:
                payload = {
                    "to": self.report_email,
                    "location": location,
                    "timestamp": timestamp,
                    "count": crowd_count,
                    "risk": risk_level
                }
                res = requests.post(f"{self.node_api_base}/send-email", json=payload, timeout=5)
                if res.status_code == 200:
                    actions_taken.append("Email")
            except Exception as e:
                print(f"[ALERT-PIPE] Email Delivery Failure: {e}")

        if actions_taken:
            print(f"[ALERT-PIPE] Automatic Alert Dispatched: {', '.join(actions_taken)} (Count: {crowd_count})")
        
        return actions_taken


