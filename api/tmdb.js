// Vercel Serverless Function: /api/tmdb.js
// Uses the powerful 'discover' endpoint for relevant TV shows.

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const { id, query, media_type } = request.query;

    if (!tmdbApiKey) {
        return response.status(500).json({ message: 'Server configuration error.' });
    }

    if (id) {
        // This will be upgraded in the next step to handle TV details too
        await getMovieDetails(id, media_type || 'movie', tmdbApiKey, response); 
    } else if (query) {
        await getSearchResults(query, tmdbApiKey, response);
    } else {
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

// THIS IS THE NEW, IMPROVED FUNCTION
async function getPopularShows(apiKey, response) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const formattedDate = twoYearsAgo.toISOString().split('T')[0];

    // Use the 'discover' endpoint for much better results
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&first_air_date.gte=${formattedDate}&page=1`;
    await fetchAndRespond(url, response);
}

async function getMovieDetails(id, media_type, apiKey, response) {
    const url = `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${apiKey}&language=en-US`;
    await fetchAndRespond(url, response);
}

async function getSearchResults(query, apiKey, response) {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    await fetchAndRespond(url, response);
}

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
