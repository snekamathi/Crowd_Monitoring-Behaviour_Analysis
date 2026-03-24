import requests

def get_admin_token():
    res = requests.post("http://127.0.0.1:5000/api/login", json={
        "email": "admin@crowdsense.ai",
        "password": "Admin@CS2024!"
    })
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        # Try tamil login
        res = requests.post("http://127.0.0.1:5000/api/login", json={
            "email": "admin@gmail.com",
            "password": "Admin@CS2024!" # Assumption
        })
    return res.json().get("access_token") if res.status_code == 200 else None

token = get_admin_token()
if not token:
    print("Could not get token.")
    exit(1)

print(f"Token acquired.")

# Try to delete ID 7
user_id_to_delete = 7
res = requests.delete(f"http://127.0.0.1:5000/api/users/{user_id_to_delete}", headers={"Authorization": f"Bearer {token}"})
print(f"Status: {res.status_code}")
print(f"Response: {res.json()}")
