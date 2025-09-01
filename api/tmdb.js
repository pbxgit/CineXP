// api/tmdb.js - The Definitive, Robust Serverless Function

export default async function handler(request) {
    const tmdbApiKey = process.env.TMDB_API_KEY;

    // Use a base URL for robust URL parsing on the server
    const url = new URL(request.url, `http://${request.headers.host}`);
    const id = url.searchParams.get('id');
    const query = url.searchParams.get('query');
    const media_type = url.searchParams.get('media_type');

    if (!tmdbApiKey) {
        return new Response(JSON.stringify({ message: 'Server configuration error: TMDB_API_KEY is missing.' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        let apiUrl;

        if (id) {
            // Fetch details for a single movie
            apiUrl = `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${tmdbApiKey}&language=en-US`;
        } else if (query) {
            // Fetch search results
            apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
        } else {
            // Default to popular movies
             apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=1`;
        }
        
        const apiResponse = await fetch(apiUrl);

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.json();
            throw new Error(`TMDb API Error: ${errorBody.status_message || apiResponse.statusText}`);
        }

        const data = await apiResponse.json();
        
        return new Response(JSON.stringify(data), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Error in tmdb.js function:", error);
        return new Response(JSON.stringify({ message: error.message || 'Failed to fetch data from TMDb.' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
