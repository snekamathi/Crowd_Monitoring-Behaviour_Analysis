import requests
import json

base_url = "http://127.0.0.1:5000/api"
login_data = {
    "email": "admin@crowdsense.ai",
    "password": "Admin@CS2024!"
}

print("Testing login...")
r = requests.post(f"{base_url}/login", json=login_data)
if r.status_code == 200:
    data = r.json()
    token = data['access_token']
    print(f"Login Success. Token: {token[:10]}...")
    
    print("\nTesting stats with token...")
    headers = {"Authorization": f"Bearer {token}"}
    r_stats = requests.get(f"{base_url}/stats", headers=headers)
    print(f"Stats Status: {r_stats.status_code}")
    if r_stats.status_code != 200:
        print(f"Stats Error: {r_stats.text}")
    else:
        print(f"Stats Data: {r_stats.json()}")
else:
    print(f"Login Failed: {r.status_code} - {r.text}")
