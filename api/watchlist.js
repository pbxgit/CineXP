// api/watchlist.js - V16 (Optimized & Stable)

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
            // OPTIMIZATION: Fetch items in reverse order (most recent first) directly from Redis.
            const watchlistData = await redis.zrevrange(WATCHLIST_KEY, 0, -1, { withScores: true });
            
            const items = [];
            for (let i = 0; i < watchlistData.length; i += 2) {
                const item = JSON.parse(watchlistData[i]);
                item.added_at = watchlistData[i + 1]; // Attach the timestamp
                items.push(item);
            }
            return new Response(JSON.stringify(items), { status: 200 });
        }

        const body = await request.json();
        const { id } = body;

        if (method === 'POST') {
            // Use Date.now() as the score to sort by recently added
            await redis.zadd(WATCHLIST_KEY, { score: Date.now(), member: JSON.stringify(body) });
            return new Response(JSON.stringify({ message: 'Added to watchlist' }), { status: 200 });
        }

        if (method === 'DELETE') {
            // To remove an item, we must find its exact string representation in the sorted set.
            const allItems = await redis.zrange(WATCHLIST_KEY, 0, -1);
            const itemToRemove = allItems.find(itemStr => JSON.parse(itemStr).id.toString() === id.toString());
            
            if (itemToRemove) {
                await redis.zrem(WATCHLIST_KEY, itemToRemove);
            }
            return new Response(JSON.stringify({ message: 'Removed from watchlist' }), { status: 200 });
        }

        // Handle unsupported methods
        return new Response('Method Not Allowed', { status: 405 });

    } catch (error) {
        console.error('Watchlist API Error:', error);
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
    }
}
