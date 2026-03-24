import requests
import time

login_url = "https://crowd-monitoring-behaviour-analysis.onrender.com/api/login"
status_url = "https://crowd-monitoring-behaviour-analysis.onrender.com/api/dataset/train/status"

payload = {"email": "admin@crowdsense.ai", "password": "Admin@CS2024!"}

try:
    print("Logging in...")
    login_res = requests.post(login_url, json=payload)
    token = login_res.json()['access_token']
    headers = {"Authorization": f"Bearer {token}"}

    print("Polling training status for 30 seconds...")
    for i in range(15):
        s_res = requests.get(status_url, headers=headers)
        data = s_res.json()
        print(f"[{i*2}s] Status: {data.get('active')}, Msg: {data.get('message')}, Progress: {data.get('progress')}%, Metrics: {data.get('metrics')}")
        if data.get('progress') == 100 or "Error" in data.get('message'):
            break
        time.sleep(2)
except Exception as e:
    print(f"Error: {e}")
