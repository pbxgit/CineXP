exports.handler = async function(event) {
    const { endpoint, queryParams } = event.queryStringParameters;
    const apiKey = process.env.TMDB_API_KEY;
    
    if (!apiKey) {
        return { statusCode: 500, body: 'API key not configured.' };
    }

    const apiUrl = `https://api.themoviedb.org/3${endpoint}?api_key=${apiKey}&${queryParams}`;

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
            body: JSON.stringify({ error: 'Failed to fetch data from TMDb' }),
        };
    }
};
