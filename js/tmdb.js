// This code runs in the browser.

/**
 * Fetches media from our secure Netlify function.
 * @param {string} type - The type of media to fetch ('movie' or 'tv').
 * @param {string} category - The category to fetch ('trending', 'popular', 'top_rated', etc.).
 * @returns {Promise<Array>} A promise that resolves to an array of media items.
 */
async function fetchMedia(type, category) {
    const functionUrl = `/.netlify/functions/get-media?type=${type}&category=${category}`;

    try {
        const response = await fetch(functionUrl);
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error(`Error fetching ${type} (${category}):`, error);
        return [];
    }
}

/**
 * Fetches the COMPLETE image data for a media item.
 * @param {string} type - 'movie' or 'tv'
 * @param {number} id - The TMDb ID.
 * @returns {Promise<Object>} A promise that resolves to the full image data object.
 */
async function fetchMediaImages(type, id) {
    const functionUrl = `/.netlify/functions/get-media-images?type=${type}&id=${id}`;
    try {
        const response = await fetch(functionUrl);
        if (!response.ok) {
            throw new Error(`Image API call failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching media images:', error);
        return { logos: [], backdrops: [], posters: [] };
    }
}

/**
 * Fetches detailed information for a single media item.
 * @param {string} type - 'movie' or 'tv'
 * @param {number} id - The TMDb ID.
 * @returns {Promise<Object>} A promise that resolves to the details object.
 */
async function fetchMediaDetails(type, id) {
    const functionUrl = `/.netlify/functions/get-media-details?type=${type}&id=${id}`;
    try {
        const response = await fetch(functionUrl);
        if (!response.ok) {
            throw new Error(`Details API call failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching media details:', error);
        return {};
    }
}

// --- NEW FUNCTION TO BE ADDED ---
/**
 * Searches for media using our secure Netlify function.
 * @param {string} query - The search term.
 * @returns {Promise<Array>} A promise that resolves to an array of search results.
 */
let searchAbortController;

async function searchMedia(query) {
    if (!query) return [];

    // If a search is already in flight, cancel it
    if (searchAbortController) {
        searchAbortController.abort();
    }
    // Create a new controller for the new request
    searchAbortController = new AbortController();
    const signal = searchAbortController.signal;

    const functionUrl = `/.netlify/functions/search-media?query=${encodeURIComponent(query)}`;
    try {
        const response = await fetch(functionUrl, { signal }); // Pass the signal here
        if (!response.ok) {
            throw new Error(`Search API call failed: ${response.status}`);
        }
        const data = await response.json();
        return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    } catch (error) {
        if (error.name === 'AbortError') {
            // This is expected when a request is cancelled, so we don't log an error
            console.log('Search fetch aborted');
        } else {
            console.error('Error searching media:', error);
        }
        return [];
    }
}


/**
 * Fetches AI-generated insights (vibe check, smart tags) for a media item.
 * @param {string} title - The title of the movie/show.
 * @param {string} overview - The overview/description.
 * @returns {Promise<Object|null>} A promise resolving to an object with {vibe_check, smart_tags}.
 */
async function fetchAiVibe(title, overview) {
    if (!title || !overview) return null;
    
    // The function name should match the file in /netlify/functions/
    const functionUrl = `/.netlify/functions/get-ai-vibe?title=${encodeURIComponent(title)}&overview=${encodeURIComponent(overview)}`;
    
    try {
        const response = await fetch(functionUrl);
        if (!response.ok) {
            console.error(`AI Vibe API call failed: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching AI vibe:', error);
        return null;
    }
}
