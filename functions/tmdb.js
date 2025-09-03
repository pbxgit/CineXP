// functions/tmdb.js
exports.handler = async function(event) {
    const { endpoint, params } = event.queryStringParameters;
    const { TMDB_API_KEY } = process.env;

    if (!TMDB_API_KEY) {
        return { statusCode: 500, body: 'TMDB API Key not found.' };
    }

    const url = `https://api.themoviedb.org/3${endpoint}?api_key=${TMDB_API_KEY}&${params}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return { statusCode: 200, body: JSON.stringify(data) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch data' }) };
    }
};
