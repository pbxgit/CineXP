// api/watchlist.js - V2 (Corrected Delete Logic)

import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

const WATCHLIST_KEY = 'cineverse_watchlist';

export default async function handler(request) {
    const { method } = request;

    try {
        if (method === 'GET') {
            const watchlist = await redis.zrange(WATCHLIST_KEY, 0, -1);
            const items = watchlist.map(item => JSON.parse(item));
            // No need to sort here, we can sort on the client if needed or rely on insertion order
            return new Response(JSON.stringify(items), { status: 200 });
        }

        const body = await request.json();
        const { id, title, poster_path, media_type } = body;

        if (method === 'POST') {
            const item = JSON.stringify({ id, title, poster_path, media_type });
            // Use Date.now() as the score to sort by recently added
            await redis.zadd(WATCHLIST_KEY, { score: Date.now(), member: item });
            return new Response(JSON.stringify({ message: 'Added' }), { status: 200 });
        }

        if (method === 'DELETE') {
            // --- THIS IS THE CRITICAL FIX ---
            // We must find the exact item string in the set to remove it.
            const allItems = await redis.zrange(WATCHLIST_KEY, 0, -1);
            const itemToRemove = allItems.find(itemStr => JSON.parse(itemStr).id === id);
            
            if (itemToRemove) {
                await redis.zrem(WATCHLIST_KEY, itemToRemove);
            }
            return new Response(JSON.stringify({ message: 'Removed' }), { status: 200 });
        }

        return new Response('Method Not Allowed', { status: 405 });

    } catch (error) {
        console.error('Watchlist API Error:', error);
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
    }
}
