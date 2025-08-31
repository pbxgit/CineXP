// Vercel Serverless Function: /api/poster.js (Definitive, Robust Version)
// This version actively tries to fetch the RPDB poster and has a guaranteed fallback.

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const rpdbApiKey = process.env.RPDB_API_KEY;
    const { id } = request.query;

    if (!id) {
        return response.status(400).end();
    }

    try {
        // Step 1: Get the movie's details from TMDb
        const detailUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${tmdbApiKey}`;
        const detailRes = await fetch(detailUrl);
        if (!detailRes.ok) throw new Error('TMDb detail fetch failed');
        const movie = await detailRes.json();

        // Step 2: Define our fallback TMDb poster URL. This is our safe option.
        const fallbackPosterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        
        // Step 3: If an IMDb ID exists, we will ATTEMPT to use RPDB.
        if (movie.imdb_id) {
            const rpdbUrl = `https://api.ratingposterdb.com/${rpdbApiKey}/imdb/${movie.imdb_id}.jpg`;
            
            try {
                // Step 4: Actively try to fetch the RPDB poster.
                const rpdbResponse = await fetch(rpdbUrl);
                
                // Step 5: If the fetch was successful, redirect to the RPDB poster.
                if (rpdbResponse.ok) {
                    return response.redirect(302, rpdbUrl);
                }
                // If not successful (e.g., 404 error), we do nothing and let the code proceed to the fallback.
                
            } catch (fetchError) {
                // If the fetch itself fails, we also proceed to the fallback.
                console.error("RPDB fetch failed, using fallback.", fetchError);
            }
        }

        // Step 6: If we haven't already redirected, it means RPDB failed or wasn't tried.
        // Redirect to the safe fallback poster.
        return response.redirect(302, fallbackPosterUrl);

    } catch (error) {
        console.error(`Critical error in poster API for ID ${id}:`, error);
        const placeholder = 'https://via.placeholder.com/500x750.png?text=Error';
        return response.redirect(302, placeholder);
    }
}
