import requests

r = requests.post("http://localhost:5000/api/login", json={"email": "snekamathi2004@gmail.com", "password": "snekamathi2004"})
print("login status:", r.status_code, r.text)

if r.status_code == 200:
    token = r.json().get("access_token")
    r2 = requests.post("http://localhost:5000/api/camera/toggle", headers={"Authorization": f"Bearer {token}"}, json={"active": True})
    print("Toggle status:", r2.status_code, r2.text)
