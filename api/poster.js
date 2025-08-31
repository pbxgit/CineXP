// Vercel Serverless Function: /api/poster.js (Corrected and Robust Version)

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const rpdbApiKey = process.env.RPDB_API_KEY;
    const { id } = request.query;

    if (!id) {
        return response.status(400).end(); // Bad request
    }

    try {
        // First, get the movie's details from TMDb
        const detailUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${tmdbApiKey}`;
        const detailRes = await fetch(detailUrl);
        if (!detailRes.ok) throw new Error('TMDb detail fetch failed');
        const movie = await detailRes.json();

        let finalPosterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`; // Default to TMDb poster

        // If an IMDb ID exists, we can TRY to get an RPDB poster
        if (movie.imdb_id) {
            const rpdbUrl = `https://api.ratingposterdb.com/${rpdbApiKey}/imdb/${movie.imdb_id}.jpg`;
            
            // HEAD request is a lightweight way to check if a URL is valid without downloading the whole file
            const rpdbCheck = await fetch(rpdbUrl, { method: 'HEAD' });

            // If the check is successful (status 200 OK), use the RPDB url
            if (rpdbCheck.ok) {
                finalPosterUrl = rpdbUrl;
            }
        }

        // Redirect the user to the determined best poster URL
        response.redirect(302, finalPosterUrl);

    } catch (error) {
        console.error(`Error in poster API for ID ${id}:`, error);
        // On any error, redirect to a generic placeholder to avoid broken icons
        const placeholder = 'https://via.placeholder.com/500x750.png?text=Not+Found';
        response.redirect(302, placeholder);
    }
}
