// api/watchlist.js - Serverless function to manage the Redis watchlist

import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

// A unique key for our app's watchlist in Redis
const WATCHLIST_KEY = 'cineverse_watchlist';

export default async function handler(request) {
    const { method } = request;

    try {
        if (method === 'GET') {
            // Get all items from the sorted set
            const watchlist = await redis.zrange(WATCHLIST_KEY, 0, -1, { withScores: true });
            
            // The result is an array like [item1, score1, item2, score2, ...]
            // We need to parse it back into an array of objects
            const items = [];
            for (let i = 0; i < watchlist.length; i += 2) {
                const item = JSON.parse(watchlist[i]);
                item.added_at = watchlist[i+1];
                items.push(item);
            }
            // Sort by most recently added
            items.sort((a, b) => b.added_at - a.added_at);

            return new Response(JSON.stringify(items), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const body = await request.json();
        const { id, title, poster_path, media_type } = body;
        const item = JSON.stringify({ id, title, poster_path, media_type });

        if (method === 'POST') {
            const timestamp = Date.now();
            await redis.zadd(WATCHLIST_KEY, { score: timestamp, member: item });
            return new Response(JSON.stringify({ message: 'Added to watchlist' }), { status: 200 });
        }

        if (method === 'DELETE') {
            await redis.zrem(WATCHLIST_KEY, item);
            return new Response(JSON.stringify({ message: 'Removed from watchlist' }), { status: 200 });
        }

        // Handle other methods
        return new Response('Method Not Allowed', { status: 405 });

    } catch (error) {
        console.error('Watchlist API Error:', error);
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
    }
}
