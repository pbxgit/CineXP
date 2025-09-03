// netlify/functions/tmdb.js
exports.handler = async function(event, context) {
    const { path } = event.queryStringParameters;
    const apiKey = process.env.TMDB_API_KEY;
    const apiUrl = `https://api.themoviedb.org/3${path}?api_key=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data' }),
        };
    }
};
