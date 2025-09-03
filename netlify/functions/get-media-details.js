exports.handler = async function(event, context) {
    const API_KEY = process.env.TMDB_API_KEY;
    const BASE_URL = 'https://api.themoviedb.org/3';
    const { type, id } = event.queryStringParameters;

    if (!type || !id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing type or id' }) };
    }
    const endpoint = `${BASE_URL}/${type}/${id}?api_key=${API_KEY}`;
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        return { statusCode: 200, body: JSON.stringify(data) };
    } catch (error) {
        return { statusCode: 502, body: JSON.stringify({ error: 'Failed to fetch details' }) };
    }
};
