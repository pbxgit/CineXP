// Vercel Serverless Function: /api/tmdb.js
// Corrected version that properly handles all routes without errors.

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const { id, query } = request.query;

    if (!tmdbApiKey) {
        console.error("CRITICAL: TMDB_API_KEY is not set in environment variables.");
        return response.status(500).json({ message: 'Server configuration error.' });
    }

    // --- ROUTING LOGIC ---
    if (id) {
        await getMovieDetails(id, tmdbApiKey, response);
    } else if (query) {
        await getSearchResults(query, tmdbApiKey, response);
    } else {
        await getPopularMovies(tmdbApiKey, response);
    }
}

// --- HANDLER for POPULAR MOVIES ---
async function getPopularMovies(apiKey, response) {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) throw new Error(`TMDb API Error: ${apiResponse.status}`);
        
        const data = await apiResponse.json();
        response.status(200).json(data);
    } catch (error) {
        console.error("Error in getPopularMovies:", error);
        response.status(500).json({ message: 'Failed to fetch popular movies.' });
    }
}

// --- HANDLER for MOVIE DETAILS ---
async function getMovieDetails(id, apiKey, response) {
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`;
    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) throw new Error(`TMDb API Error: ${apiResponse.status}`);
        
        const data = await apiResponse.json();
        response.status(200).json(data);
    } catch (error) {
        console.error("Error in getMovieDetails:", error);
        response.status(500).json({ message: 'Failed to fetch movie details.' });
    }
}

// --- HANDLER for SEARCH RESULTS ---
async function getSearchResults(query, apiKey, response) {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) throw new Error(`TMDb API Error: ${apiResponse.status}`);
        
        const data = await apiResponse.json();
        response.status(200).json(data);
    } catch (error) {
        console.error("Error in getSearchResults:", error);
        response.status(500).json({ message: 'Failed to fetch search results.' });
    }
}
