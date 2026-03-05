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

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatIdsRaw = process.env.TELEGRAM_CHAT_IDS || "";

    if (!botToken) {
        console.error("ERREUR : TELEGRAM_BOT_TOKEN manquant.");
        return res.status(500).json({ error: "Configuration Telegram incomplète (Token manquant)" });
    }

    try {
        const { message, chatIds: extraIds } = req.body;

        // Build final list of IDs (Env IDs + Optional Body IDs)
        const envIds = chatIdsRaw.split(",").map(id => id.trim()).filter(id => id);
        const finalIds = new Set([...envIds]);

        if (Array.isArray(extraIds)) {
            extraIds.forEach(id => {
                if (id) finalIds.add(String(id).trim());
            });
        }

        if (finalIds.size === 0) {
            console.error("ERREUR : Aucun chat_id spécifié (Env ou Body).");
            return res.status(400).json({ error: "Aucun destinataire Telegram configuré" });
        }

        await Promise.all(Array.from(finalIds).map(id =>
            fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: id, text: message, parse_mode: "HTML" })
            })
        ));

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Erreur notification Telegram :", err.message);
        return res.status(500).json({ error: err.message });
    }
}
