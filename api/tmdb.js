export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const { id, query, media_type } = request.query;

    if (!tmdbApiKey) {
        return response.status(500).json({ message: 'Server configuration error: TMDB_API_KEY is missing.' });
    }

    if (id) {
        // Route to get details for a single item
        await getMediaDetails(id, media_type || 'movie', tmdbApiKey, response);
    } else if (query) {
        // Route to get search results
        await getSearchResults(query, tmdbApiKey, response);
    } else {
        // Default route to get popular lists
        if (media_type === 'tv') {
            await getPopularShows(tmdbApiKey, response);
        } else {
            await getPopularMovies(tmdbApiKey, response);
        }
    }
}

async function getMediaDetails(id, mediaType, apiKey, response) {
    const url = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${apiKey}&language=en-US`;
    await fetchAndRespond(url, response);
}

async function getPopularMovies(apiKey, response) {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
    await fetchAndRespond(url, response);
}

async function getPopularShows(apiKey, response) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const formattedDate = twoYearsAgo.toISOString().split('T')[0];
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&first_air_date.gte=${formattedDate}&page=1`;
    await fetchAndRespond(url, response);
}

async function getSearchResults(query, apiKey, response) {
    // Note: This currently only searches for movies. This can be upgraded later.
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    await fetchAndRespond(url, response);
}

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
