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

    // --- SOLUTION FINALE : API CHAT COMPLETIONS HUGGING FACE ---
    // Utilisation de l'endpoint standardisé OpenAI "/v1/chat/completions" de HF
    // On utilise Zephyr, un modèle extrêmement stable sur l'API gratuite de Hugging Face
    const MODEL_ID = "HuggingFaceH4/zephyr-7b-beta";
    const HF_MODEL_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}/v1/chat/completions`;

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Le format des messages est invalide" });
        }

        const response = await fetch(HF_MODEL_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages: messages,
                max_tokens: 250,
                temperature: 0.7,
                top_p: 0.9,
                stream: false
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("HF API Error:", data);

            // Gestion du modèle en cours de chargement (erreur classique HF)
            if (data.error && typeof data.error === 'string' && data.error.includes("is currently loading")) {
                return res.status(503).json({ error: "Le cerveau de Délice AI se réveille... 🤖 Patientez 10s." });
            }

            return res.status(response.status).json({ error: "Erreur de l'API Hugging Face", detail: data });
        }

        // Renvoie exactement le format OpenAI attendu par le frontend
        return res.status(200).json(data);

    } catch (err) {
        console.error("Critical Proxy Error:", err);
        return res.status(500).json({ error: "Erreur serveur", details: err.message });
    }
}
