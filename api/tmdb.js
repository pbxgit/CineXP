// Vercel Serverless Function: /api/tmdb.js

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=1`;

    try {
        const fetchResponse = await fetch(url);
        if (!fetchResponse.ok) {
            throw new Error(`TMDb API error: ${fetchResponse.statusText}`);
        }
        const data = await fetchResponse.json();
        
        // Send a success response with the movie data
        response.status(200).json(data);

    } catch (error) {
        console.error('Error fetching from TMDb:', error);
        // Send an error response
        response.status(500).json({ message: 'Failed to fetch movie data.' });
    }
}
