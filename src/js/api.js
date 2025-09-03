// src/js/api.js

async function fetchFromTMDB(endpoint, params = '') {
    const url = `/.netlify/functions/tmdb?endpoint=${encodeURIComponent(endpoint)}&params=${encodeURIComponent(params)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        return response.json();
    } catch (error) {
        console.error('Failed to fetch from TMDB proxy:', error);
        return null; // Return null to let the UI handle the error state
    }
}

export const getTrending = (mediaType = 'movie') => fetchFromTMDB(`/trending/${mediaType}/week`);
export const getNowPlaying = (mediaType = 'movie') => fetchFromTMDB(`/${mediaType}/now_playing`);
export const searchMedia = (query) => fetchFromTMDB('/search/multi', `query=${query}`);
export const getMediaDetails = (type, id) => fetchFromTMDB(`/${type}/${id}`);
