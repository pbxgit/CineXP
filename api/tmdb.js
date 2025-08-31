// Vercel Serverless Function: /api/tmdb.js (Robust & Simplified Version)

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const rpdbApiKey = process.env.RPDB_API_KEY;
    const { id } = request.query;

    if (!tmdbApiKey || !rpdbApiKey) {
        console.error("CRITICAL: API keys are missing.");
        return response.status(500).json({ message: 'Server configuration error.' });
    }

    if (id) {
        // This part for the detail page is fine, no changes needed here.
        await getMovieDetails(id, tmdbApiKey, rpdbApiKey, response);
    } else {
        await getPopularMovies(tmdbApiKey, rpdbApiKey, response);
    }
}

async function getMovieDetails(id, tmdbApiKey, rpdbApiKey, response) {
    const detailUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${tmdbApiKey}&language=en-US`;
    try {
        const detailResponse = await fetch(detailUrl);
        if (!detailResponse.ok) throw new Error('Failed to fetch TMDb details');
        
        const movie = await detailResponse.json();
        if (movie.imdb_id) {
            movie.poster_url_high_quality = `https://api.ratingposterdb.com/${rpdbApiKey}/imdb/${movie.imdb_id}.jpg`;
        }
        response.status(200).json(movie);

    } catch (error) {
        response.status(500).json({ message: `Failed to fetch details for movie ID ${id}.` });
    }
}

// THIS IS THE NEW, SIMPLIFIED FUNCTION
async function getPopularMovies(tmdbApiKey, rpdbApiKey, response) {
    console.log("[getPopularMovies] Starting to fetch popular movies.");
    const popularMoviesUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=1`;
    
    try {
        const popularResponse = await fetch(popularMoviesUrl);
        if (!popularResponse.ok) throw new Error('Failed to fetch initial popular movies list from TMDb');
        
        const popularData = await popularResponse.json();
        const enrichedMovies = [];

        // Use a simple, sequential for...of loop for reliability
        for (const basicMovie of popularData.results) {
            try {
                const detailUrl = `https://api.themoviedb.org/3/movie/${basicMovie.id}?api_key=${tmdbApiKey}`;
                const detailRes = await fetch(detailUrl);

                if (!detailRes.ok) {
                    console.warn(`Could not fetch details for movie: ${basicMovie.title}. Skipping.`);
                    continue; // Skip to the next movie
                }

                const detailedMovie = await detailRes.json();
                let posterUrl = `https://image.tmdb.org/t/p/w500${detailedMovie.poster_path}`;
                let posterSource = 'TMDb';

                if (detailedMovie.imdb_id) {
                    posterUrl = `https://api.ratingposterdb.com/${rpdbApiKey}/imdb/${detailedMovie.imdb_id}.jpg`;
                    posterSource = 'RPDB';
                } else {
                    console.warn(`No IMDb ID for ${detailedMovie.title}. Using TMDb poster.`);
                }
                
                enrichedMovies.push({
                    ...detailedMovie,
                    poster_url_high_quality: posterUrl,
                    debug_poster_source: posterSource
                });

            } catch (loopError) {
                console.error(`Error processing movie '${basicMovie.title}' inside loop:`, loopError);
                // Continue to the next movie even if one fails
            }
        }
        
        console.log(`[getPopularMovies] Successfully processed ${enrichedMovies.length} movies.`);
        response.status(200).json({ results: enrichedMovies });

    } catch (error) {
        console.error('[getPopularMovies] A critical error occurred:', error);
        response.status(500).json({ message: 'Failed to fetch popular movies.' });
    }
}
