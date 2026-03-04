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
        console.error("DEBUG VERCEL : HF_API_KEY est manquante dans les variables d'environnement.");
        return res.status(500).json({ error: "Clé API non configurée sur Vercel (HF_API_KEY)" });
    }

    const HF_API_URL = "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.2-3B-Instruct/v1/chat/completions";

    try {
        console.log("DEBUG VERCEL : Envoi de la requête à Hugging Face...");

        const response = await fetch(HF_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req.body)
        });

        const rawText = await response.text();
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            data = rawText; // Conserver le texte brut si ce n'est pas du JSON (ex: "Not Found")
        }

        if (!response.ok) {
            console.error("DEBUG VERCEL : Hugging Face a répondu avec une erreur :", response.status, data);

            // Message personnalisé pour l'erreur 404 "Not Found" liée aux permissions
            if (response.status === 404 && typeof data === 'string' && data.includes("Not Found")) {
                return res.status(404).json({
                    error: "Le modèle Llama est introuvable ou vous n'y avez pas accès.",
                    detail: "Sur Hugging Face, vérifiez que votre Token a la permission 'Make calls to Inference Providers' ET que vous avez accepté la licence du modèle 'meta-llama/Llama-3.2-3B-Instruct'."
                });
            }

            return res.status(response.status).json({
                error: "Erreur Hugging Face",
                status: response.status,
                detail: data
            });
        }

        console.log("DEBUG VERCEL : Réponse reçue avec succès de Hugging Face.");
        return res.status(200).json(data);
    } catch (err) {
        console.error("DEBUG VERCEL : Erreur lors de l'exécution de la fonction :", err.message);
        return res.status(500).json({ error: "Erreur interne du serveur", detail: err.message });
    }
}
