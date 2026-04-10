import requests
import time

def test_video_feed():
    login_url = "http://localhost:5000/api/login"
    login_data = {"email": "admin@crowdsense.ai", "password": "Admin@CS2024!"}
    
    print("Attempting login...")
    r = requests.post(login_url, json=login_data)
    if r.status_code != 200:
        print(f"Login failed: {r.text}")
        return
    
    token = r.json().get("access_token")
    print(f"Login success. Token: {token[:20]}...")
    
    # Toggle camera ON
    print("Toggling camera ON...")
    r = requests.post("http://localhost:5000/api/camera/toggle", 
                      headers={"Authorization": f"Bearer {token}"},
                      json={"active": True})
    print(f"Toggle response: {r.text}")
    
    # Hit video feed
    feed_url = f"http://localhost:5000/api/video_feed?token={token}"
    print(f"Hitting video feed: {feed_url}")
    
    # Stream for a few seconds
    try:
        with requests.get(feed_url, stream=True, timeout=10) as r:
            if r.status_code == 200:
                print("Stream started successfully!")
                count = 0
                for chunk in r.iter_content(chunk_size=1024):
                    count += 1
                    if count > 10: # Just read a bit
                        print("Successfully read chunks from stream.")
                        break
            else:
                print(f"Stream failed with status {r.status_code}: {r.text}")
    except Exception as e:
        print(f"Error during stream: {e}")

if __name__ == "__main__":
    test_video_feed()
