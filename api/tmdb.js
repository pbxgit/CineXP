// api/tmdb.js - V1 (Renewed & Stable)

export default async function handler(request) {
    // Securely retrieve the API key from environment variables.
    const tmdbApiKey = process.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
        return new Response(JSON.stringify({ message: 'Server configuration error: Missing TMDB API Key.' }), { status: 500 });
    }

    const url = new URL(request.url, `http://${request.headers.host}`);
    
    // Extract parameters from the incoming request.
    const id = url.searchParams.get('id');
    const query = url.searchParams.get('query');
    const media_type = url.searchParams.get('media_type');
    const endpoint = url.searchParams.get('endpoint');

    try {
        let apiUrl;
        const baseUrl = 'https://api.themoviedb.org/3';

        if (id) {
            // Fetch details for a specific movie or show.
            apiUrl = `${baseUrl}/${media_type}/${id}?api_key=${tmdbApiKey}&language=en-US`;
        } else if (query) {
            // Perform a multi-search for movies and shows.
            apiUrl = `${baseUrl}/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
        } else if (endpoint === 'top_rated') {
            // Fetch the top-rated movies list.
            apiUrl = `${baseUrl}/movie/top_rated?api_key=${tmdbApiKey}&language=en-US&page=1`;
        } else {
            // Default to fetching popular movies or tv shows.
            apiUrl = `${baseUrl}/${media_type || 'movie'}/popular?api_key=${tmdbApiKey}&language=en-US&page=1`;
        }
        
        const apiResponse = await fetch(apiUrl);

        if (!apiResponse.ok) {
            throw new Error(`TMDb API Error: Status ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        
        return new Response(JSON.stringify(data), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        console.error('TMDB API Function Error:', error);
        return new Response(JSON.stringify({ message: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
