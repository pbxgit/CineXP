import { createClient } from '@vercel/kv';

// This is the main handler function
exports.handler = async function (event, context) {
  // Create a client to connect to your Upstash Redis database
  const kv = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  // We use a simple, hardcoded user ID for now. 
  // In a real app, this would be dynamic based on user login.
  const userId = 'user_123';
  const watchlistKey = `watchlist:${userId}`;

  // The HTTP method tells us what action to perform (GET, POST, DELETE)
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      // If it's a GET request, fetch the entire watchlist
      const watchlist = await kv.lrange(watchlistKey, 0, -1);
      return {
        statusCode: 200,
        body: JSON.stringify(watchlist || []), // Return empty array if null
      };
    } else if (method === 'POST') {
      // If it's a POST request, add a movie to the watchlist
      const movie = JSON.parse(event.body);
      // We use 'lpush' to add to the beginning of the list
      await kv.lpush(watchlistKey, JSON.stringify(movie));
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Movie added to watchlist' }),
      };
    } else if (method === 'DELETE') {
      // If it's a DELETE request, remove a movie from the watchlist
      const movieToRemove = JSON.parse(event.body);
      // 'lrem' removes matching elements from a list
      await kv.lrem(watchlistKey, 0, JSON.stringify(movieToRemove));
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Movie removed from watchlist' }),
      };
    }

    // If the method is not one of the above, return an error
    return { statusCode: 405, body: 'Method Not Allowed' };

  } catch (error) {
    console.error('Error with Upstash KV:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update watchlist' }),
    };
  }
};
