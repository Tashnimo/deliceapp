export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: "Clé API Groq non configurée sur Vercel (GROQ_API_KEY)" });
    }

    // --- GROQ API (Gratuit, Rapide, Fiable - Llama 3) ---
    const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    const MODEL = "llama-3.1-8b-instant"; // Llama 3.1, même modèle qu'avant, gratuit et ultra-rapide

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Format de messages invalide" });
        }

        // Nettoyage strict des messages
        const cleanMessages = messages.map(msg => ({
            role: String(msg.role || "user"),
            content: String(msg.content || "")
        })).filter(msg => msg.content.trim() !== "");

        if (cleanMessages.length === 0) {
            return res.status(400).json({ error: "Messages vides." });
        }

        const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: MODEL,
                messages: cleanMessages,
                max_tokens: 800,
                temperature: 0.7,
                top_p: 0.9,
                stream: false
            })
        });

        const rawText = await response.text();
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            console.error("Groq returned non-JSON:", rawText);
            return res.status(502).json({ error: "Réponse invalide de Groq", text: rawText.substring(0, 100) });
        }

        if (!response.ok) {
            console.error("Groq API Error (" + response.status + "):", data);
            return res.status(response.status).json({ error: "Erreur Groq API", detail: data });
        }

        // Format OpenAI standard - compatible avec le frontend existant
        return res.status(200).json(data);

    } catch (err) {
        console.error("Critical Proxy Error:", err);
        return res.status(500).json({ error: "Erreur serveur", details: err.message });
    }
}
