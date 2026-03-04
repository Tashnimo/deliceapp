import urllib.request
import json

# This script tests the HF API with the real Vercel proxy to see what it says 
# The vercel proxy applies the HF_API_KEY token.

url = "https://delcakebf.vercel.app/api/chat"
data = json.dumps({"messages": [{"role": "user", "content": "Salut"}]}).encode('utf-8')
headers = {"Content-Type": "application/json"}

print(f"Sending to Vercel: {url}")
req = urllib.request.Request(url, data=data, headers=headers, method="POST")
try:
    with urllib.request.urlopen(req) as response:
        print("Status", response.status)
        print("Body:", response.read().decode('utf-8')[:500])
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    try:
        print("Body:", e.read().decode('utf-8')[:500])
    except:
        print("Could not read body")
except Exception as e:
    print("Other error:", e)
