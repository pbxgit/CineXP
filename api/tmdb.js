// Vercel Serverless Function: /api/tmdb.js (New Lean Version)
// This function's ONLY job is to fetch the list of popular movies. It's very fast.

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;

    if (!tmdbApiKey) {
        return response.status(500).json({ message: 'Server configuration error.' });
    }
    
    const popularMoviesUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=1`;

    try {
        const popularResponse = await fetch(popularMoviesUrl);
        if (!popularResponse.ok) throw new Error('Failed to fetch from TMDb');
        
        const popularData = await popularResponse.json();
        
        // Just send the data directly. No extra processing.
        response.status(200).json(popularData);

    } catch (error) {
        console.error('Error fetching popular movies:', error);
        response.status(500).json({ message: 'Failed to fetch popular movies.' });
    }
}
