import requests

def get_token(email, password):
    res = requests.post("http://127.0.0.1:5000/api/login", json={
        "email": email,
        "password": password
    })
    return res.json().get("access_token")

# Log in as tamil
token = get_token("admin@gmail.com", "Admin@CS2024!")
print(f"Token: {token[:20]}...")

# List users to get IDs
res = requests.get("http://127.0.0.1:5000/api/users", headers={"Authorization": f"Bearer {token}"})
users = res.json()
print("Users in DB:")
for u in users:
    print(f"ID: {u['id']}, Email: {u['email']}")

# Try to delete the first one that isn't tamil
target = next((u for u in users if u['email'] != "admin@gmail.com"), None)
if target:
    print(f"Attempting to delete ID {target['id']} ({target['email']})")
    res = requests.delete(f"http://127.0.0.1:5000/api/users/{target['id']}", headers={"Authorization": f"Bearer {token}"})
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}")
else:
    print("No non-self users found to delete.")
