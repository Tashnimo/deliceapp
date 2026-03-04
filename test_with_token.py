import urllib.request
import json

# Le résultat de ce script va confirmer si ton token HF a bien
# l'accès "inference providers" pour le router.huggingface.co

HF_TOKEN = input("Colle ton token HF (hf_xxx) : ").strip()

models = [
    "HuggingFaceH4/zephyr-7b-beta",
    "Qwen/Qwen2.5-72B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.3",
]

base_url = "https://router.huggingface.co/hf-inference/v1/chat/completions"

for model in models:
    print("\n--- Test: " + model + " ---")
    data = json.dumps({"model": model, "messages": [{"role": "user", "content": "Bonjour"}], "max_tokens": 20}).encode('utf-8')
    headers = {"Content-Type": "application/json", "Authorization": "Bearer " + HF_TOKEN}
    req = urllib.request.Request(base_url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print("SUCCES! Reponse: " + result["choices"][0]["message"]["content"][:100])
    except urllib.error.HTTPError as e:
        print("Erreur " + str(e.code))
        print(e.read().decode('utf-8', errors='ignore')[:200])
    except Exception as e:
        print("Erreur: " + str(e))
