// api/tmdb.js - Final Version with TV Show Logic

export default async function handler(request) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const url = new URL(request.url, `http://${request.headers.host}`);
    const id = url.searchParams.get('id');
    const query = url.searchParams.get('query');
    const media_type = url.searchParams.get('media_type');

    if (!tmdbApiKey) {
        return new Response(JSON.stringify({ message: 'Server configuration error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        let apiUrl;

        if (id) {
            apiUrl = `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${tmdbApiKey}&language=en-US`;
        } else if (query) {
            apiUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`; // Use 'multi' for better search
        } else {
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
        return new Response(JSON.stringify({ message: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
