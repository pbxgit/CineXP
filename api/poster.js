// Vercel Serverless Function: /api/poster.js (TMDb-Only Reliable Version)
// This version removes all RPDB logic and reliably serves the standard TMDb poster.

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const { id } = request.query;

    if (!id) {
        return response.status(400).end();
    }

    try {
        // Step 1: Get the movie's details from TMDb
        const detailUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${tmdbApiKey}`;
        const detailRes = await fetch(detailUrl);

        if (!detailRes.ok) {
            throw new Error('TMDb detail fetch failed');
        }
        
        const movie = await detailRes.json();

        // Step 2: Check if a poster path exists
        if (movie.poster_path) {
            const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
            return response.redirect(302, posterUrl);
        } else {
            // Step 3: If no poster exists, redirect to a placeholder
            const placeholder = 'https://via.placeholder.com/500x750.png?text=No+Poster';
            return response.redirect(302, placeholder);
        }

    } catch (error) {
        console.error(`Error in poster API for ID ${id}:`, error);
        const placeholder = 'https://via.placeholder.com/500x750.png?text=Error';
        return response.redirect(302, placeholder);
    }
}
