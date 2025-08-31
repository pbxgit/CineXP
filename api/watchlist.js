import { createClient } from '@vercel/kv';

const WATCHLIST_KEY = 'user:main_watchlist';

function getKvClient() { return createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN }); }

export default async function handler(request, response) {
    const kv = getKvClient();
    try {
        if (request.method === 'GET') {
            const watchlist = await kv.lrange(WATCHLIST_KEY, 0, -1);
            return response.status(200).json(watchlist || []);
        } 
        
        else if (request.method === 'POST') {
            const itemToAdd = request.body;
            if (!itemToAdd || !itemToAdd.id) return response.status(400).json({ message: 'Media item is required.' });

            // --- DUPLICATE PREVENTION LOGIC ---
            const allItems = await kv.lrange(WATCHLIST_KEY, 0, -1);
            const isAlreadyAdded = allItems.some(item => JSON.parse(item).id === itemToAdd.id);

            if (isAlreadyAdded) {
                return response.status(409).json({ message: 'Item is already in the watchlist.' }); // 409 Conflict
            }
            
            await kv.lpush(WATCHLIST_KEY, JSON.stringify(itemToAdd));
            return response.status(201).json({ message: 'Item added.' });
        } 
        
        else if (request.method === 'DELETE') {
            const { id } = request.query;
            if (!id) return response.status(400).json({ message: 'Movie ID is required.' });

            const allItems = await kv.lrange(WATCHLIST_KEY, 0, -1);
            const filteredItems = allItems.filter(item => JSON.parse(item).id !== parseInt(id, 10));

            await kv.del(WATCHLIST_KEY);
            if (filteredItems.length > 0) {
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
