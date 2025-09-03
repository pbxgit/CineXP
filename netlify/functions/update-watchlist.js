// =====================================================
// Personal Cinema - Serverless Function: update-watchlist
// =====================================================

const { createClient } = require('@vercel/kv');

// Helper to initialize the database client
function getDbClient() {
  return createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

exports.handler = async (event, context) => {
  // 1. Secure the function: Ensure a user is logged in.
  const { user } = context.clientContext;
  if (!user) {
    return {
      statusCode: 401, // Unauthorized
      body: JSON.stringify({ error: 'Authentication is required.' }),
    };
  }
  
  // Use the user's unique ID as the key for their personal watchlist.
  const watchlistKey = `watchlist:${user.sub}`;
  const db = getDbClient();
  const { httpMethod } = event;

  try {
    switch (httpMethod) {
      case 'GET': {
        // SMEMBERS fetches all items from a Set.
        const items = await db.smembers(watchlistKey);
        return {
          statusCode: 200,
          body: JSON.stringify(items.map(item => JSON.parse(item))), // Parse back to objects
        };
      }

      case 'POST': {
        const item = JSON.parse(event.body);
        if (!item || !item.id) throw new Error('Invalid item data provided.');
        
        // SADD adds a unique item to the Set. Duplicates are ignored.
        await db.sadd(watchlistKey, JSON.stringify(item));
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Item added to watchlist.' }),
        };
      }

      case 'DELETE': {
        const item = JSON.parse(event.body);
        if (!item || !item.id) throw new Error('Invalid item data provided.');
        
        // SREM removes a specific item from the Set.
        await db.srem(watchlistKey, JSON.stringify(item));
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Item removed from watchlist.' }),
        };
      }

      default:
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
  } catch (error) {
    console.error('Watchlist function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to update watchlist. Reason: ${error.message}` }),
    };
  }
};
