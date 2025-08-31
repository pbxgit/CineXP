import { createClient } from '@vercel/kv';

// This is the key under which our list will be stored in the database.
const WATCHLIST_KEY = 'user:main_watchlist';

// A helper function to easily create a client for our database.
function getKvClient() {
    return createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    });
}

export default async function handler(request, response) {
    const kv = getKvClient();

    try {
        // --- ROUTE 1: GET Request ---
        // If the app asks for the list, we retrieve it.
        if (request.method === 'GET') {
            const watchlist = await kv.lrange(WATCHLIST_KEY, 0, -1);
            return response.status(200).json(watchlist || []);
        } 
        
        // --- ROUTE 2: POST Request ---
        // If the app sends a new item, we add it.
        else if (request.method === 'POST') {
            const item = request.body; // The movie/show object from the app
            if (!item || !item.id) {
                return response.status(400).json({ message: 'Media item data is required.' });
            }
            // lpush adds the new item (as a string) to the beginning of the list in the database.
            await kv.lpush(WATCHLIST_KEY, JSON.stringify(item));
            return response.status(201).json({ message: 'Item added successfully.' });
        } 
        
        // --- Fallback for other methods ---
        else {
            response.setHeader('Allow', ['GET', 'POST']);
            return response.status(405).end(`Method ${request.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error with Vercel KV operation:", error);
        return response.status(500).json({ message: 'A database error occurred.' });
    }
}
