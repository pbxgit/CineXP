// Vercel Serverless Function: /api/poster.js
// This function's only job is to find the best poster for a given movie ID and redirect to it.

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const rpdbApiKey = process.env.RPDB_API_KEY;
    const { id } = request.query; // Movie ID from the request

    if (!id) {
        return response.status(400).json({ message: 'Movie ID is required.' });
    }

    try {
        // 1. Fetch details for this specific movie from TMDb to get its IMDb ID
        const detailUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${tmdbApiKey}`;
        const detailRes = await fetch(detailUrl);

        if (!detailRes.ok) {
            // If details can't be fetched, we can't find the poster
            throw new Error('Could not fetch movie details from TMDb.');
        }

        const movie = await detailRes.json();
        let finalPosterUrl;

        // 2. Try to build the RPDB URL first
        if (movie.imdb_id) {
            finalPosterUrl = `https://api.ratingposterdb.com/${rpdbApiKey}/imdb/${movie.imdb_id}.jpg`;
        } 
        // 3. If that fails, fall back to the standard TMDb poster
        else if (movie.poster_path) {
            finalPosterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        }
        // 4. If all else fails, use a placeholder
        else {
            finalPosterUrl = 'https://via.placeholder.com/500x750.png?text=No+Image';
        }

        // 5. Instead of sending JSON, we redirect the browser directly to the image URL.
        // This is extremely efficient.
        response.redirect(302, finalPosterUrl);

    } catch (error) {
        console.error(`Error in poster API for ID ${id}:`, error);
        // Redirect to a placeholder on error
        response.redirect(302, 'https://via.placeholder.com/500x750.png?text=Error');
    }
}
