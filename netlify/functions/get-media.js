// This is our single, unified function to securely access the TMDb API.

exports.handler = async function(event, context) {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'API Key not found' }) };
    }

    const params = event.queryStringParameters;
    const endpoint = params.endpoint;

    // --- Security Whitelist ---
    // We only allow specific, pre-approved endpoints to be accessed.
    const allowedEndpoints = [
        'trending/all/week',
        'search/multi',
        // We will add more here later, like 'movie/{id}', 'tv/{id}', etc.
    ];
    
    // A simple check to see if the requested endpoint is in our allowed list.
    // We check `startsWith` to allow for dynamic IDs like 'movie/12345'.
    const isAllowed = allowedEndpoints.some(allowed => endpoint.startsWith(allowed.split('/{')[0]));

    if (!isAllowed) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Endpoint not allowed' }) };
    }
    // --- End Security ---

    // Build the final TMDb API URL
    const baseUrl = `https://api.themoviedb.org/3/${endpoint}`;
    const url = new URL(baseUrl);
    url.searchParams.append('api_key', apiKey);

    // Pass along any other parameters from the original request (like 'query' for search)
    for (const key in params) {
        if (key !== 'endpoint') {
            url.searchParams.append(key, params[key]);
        }
    }

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            // Forward TMDb's error status and message if something goes wrong
            const errorData = await response.json();
            return { statusCode: response.status, body: JSON.stringify(errorData) };
        }
        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data' })
        };
    }
};
