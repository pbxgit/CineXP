// Vercel Serverless Function: /api/tmdb.js
// This version correctly handles all routes: popular lists, search, and single item details.

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    // Get all possible parameters from the request URL
    const { id, query, media_type } = request.query;

    if (!tmdbApiKey) {
        return response.status(500).json({ message: 'Server configuration error.' });
    }

    // --- ROUTING LOGIC ---
    if (id) {
        // If an ID is present, fetch the details for that single item.
        // We MUST pass the media_type to the handler.
        await getMediaDetails(id, media_type || 'movie', tmdbApiKey, response);
    } else if (query) {
        // If a query is present, perform a search.
        await getSearchResults(query, tmdbApiKey, response);
    } else {
        // Otherwise, fetch a popular list based on media_type.
        if (media_type === 'tv') {
            await getPopularShows(tmdbApiKey, response);
        } else {
            await getPopularMovies(tmdbApiKey, response);
        }
    }
}

// --- HANDLER for a SINGLE MOVIE or TV SHOW's details ---
async function getMediaDetails(id, mediaType, apiKey, response) {
    // THE FIX: This URL is now dynamic and uses the correct mediaType ('movie' or 'tv').
    const url = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${apiKey}&language=en-US`;
    await fetchAndRespond(url, response);
}

// --- HANDLER for POPULAR MOVIES ---
async function getPopularMovies(apiKey, response) {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
    await fetchAndRespond(url, response);
}

// --- HANDLER for POPULAR TV SHOWS ---
async function getPopularShows(apiKey, response) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const formattedDate = twoYearsAgo.toISOString().split('T')[0];
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&first_air_date.gte=${formattedDate}&page=1`;
    await fetchAndRespond(url, response);
}

// --- HANDLER for SEARCH RESULTS ---
async function getSearchResults(query, apiKey, response) {
    // Note: This currently only searches for movies. We can upgrade this later.
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    await fetchAndRespond(url, response);
}

// --- SHARED UTILITY FUNCTION ---
// A single, reliable function to fetch data from any TMDb URL and send the response.
async function fetchAndRespond(url, response) {
    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) {
            throw new Error(`TMDb API Error: Status ${apiResponse.status} for URL: ${url}`);
        }
        const data = await apiResponse.json();
        response.status(200).json(data);
    } catch (error) {
        console.error("Error in fetchAndRespond:", error);
        response.status(500).json({ message: 'Failed to fetch data from TMDb.' });
    }
}
