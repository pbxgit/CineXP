// Vercel Serverless Function: /api/poster.js (Optimistic Version)
// This version removes the faulty check and directly serves the RPDB URL if an IMDb ID is available.

export default async function handler(request, response) {
    // 1. Securely get API keys from Vercel Environment Variables
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const rpdbApiKey = process.env.RPDB_API_KEY;
    
    // 2. Get the movie ID from the request URL (e.g., /api/poster?id=575265)
    const { id } = request.query;

    // 3. If no ID is provided, it's a bad request. End it.
    if (!id) {
        return response.status(400).end();
    }

    try {
        // 4. Fetch the movie's full details from TMDb to find its IMDb ID
        const detailUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${tmdbApiKey}`;
        const detailRes = await fetch(detailUrl);

        if (!detailRes.ok) {
            throw new Error('TMDb detail fetch failed');
        }
        
        const movie = await detailRes.json();

        // 5. Set a default poster from TMDb as a reliable fallback
        let finalPosterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

        // 6. **THE FIX:** If an IMDb ID exists, we optimistically assume an RPDB poster exists
        // and overwrite the fallback URL with the RPDB URL.
        if (movie.imdb_id) {
            finalPosterUrl = `https://api.ratingposterdb.com/${rpdbApiKey}/imdb/${movie.imdb_id}.jpg`;
        }

        // 7. Redirect the browser directly to the best poster URL we found.
        // This is highly efficient. The browser handles the image loading from there.
        response.redirect(302, finalPosterUrl);

    } catch (error) {
        console.error(`Error in poster API for movie ID ${id}:`, error);
        
        // 8. If any part of the process fails, redirect to a generic placeholder
        // to avoid showing a broken image icon in the app.
        const placeholder = 'https://via.placeholder.com/500x750.png?text=Not+Found';
        response.redirect(302, placeholder);
    }
}
