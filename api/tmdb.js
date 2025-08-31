// Vercel Serverless Function: /api/tmdb.js
// Upgraded to integrate TMDb with Rating Poster DB (RPDB)

export default async function handler(request, response) {
    // 1. Securely access API keys from Vercel Environment Variables
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const rpdbApiKey = process.env.RPDB_API_KEY;

    // A crucial check to ensure the server is configured correctly.
    if (!tmdbApiKey || !rpdbApiKey) {
        console.error("API keys are missing from environment variables.");
        return response.status(500).json({ message: 'Server configuration error: API keys are not set.' });
    }

    const popularMoviesUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=1`;

    try {
        // 2. Fetch the initial list of popular movies from TMDb
        const popularResponse = await fetch(popularMoviesUrl);
        if (!popularResponse.ok) {
            throw new Error(`TMDb API (popular) returned status: ${popularResponse.status}`);
        }
        const popularData = await popularResponse.json();

        // 3. For each movie, create a "promise" to fetch its full details.
        // We need the details to get the movie's IMDb ID.
        const detailPromises = popularData.results.map(movie => {
            const detailUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${tmdbApiKey}&language=en-US`;
            // We fetch and immediately ask for the JSON response.
            return fetch(detailUrl).then(res => {
                if (!res.ok) {
                    console.warn(`Failed to fetch details for movie ID ${movie.id}. Skipping.`);
                    return null; // Return null for failed requests to avoid breaking Promise.all
                }
                return res.json();
            });
        });

        // 4. Execute all the detail fetches in parallel for maximum speed.
        const moviesWithDetails = await Promise.all(detailPromises);
        
        // Filter out any null results from failed detail fetches
        const validMoviesWithDetails = moviesWithDetails.filter(Boolean);

        // 5. Create a new, "enriched" list of movies.
        // This is where we add our custom, high-quality poster URL.
        const enrichedMovies = validMoviesWithDetails.map(movie => {
            // Set a default poster from TMDb as a fallback.
            let posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

            // If an IMDb ID exists, construct the superior RPDB URL.
            if (movie.imdb_id) {
                posterUrl = `https://api.ratingposterdb.com/${rpdbApiKey}/imdb/${movie.imdb_id}.jpg`;
            }

            // Return a new object that includes all original movie data (...)
            // plus our new, definitive poster URL field.
            return {
                ...movie,
                poster_url_high_quality: posterUrl
            };
        });
        
        // 6. Send the final, enriched data back to our frontend app.
        response.status(200).json({ results: enrichedMovies });

    } catch (error) {
        console.error('Error in tmdb serverless function:', error);
        response.status(500).json({ message: 'Failed to fetch and process movie data.' });
    }
}
