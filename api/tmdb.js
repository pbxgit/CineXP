// ----- Start of FINAL api/tmdb.js code -----

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;

    // --- THIS IS THE FIX ---
    // We create a URL object from the incoming request URL
    // and then get the search parameters from it.
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const query = url.searchParams.get('query');
    const media_type = url.searchParams.get('media_type');
    // --- END OF THE FIX ---

    if (!tmdbApiKey) {
        return response.status(500).json({ message: 'Server configuration error: TMDB_API_KEY is missing.' });
    }

    if (id) {
        await getMediaDetails(id, media_type || 'movie', tmdbApiKey, response);
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
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    await fetchAndRespond(url, response);
}

async function fetchAndRespond(url, response) {
    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) {
            throw new Error(`TMDb API Error: Status ${apiResponse.status}`);
        }
        const data = await apiResponse.json();
        response.status(200).json(data);
    } catch (error) {
        response.status(500).json({ message: 'Failed to fetch data from TMDb.' });
    }
}
// ----- End of FINAL api/tmdb.js code -----
