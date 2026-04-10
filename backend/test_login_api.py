import requests

url = "http://127.0.0.1:5000/api/login"
payload = {"username": "admin", "password": "admin123"}
r = requests.post(url, json=payload)
print(f"Status Code: {r.status_code}")
print(f"Response: {r.text}")
