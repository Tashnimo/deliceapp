import fetch from 'node-fetch';

const HF_API_KEY = process.env.HF_API_KEY || 'YOUR_HF_TOKEN_HERE'; // Je vais demander à l'utilisateur de fournir son token s'il l'a en local, sinon de le mettre.

async function testHF() {
    console.log("Testing Hugging Face API...");

    // Test 1: Llama 3 8B
    const modelId = "meta-llama/Meta-Llama-3-8B-Instruct";
    const url = "https://api-inference.huggingface.co/models/" + modelId + "/v1/chat/completions";

    // Test 2: Qwen
    const url2 = "https://api-inference.huggingface.co/v1/chat/completions";

    try {
        console.log(`\n--- Test 1: ${modelId} ---`);
        const res1 = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: modelId,
                messages: [{ role: "user", content: "Bonjour" }],
                max_tokens: 50
            })
        });
        console.log(`Status 1: ${res1.status}`);
        const data1 = await res1.text();
        console.log(`Body 1: ${data1}`);
    } catch (e) {
        console.error("Test 1 error:", e);
    }

    try {
        console.log(`\n--- Test 2: Global Endpoint (Qwen) ---`);
        const res2 = await fetch(url2, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "Qwen/Qwen2.5-72B-Instruct",
                messages: [{ role: "user", content: "Bonjour" }],
                max_tokens: 50
            })
        });
        console.log(`Status 2: ${res2.status}`);
        const data2 = await res2.text();
        console.log(`Body 2: ${data2}`);
    } catch (e) {
        console.error("Test 2 error:", e);
    }
}

testHF();
