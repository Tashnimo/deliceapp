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
    const chatIdsRaw = process.env.TELEGRAM_CHAT_IDS;

    if (!botToken || !chatIdsRaw) {
        console.error("ERREUR : Configuration Telegram manquante.");
        return res.status(500).json({ error: "Configuration Telegram incomplète" });
    }

    try {
        const { message } = req.body;
        const ids = chatIdsRaw.split(",").map(id => id.trim());

        await Promise.all(ids.map(id =>
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
