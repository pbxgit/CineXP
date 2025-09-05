// This is the upgraded, flexible serverless function.

exports.handler = async function(event, context) {
    const API_KEY = process.env.TMDB_API_KEY;
    const BASE_URL = 'https://api.themoviedb.org/3';

    // Get the type (movie/tv) and category (trending/popular) from the URL.
    const { type, category } = event.queryStringParameters;

    // --- Input Validation ---
    if (!type || !category) {
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ error: 'Missing "type" or "category" parameters.' })
        };
    }

    // --- Construct the correct TMDb API URL ---
    let endpoint = '';
    if (category === 'trending') {
        // Trending endpoint has a different structure
        endpoint = `${BASE_URL}/trending/${type}/week?api_key=${API_KEY}&language=en-US`;
    } else {
        // Standard endpoints like 'popular', 'top_rated', 'upcoming'
        endpoint = `${BASE_URL}/${type}/${category}?api_key=${API_KEY}&language=en-US`;
    }

    try {
        const response = await fetch(endpoint);
        if (!response.ok) { // Handle errors from TMDb API
            return { statusCode: response.status, body: await response.text() };
        }
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error.' })
        };
    }
};
