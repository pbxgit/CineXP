// In file: netlify/functions/search-media.js

exports.handler = async function(event, context) {
    const API_KEY = process.env.TMDB_API_KEY;
    const BASE_URL = 'https://api.themoviedb.org/3';

    // Get the search query from the URL parameters.
    const { query } = event.queryStringParameters;

    // --- Input Validation ---
    if (!query) {
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ error: 'Missing "query" parameter.' })
        };
    }

    // --- Construct the TMDb Search URL ---
    // The "multi" endpoint searches for movies, TV shows, and people in one request.
    const endpoint = `${BASE_URL}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;

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
            body: JSON.stringify({ error: 'Internal server error while searching.' })
        };
    }
};
