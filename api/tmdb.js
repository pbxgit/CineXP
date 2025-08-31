// ----- Start of THE FINAL, CORRECTED api/tmdb.js -----

export default async function handler(request) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const url = new URL(request.url, `http://${request.headers.host}`);
    const id = url.searchParams.get('id');
    const query = url.searchParams.get('query');
    const media_type = url.searchParams.get('media_type');

    if (!tmdbApiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Server configuration error: TMDB_API_KEY is missing.' })
        };
    }

    try {
        let data;
        if (id) {
            data = await getMediaDetails(id, media_type || 'movie', tmdbApiKey);
        } else if (query) {
            data = await getSearchResults(query, tmdbApiKey);
        } else {
            if (media_type === 'tv') {
                data = await getPopularShows(tmdbApiKey);
            } else {
                data = await getPopularMovies(tmdbApiKey);
            }
        }
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message || 'Failed to fetch data from TMDb.' })
        };
    }
}

async function fetchAndRespond(url) {
    const apiResponse = await fetch(url);
    if (!apiResponse.ok) {
        const errorData = await apiResponse.json(); // Try to get error details from TMDB
        throw new Error(`TMDb API Error: Status ${apiResponse.status} - ${errorData.status_message}`);
    }
    return apiResponse.json();
}

async function getMediaDetails(id, mediaType, apiKey) {
    const url = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${apiKey}&language=en-US`;
    return fetchAndRespond(url);
}

async function getPopularMovies(apiKey) {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
    return fetchAndRespond(url);
}

async function getPopularShows(apiKey) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const formattedDate = twoYearsAgo.toISOString().split('T')[0];
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&first_air_date.gte=${formattedDate}&page=1`;
    return fetchAndRespond(url);
}

async function getSearchResults(query, apiKey) {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    return fetchAndRespond(url);
}

// ----- End of THE FINAL, CORRECTED api/tmdb.js -----
