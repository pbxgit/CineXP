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
            const watchlist = await kv.lrange(WATCHLIST_KEY, 0, -1);
            return response.status(200).json(watchlist || []);
        } 
        
        else if (request.method === 'POST') {
            const item = request.body;
            if (!item || !item.id) return response.status(400).json({ message: 'Media item is required.' });
            await kv.lpush(WATCHLIST_KEY, JSON.stringify(item));
            return response.status(201).json({ message: 'Item added.' });
        } 
        
        // --- NEW DELETE METHOD ---
        else if (request.method === 'DELETE') {
            const { id } = request.query; // Get the ID from the URL (e.g., ?id=123)
            if (!id) return response.status(400).json({ message: 'Movie ID is required.' });

            // To remove an item, we get the whole list, filter it, then replace it.
            const allItems = await kv.lrange(WATCHLIST_KEY, 0, -1);
            const filteredItems = allItems.filter(item => JSON.parse(item).id !== parseInt(id, 10));

            await kv.del(WATCHLIST_KEY); // Delete the old list completely
            
            if (filteredItems.length > 0) {
                // If the new list isn't empty, push all its items back into the database.
                // The '...filteredItems' spreads the array into individual arguments for lpush.
                await kv.lpush(WATCHLIST_KEY, ...filteredItems);
            }
            return response.status(200).json({ message: 'Item removed.' });
        }
        
        else {
            response.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            return response.status(405).end(`Method ${request.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error with Vercel KV operation:", error);
        return response.status(500).json({ message: 'Database operation failed.' });
    }
}
