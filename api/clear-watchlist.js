import { createClient } from '@vercel/kv';

export default async function handler(request, response) {
    const kv = createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    });

    try {
        await kv.del('user:main_watchlist');
        return response.status(200).send("Watchlist has been cleared successfully.");
    } catch (error) {
        return response.status(500).send("Failed to clear watchlist.");
    }
}
