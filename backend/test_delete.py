import requests

token = "..." # Need a real token
user_id = 7 # Looking at the screenshot, tamil is likely ID 7 if Grace is 4, sneka is 5, 6...

def get_admin_token():
    res = requests.post("http://127.0.0.1:5000/api/login", json={
        "email": "admin@crowdsense.ai",
        "password": "Admin@CS2024!"
    })
    return res.json().get("access_token")

token = get_admin_token()
print(f"Token: {token}")

res = requests.delete(f"http://127.0.0.1:5000/api/users/{user_id}", headers={"Authorization": f"Bearer {token}"})
print(f"Status: {res.status_code}")
print(f"Response: {res.json()}")
