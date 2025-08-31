export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const { id, media_type } = request.query;

    if (!id || !media_type) {
        return response.status(400).end();
    }

    try {
        const detailUrl = `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${tmdbApiKey}`;
        const detailRes = await fetch(detailUrl);

        if (!detailRes.ok) {
            throw new Error('TMDb detail fetch failed for media type: ' + media_type);
        }
        
        const mediaItem = await detailRes.json();

        if (mediaItem.poster_path) {
            const posterUrl = `https://image.tmdb.org/t/p/w500${mediaItem.poster_path}`;
            // Redirect the browser directly to the image file
            return response.redirect(302, posterUrl);
        } else {
            // If no poster exists, redirect to a placeholder
            const placeholder = 'https://via.placeholder.com/500x750.png?text=No+Poster';
            return response.redirect(302, placeholder);
        }
    } catch (error) {
        console.error(`Error in poster API for ID ${id}:`, error);
        const placeholder = 'https://via.placeholder.com/500x750.png?text=Error';
        return response.redirect(302, placeholder);
    }
}
