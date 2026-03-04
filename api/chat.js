export default async function handler(req, res) {
    // 1. Gestion des requêtes OPTIONS (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const HF_API_KEY = process.env.HF_API_KEY;
    if (!HF_API_KEY) {
        return res.status(500).json({ error: "Clé API non configurée sur Vercel (HF_API_KEY)" });
    }

    // --- SOLUTION ROBUSTE : APPEL DIRECT AU MODÈLE MISTRAL ---
    // On utilise l'endpoint de base du modèle, beaucoup plus stable que le "Router"
    const HF_MODEL_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

    try {
        const { messages } = req.body;

        // TRADUCTION : OpenAI Format -> Mistral Prompt
        // Mistral format: <s>[INST] Instruction [/INST] Model answer</s>[INST] Follow-up [/INST]
        let prompt = "";
        if (messages && Array.isArray(messages)) {
            messages.forEach(msg => {
                if (msg.role === 'system') {
                    prompt += `<s>[INST] ${msg.content} [/INST] D'accord, je suis prêt à aider.</s>`;
                } else if (msg.role === 'user') {
                    prompt += `[INST] ${msg.content} [/INST]`;
                } else if (msg.role === 'assistant') {
                    prompt += ` ${msg.content}</s>`;
                }
            });
        }

        const response = await fetch(HF_MODEL_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 250,
                    temperature: 0.7,
                    top_p: 0.9,
                    return_full_text: false
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("HF Error:", data);
            return res.status(response.status).json({ error: "Hugging Face Error", detail: data });
        }

        // TRADUCTION : Hugging Face Output -> OpenAI Format
        // HF renvoie souvent un tableau [{ generated_text: "..." }]
        let botText = "";
        if (Array.isArray(data) && data[0] && data[0].generated_text) {
            botText = data[0].generated_text;
        } else {
            botText = JSON.stringify(data);
        }

        // On renvoie un objet compatible avec le script.js actuel
        return res.status(200).json({
            choices: [
                {
                    message: {
                        content: botText
                    }
                }
            ]
        });

    } catch (err) {
        console.error("Critical Proxy Error:", err);
        return res.status(500).json({ error: "Erreur serveur", details: err.message });
    }
}
