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


// src/js/api.js
// ... (keep all the existing TMDB functions)

export const getMediaDetails = (type, id) => fetchFromTMDB(`/${type}/${id}`);

// --- NEW GEMINI AI FUNCTION ---
export async function askGemini(userPrompt) {
    // We construct a more detailed prompt for the AI to ensure it returns structured data
    const detailedPrompt = `
        Based on the user's request "${userPrompt}", suggest up to 12 movie titles that fit the description.
        The user's request might be a mood, a theme, a comparison, or a scenario.
        Return ONLY a single comma-separated string of the movie titles.
        Do not add any intro, outro, numbering, or any other text.
        Example response: Inception, The Matrix, Blade Runner 2049, Arrival
    `;

    try {
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            body: JSON.stringify({ prompt: detailedPrompt })
        });
        if (!response.ok) throw new Error('Failed to get response from AI.');
        const data = await response.json();
        return data.response; // This will be the comma-separated string of titles
    } catch (error) {
        console.error('Error asking Gemini:', error);
        return null;
    }
}
