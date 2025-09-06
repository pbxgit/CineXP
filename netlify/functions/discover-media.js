// In file: netlify/functions/discover-media.js

exports.handler = async function(event, context) {
    const API_KEY = process.env.TMDB_API_KEY;
    const BASE_URL = 'https://api.themoviedb.org/3';

    const { media_type, ...queryParams } = event.queryStringParameters;

    if (!media_type) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing media_type parameter.' }) };
    }

    const params = new URLSearchParams(queryParams);
    params.append('api_key', API_KEY);
    params.append('language', 'en-US');

    const endpoint = `${BASE_URL}/discover/${media_type}?${params.toString()}`;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            return { statusCode: response.status, body: await response.text() };
        }
        const data = await response.json();
        return { statusCode: 200, body: JSON.stringify(data) };
    } catch (error) {
        console.error('Error in discover-media function:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error.' }) };
    }
};
