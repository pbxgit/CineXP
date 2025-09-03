// This is our single, unified function to securely access the TMDb API.

exports.handler = async function(event, context) {
    // This safely pulls your TMDB_API_KEY from Netlify's environment variables.
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'API Key not found on server' }) };
    }

    const params = event.queryStringParameters;
    const endpoint = params.endpoint;

    // --- Security Whitelist ---
    // This is the list of TMDb endpoints our app is allowed to use.
    // For our current homepage, we absolutely need 'movie/popular' and 'tv/top_rated'.
    const allowedEndpoints = [
        'movie/popular',
        'tv/top_rated',
        'trending/all/week', // (Good to have for later)
        'search/multi'       // (Good to have for later)
    ];
    
    const isAllowed = allowedEndpoints.some(allowed => endpoint.startsWith(allowed.split('/{')[0]));

    if (!isAllowed) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: The requested endpoint is not allowed.' }) };
    }
    // --- End Security ---

    // Build the final TMDb API URL
    const baseUrl = `https://api.themoviedb.org/3/${endpoint}`;
    const url = new URL(baseUrl);
    url.searchParams.append('api_key', apiKey);

    for (const key in params) {
        if (key !== 'endpoint') {
            url.searchParams.append(key, params[key]);
        }
    }

    try {
        const response = await fetch(url.toString());
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data from TMDb' })
        };
    }
};
