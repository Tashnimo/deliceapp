import urllib.request
import json

# Test which models actually EXIST on the HF router (401 = good, 404/Not Found = bad)
models = [
    "HuggingFaceH4/zephyr-7b-beta",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "mistralai/Mistral-7B-Instruct-v0.1",
    "Qwen/Qwen2.5-72B-Instruct",
    "meta-llama/Meta-Llama-3-8B-Instruct",
    "google/gemma-2-2b-it",
    "microsoft/Phi-3-mini-4k-instruct",
]

base_url = "https://router.huggingface.co/hf-inference/v1/chat/completions"

for model in models:
    data = json.dumps({"model": model, "messages": [{"role": "user", "content": "Salut"}], "max_tokens": 5}).encode('utf-8')
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(base_url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            print("OK " + model + ": " + str(response.status))
    except urllib.error.HTTPError as e:
        body_text = ""
        try:
            body_text = e.read().decode('utf-8', errors='ignore')[:100]
        except:
            pass
        if "Not Found" in body_text or e.code == 404:
            print("NO  " + model + " - Status " + str(e.code))
        elif e.code == 401 or "Unauthorized" in body_text or "401" in body_text:
            print("OK  " + model + " (401 = route exists)")
        elif e.code == 403:
            print("GTE " + model + " (403 = gated)")
        else:
            print("ERR " + str(e.code) + " " + model + " -> " + body_text[:60])
    except Exception as e:
        print("ERR " + model + ": " + str(e))
