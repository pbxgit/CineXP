// =====================================================
// Personal Cinema - Serverless Function: update-watchlist (No Auth)
// =====================================================

const { createClient } = require('@vercel/kv');

function getDbClient() {
  return createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

exports.handler = async (event) => {
  // Use a single, global key for the public watchlist.
  const watchlistKey = `watchlist:global`;
  const db = getDbClient();
  const { httpMethod } = event;

  try {
    switch (httpMethod) {
      case 'GET': {
        const items = await db.smembers(watchlistKey);
        return {
          statusCode: 200,
          body: JSON.stringify(items.map(item => JSON.parse(item))),
        };
      }
      case 'POST': {
        const item = JSON.parse(event.body);
        if (!item || !item.id) throw new Error('Invalid item data.');
        await db.sadd(watchlistKey, JSON.stringify(item));
        return { statusCode: 200, body: JSON.stringify({ message: 'Item added.' }) };
      }
      case 'DELETE': {
        const item = JSON.parse(event.body);
        if (!item || !item.id) throw new Error('Invalid item data.');
        await db.srem(watchlistKey, JSON.stringify(item));
        return { statusCode: 200, body: JSON.stringify({ message: 'Item removed.' }) };
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
