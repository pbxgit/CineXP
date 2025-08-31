// Vercel Serverless Function: /api/tmdb.js
// Handles popular movies, TV shows, details, and search.

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const { id, query, media_type } = request.query; // Added media_type

    if (!tmdbApiKey) {
        return response.status(500).json({ message: 'Server configuration error.' });
    }

    // --- ROUTING LOGIC ---
    if (id) {
        // Note: Detail fetching will need a media_type later too, but this is fine for now.
        await getMovieDetails(id, tmdbApiKey, response); 
    } else if (query) {
        await getSearchResults(query, tmdbApiKey, response);
    } else {
        // DEFAULT TO HOMEPAGE aPI
        if (media_type === 'tv') {
            await getPopularShows(tmdbApiKey, response);
        } else {
            await getPopularMovies(tmdbApiKey, response);
        }
    }
}

// --- HANDLERS ---
async function getPopularMovies(apiKey, response) {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
    await fetchAndRespond(url, response);
}

async function getPopularShows(apiKey, response) {
    const url = `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=en-US&page=1`;
    await fetchAndRespond(url, response);
}

async function getMovieDetails(id, apiKey, response) {
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`;
    await fetchAndRespond(url, response);
}

async function getSearchResults(query, apiKey, response) {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    await fetchAndRespond(url, response);
}

// --- UTILITY FUNCTION ---
async function fetchAndRespond(url, response) {
    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) throw new Error(`TMDb API Error: ${apiResponse.status}`);
        const data = await apiResponse.json();
        response.status(200).json(data);
    } catch (error) {
        console.error("Error fetching from TMDb:", error);
        response.status(500).json({ message: 'Failed to fetch data from TMDb.' });
    }
}
