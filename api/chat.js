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
    const MODEL_ID = "Qwen/Qwen2.5-72B-Instruct";
    // URL correcte confirmée par test local (retourne 401, la route existe)
    const HF_MODEL_URL = `https://router.huggingface.co/hf-inference/v1/chat/completions`;

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Le format des messages est invalide" });
        }

        // Nettoyage strict des messages pour éviter les erreurs 500 dues à des propriétés non supportées
        const cleanMessages = messages.map(msg => ({
            role: String(msg.role || "user"),
            content: String(msg.content || "")
        })).filter(msg => msg.content.trim() !== "");

        if (cleanMessages.length === 0) {
            return res.status(400).json({ error: "Les messages ne peuvent pas être vides." });
        }

        const payload = {
            model: MODEL_ID,
            messages: cleanMessages,
            max_tokens: 250,
            temperature: 0.7,
            top_p: 0.9,
            stream: false
        };

        const response = await fetch(HF_MODEL_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
        });

        // Lecture sécurisée de la réponse (text puis json) pour éviter un crash JSON.parse
        const rawText = await response.text();
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            console.error("HF returned non-JSON:", rawText);
            return res.status(502).json({ error: "Mauvaise réponse de Hugging Face (non-JSON)", text: rawText.substring(0, 100) });
        }

        if (!response.ok) {
            console.error("HF API Error (Status " + response.status + "):", data);

            // Gestion du modèle en cours de chargement (erreur classique HF)
            if (data.error && typeof data.error === 'string' && data.error.includes("is currently loading")) {
                return res.status(503).json({ error: "Le cerveau de Délice AI se réveille... 🤖 Patientez 10s." });
            }

            return res.status(response.status).json({ error: "Erreur de l'API Hugging Face", detail: data });
        }

        return res.status(200).json(data);

    } catch (err) {
        console.error("Critical Proxy Error:", err);
        return res.status(500).json({ error: "Erreur serveur interne", details: err.message, stack: err.stack });
    }
}
