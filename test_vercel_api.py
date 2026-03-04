import urllib.request
import json
import ssl

url = "https://delcakebf.vercel.app/api/chat"
headers = {"Content-Type": "application/json"}
data = json.dumps({"messages": [{"role": "user", "content": "Salut"}]}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        print("Status", response.status)
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Other error:", e)
