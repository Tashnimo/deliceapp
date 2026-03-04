import urllib.request
import json

urls_to_test = [
    "https://router.huggingface.co/hf-inference/v1/chat/completions",
    "https://router.huggingface.co/v1/chat/completions"
]

data = json.dumps({"model":"Qwen/Qwen2.5-72B-Instruct", "messages": [{"role": "user", "content": "Salut"}]}).encode('utf-8')
headers = {"Content-Type": "application/json"}

for url in urls_to_test:
    print(f"\nTesting: {url}")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            print("Status", response.status)
            print("Body:", response.read().decode('utf-8')[:100])
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code)
        try:
            print("Body:", e.read().decode('utf-8')[:100])
        except:
            print("Could not read body")
    except Exception as e:
        print("Other error:", e)
