// Vercel Serverless Function: /api/tmdb.js (Hardened Diagnostic Version)

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const rpdbApiKey = process.env.RPDB_API_KEY;
    const { id } = request.query;

    if (!tmdbApiKey || !rpdbApiKey) {
        console.error("CRITICAL: API keys are missing from environment variables.");
        return response.status(500).json({ message: 'Server configuration error: API keys are not set.' });
    }

    if (id) {
        await getMovieDetails(id, tmdbApiKey, rpdbApiKey, response);
    } else {
        await getPopularMovies(tmdbApiKey, rpdbApiKey, response);
    }
}

async function getMovieDetails(id, tmdbApiKey, rpdbApiKey, response) {
    const detailUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${tmdbApiKey}&language=en-US`;
    try {
        const detailResponse = await fetch(detailUrl);
        if (!detailResponse.ok) throw new Error('Failed to fetch movie details from TMDb');
        
        const movie = await detailResponse.json();
        let posterSource = 'TMDb'; // Default debug source

        if (movie.imdb_id) {
            console.log(`[getMovieDetails] Found IMDb ID for '${movie.title}': ${movie.imdb_id}`);
            movie.poster_url_high_quality = `https://api.ratingposterdb.com/${rpdbApiKey}/imdb/${movie.imdb_id}.jpg`;
            posterSource = 'RPDB';
        } else {
            console.warn(`[getMovieDetails] IMDb ID missing for '${movie.title}'. Falling back to TMDb poster.`);
        }
        
        movie.debug_poster_source = posterSource; // Add the debug field
        response.status(200).json(movie);

    } catch (error) {
        console.error(`[getMovieDetails] Error fetching details for movie ID ${id}:`, error);
        response.status(500).json({ message: `Failed to fetch details for movie ID ${id}.` });
    }
}

async function getPopularMovies(tmdbApiKey, rpdbApiKey, response) {
    const popularMoviesUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=1`;
    try {
        const popularResponse = await fetch(popularMoviesUrl);
        if (!popularResponse.ok) throw new Error('Failed to fetch popular movies');
        
        const popularData = await popularResponse.json();
        
        const detailPromises = popularData.results.map(movie => 
            fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${tmdbApiKey}`)
            .then(res => res.ok ? res.json() : null)
        );
        const moviesWithDetails = (await Promise.all(detailPromises)).filter(Boolean);

        const enrichedMovies = moviesWithDetails.map(movie => {
            let posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
            let posterSource = 'TMDb'; // Default debug source

            if (movie.imdb_id) {
                console.log(`[getPopularMovies] Found IMDb ID for '${movie.title}': ${movie.imdb_id}`);
                posterUrl = `https://api.ratingposterdb.com/${rpdbApiKey}/imdb/${movie.imdb_id}.jpg`;
                posterSource = 'RPDB';
            } else {
                console.warn(`[getPopularMovies] IMDb ID missing for '${movie.title}'. Falling back to TMDb poster.`);
            }

            return { 
                ...movie, 
                poster_url_high_quality: posterUrl,
                debug_poster_source: posterSource // Add the debug field
            };
        });
        
        response.status(200).json({ results: enrichedMovies });

    } catch (error) {
        console.error('[getPopularMovies] Error fetching popular movies:', error);
        response.status(500).json({ message: 'Failed to fetch popular movies.' });
    }
}
