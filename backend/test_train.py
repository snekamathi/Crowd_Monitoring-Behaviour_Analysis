import requests
import json
import time

login_url = "https://crowd-monitoring-behaviour-analysis.onrender.com/api/login"
train_url = "https://crowd-monitoring-behaviour-analysis.onrender.com/api/dataset/train"
status_url = "https://crowd-monitoring-behaviour-analysis.onrender.com/api/dataset/train/status"

payload = {"email": "admin@crowdsense.ai", "password": "Admin@CS2024!"}

try:
    print("Logging in...")
    login_res = requests.post(login_url, json=payload)
    token = login_res.json()['access_token']
    headers = {"Authorization": f"Bearer {token}"}

    print("Initiating training...")
    train_res = requests.post(train_url, headers=headers)
    print(f"Status: {train_res.status_code}")
    print(f"Response: {train_res.text}")

    if train_res.ok:
        for _ in range(5):
            time.sleep(2)
            s_res = requests.get(status_url, headers=headers)
            print(f"Current Status: {s_res.json()}")
except Exception as e:
    print(f"Error: {e}")
