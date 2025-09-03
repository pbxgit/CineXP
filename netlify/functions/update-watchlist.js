// netlify/functions/update-watchlist.js
// Version 1: Code Beautification

const { createClient } = require('@vercel/kv');

exports.handler = async function (event, context) {
    // 1. Initialize KV Client
    const kv = createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    });

    // NOTE: This is a hardcoded user ID. In a real application,
    // this should be replaced with a dynamic ID from an authentication system.
    const userId = 'user_123';
    const watchlistKey = `watchlist:${userId}`;
    
    const { httpMethod: method } = event;

    // 2. Route request based on HTTP method
    try {
        switch (method) {
            case 'GET': {
                const watchlist = await kv.lrange(watchlistKey, 0, -1);
                return {
                    statusCode: 200,
                    body: JSON.stringify(watchlist || []),
                };
            }

            case 'POST': {
                const movie = JSON.parse(event.body);
                await kv.lpush(watchlistKey, JSON.stringify(movie));
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Movie added to watchlist' }),
                };
            }

            case 'DELETE': {
                const movieToRemove = JSON.parse(event.body);
                // lrem will remove all occurrences of the value. '0' means remove all.
                await kv.lrem(watchlistKey, 0, JSON.stringify(movieToRemove));
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Movie removed from watchlist' }),
                };
            }

            default: {
                return { 
                    statusCode: 405, 
                    body: 'Method Not Allowed' 
                };
            }
        }
    } catch (error) {
        console.error('Watchlist Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to update watchlist. Reason: ${error.message}` }),
        };
    }
};
