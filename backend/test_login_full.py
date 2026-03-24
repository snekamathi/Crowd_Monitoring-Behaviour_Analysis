import requests

r = requests.post("https://crowd-monitoring-alerts.onrender.com/api/login", json={
    "email": "snekamathi2004@gmail.com",
    "password": "Admin@CS2024!"
})
print("Login status:", r.status_code)
print("Response:", r.json())

if r.status_code == 200:
    token = r.json()["access_token"]
    r2 = requests.post("https://crowd-monitoring-alerts.onrender.com/api/camera/toggle",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"active": True})
    print("\nCamera toggle status:", r2.status_code)
    print("Response:", r2.json())
