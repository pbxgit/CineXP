import { createClient } from '@vercel/kv';

const WATCHLIST_KEY = 'user:main_watchlist';

function getKvClient() {
    return createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    });
}

export default async function handler(request, response) {
    const kv = getKvClient();

    try {
        if (request.method === 'GET') {
            console.log("API: Attempting to GET watchlist.");
            const watchlist = await kv.lrange(WATCHLIST_KEY, 0, -1);
            console.log("API: Successfully retrieved data from KV:", watchlist);
            return response.status(200).json(watchlist || []);

        } else if (request.method === 'POST') {
            const item = request.body;
            console.log("API: Attempting to POST item:", item);
            if (!item || !item.id) {
                return response.status(400).json({ message: 'Media item is required.' });
            }
            await kv.lpush(WATCHLIST_KEY, JSON.stringify(item));
            console.log("API: Successfully added item to KV.");
            return response.status(201).json({ message: 'Item added.' });

        } else {
            response.setHeader('Allow', ['GET', 'POST']);
            return response.status(405).end(`Method ${request.method} Not Allowed`);
        }
    } catch (error) {
        console.error("API: CRITICAL ERROR in KV operation:", error);
        return response.status(500).json({ message: 'Database operation failed.' });
    }
}
