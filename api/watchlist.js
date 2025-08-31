import { Redis } from '@upstash/redis';

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

const WATCHLIST_KEY = 'user:main_watchlist';

export default async function handler(request, response) {
    try {
        if (request.method === 'GET') {
            const watchlist = await kv.lrange(WATCHLIST_KEY, 0, -1);
            return response.status(200).json(watchlist || []);
        } 
        
        else if (request.method === 'POST') {
            const itemToAdd = request.body;
            if (!itemToAdd || !itemToAdd.id) return response.status(400).json({ message: 'Media item is required.' });

            const allItems = await kv.lrange(WATCHLIST_KEY, 0, -1);
            const isAlreadyAdded = allItems.some(item => item.id === itemToAdd.id);

            if (isAlreadyAdded) return response.status(409).json({ message: 'Item already in watchlist.' });
            
            await kv.lpush(WATCHLIST_KEY, itemToAdd);
            return response.status(201).json({ message: 'Item added.' });
        } 
        
        else if (request.method === 'DELETE') {
            const { id } = request.query;
            if (!id) return response.status(400).json({ message: 'ID is required.' });

            const allItems = await kv.lrange(WATCHLIST_KEY, 0, -1);
            let itemToRemove = null;
            for (const item of allItems) {
                if (item.id === parseInt(id, 10)) {
                    itemToRemove = item;
                    break;
                }
            }

            if (itemToRemove) {
                // lrem removes all occurrences of a specific value.
                await kv.lrem(WATCHLIST_KEY, 0, itemToRemove);
                return response.status(200).json({ message: 'Item removed.' });
            } else {
                return response.status(404).json({ message: 'Item not found.' });
            }
        }
        
        else {
            response.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            return response.status(405).end(`Method ${request.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error with Upstash Redis:", error);
        return response.status(500).json({ message: 'Database operation failed.' });
    }
}
