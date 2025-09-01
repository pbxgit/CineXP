// api/tmdb.js - Final Version with TV Show & Endpoint Logic

export default async function handler(request) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const url = new URL(request.url, `http://${request.headers.host}`);
    
    // Read all possible parameters from the URL
    const id = url.searchParams.get('id');
    const query = url.searchParams.get('query');
    const media_type = url.searchParams.get('media_type');
    const endpoint = url.searchParams.get('endpoint'); // The new parameter

    if (!tmdbApiKey) {
        return new Response(JSON.stringify({ message: 'Server configuration error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        let apiUrl;

        if (id) {
            apiUrl = `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${tmdbApiKey}&language=en-US`;
        } else if (query) {
            apiUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
        
        // --- THIS IS THE NEW LOGIC BLOCK ---
        // If an 'endpoint' parameter is provided, use it to fetch a specific list.
        } else if (endpoint === 'top_rated') {
            apiUrl = `https://api.themoviedb.org/3/movie/top_rated?api_key=${tmdbApiKey}&language=en-US&page=1`;
        
        } else {
            // This is the original logic for popular movies/shows
            if (media_type === 'tv') {
                apiUrl = `https://api.themoviedb.org/3/tv/popular?api_key=${tmdbApiKey}&language=en-US&page=1`;
            } else {
                apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=1`;
            }
        }
        
        const apiResponse = await fetch(apiUrl);
        if (!apiResponse.ok) throw new Error(`TMDb API Error: Status ${apiResponse.status}`);

        const data = await apiResponse.json();
        return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('TMDB API Function Error:', error);
        return new Response(JSON.stringify({ message: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
