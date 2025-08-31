// ----- Start of FINAL DIAGNOSTIC api/tmdb.js code -----

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;

    const url = new URL(request.url, `http://${request.headers.host}`);
    const id = url.searchParams.get('id');
    const query = url.searchParams.get('query');
    const media_type = url.searchParams.get('media_type');
    
    // DEBUG LOG 1: Confirm the function is running and what parameters it sees.
    console.log(`Function invoked. Parsed params: id=${id}, query=${query}, media_type=${media_type}`);


    if (!tmdbApiKey) {
        console.error("FATAL: Server configuration error: TMDB_API_KEY is missing or undefined.");
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

// ... (Helper functions remain the same)

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
        // DEBUG LOG 2: Print the exact URL we are about to fetch.
        console.log("Attempting to fetch URL:", url);

        const apiResponse = await fetch(url);
        const data = await apiResponse.json();

        // DEBUG LOG 3: Print the full response data we got from TMDB.
        console.log("Received data from TMDB:", JSON.stringify(data, null, 2));

        if (!apiResponse.ok) {
            throw new Error(`TMDb API Error: Status ${apiResponse.status}`);
        }

        response.status(200).json(data);
    } catch (error) {
        console.error("Error in fetchAndRespond:", error);
        response.status(500).json({ message: 'Failed to fetch data from TMDb.' });
    }
}
// ----- End of FINAL DIAGNOSTIC api/tmdb.js code -----
