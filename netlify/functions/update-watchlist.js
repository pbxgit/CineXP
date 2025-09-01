// CORRECTION: Use 'require' instead of 'import'
const { createClient } = require('@vercel/kv');

exports.handler = async function (event, context) {
  const kv = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  const userId = 'user_123';
  const watchlistKey = `watchlist:${userId}`;
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const watchlist = await kv.lrange(watchlistKey, 0, -1);
      return {
        statusCode: 200,
        body: JSON.stringify(watchlist || []),
      };
    } else if (method === 'POST') {
      const movie = JSON.parse(event.body);
      await kv.lpush(watchlistKey, JSON.stringify(movie));
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Movie added to watchlist' }),
      };
    } else if (method === 'DELETE') {
      const movieToRemove = JSON.parse(event.body);
      await kv.lrem(watchlistKey, 0, JSON.stringify(movieToRemove));
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Movie removed from watchlist' }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };

  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to update watchlist. Reason: ${error.message}` }),
    };
  }
};
