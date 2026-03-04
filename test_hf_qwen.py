import urllib.request
import json
import ssl

url = "https://router.huggingface.co/hf-inference/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions"
# Je vais demander à l'utilisateur son token, mais sans token on gagne quoi ?
# 401 Unauthorized, ce qui prouverait que la route EXISTE !
headers = {"Content-Type": "application/json"}
data = json.dumps({"model":"Qwen/Qwen2.5-72B-Instruct", "messages": [{"role": "user", "content": "Salut"}]}).encode('utf-8')

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
