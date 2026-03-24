import urllib.request
import urllib.error
import uuid

boundary = uuid.uuid4().hex
headers = {'Content-Type': f'multipart/form-data; boundary={boundary}'}
data = []
data.append(f'--{boundary}'.encode('utf-8'))
data.append(b'Content-Disposition: form-data; name="video"; filename="test_vid.mp4"')
data.append(b'Content-Type: video/mp4')
data.append(b'')
with open('test_vid.mp4', 'rb') as f:
    data.append(f.read())
data.append(f'--{boundary}--'.encode('utf-8'))
data.append(b'')

body = b'\r\n'.join(data)
req = urllib.request.Request('https://crowd-monitoring-alerts.onrender.com/api/upload', data=body, headers=headers)
try:
    r = urllib.request.urlopen(req)
    print(r.read())
except urllib.error.HTTPError as e:
    print(e.read().decode('utf-8'))
