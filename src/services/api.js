// src/services/api.js
const callTmdbApi = async (path) => {
    try {
        // This endpoint is created by Netlify
        const response = await fetch(`/.netlify/functions/tmdb?path=${encodeURIComponent(path)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
};

export const getTrendingMovies = () => {
    return callTmdbApi('/trending/movie/week');
};

export const searchMovies = (query) => {
    return callTmdbApi(`/search/movie&query=${query}`);
};
