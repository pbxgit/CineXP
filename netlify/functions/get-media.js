// =====================================================
// Personal Cinema - Serverless Function: get-media
// =====================================================

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * A centralized fetch handler for the TMDB API.
 * @param {string} path - The API endpoint path (e.g., '/movie/popular').
 * @param {string} [queryParams=''] - Additional query parameters.
 * @returns {Promise<object>} The JSON response from the API.
 */
async function fetchFromTMDB(path, queryParams = '') {
  const url = `${TMDB_BASE_URL}${path}?api_key=${TMDB_API_KEY}&language=en-US&${queryParams}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch From TMDB Error:', error);
    throw error;
  }
}

exports.handler = async (event) => {
  const { endpoint, type, id, query } = event.queryStringParameters;

  if (!endpoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Endpoint parameter is required.' }),
    };
  }

  try {
    let data;
    switch (endpoint) {
      case 'trending_movies':
        data = await fetchFromTMDB('/trending/movie/week');
        break;
      
      case 'popular_tv':
        data = await fetchFromTMDB('/tv/popular');
        break;

      case 'top_rated_movies':
        data = await fetchFromTMDB('/movie/top_rated');
        break;

      case 'details':
        if (!type || !id) {
          throw new Error('Type and ID are required for the details endpoint.');
        }
        // Efficiently fetch details, credits, recommendations, and images in a single call.
        const appendToResponse = 'credits,recommendations,images,videos';
        data = await fetchFromTMDB(`/${type}/${id}`, `append_to_response=${appendToResponse}`);
        break;

      // You can add more endpoints here later, like 'search'.
      
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Handler Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to fetch media data. Reason: ${error.message}` }),
    };
  }
};
