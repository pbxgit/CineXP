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
async function searchMedia(query) {
    if (!query) return []; // Return empty if query is empty
    const functionUrl = `/.netlify/functions/search-media?query=${encodeURIComponent(query)}`;
    try {
        const response = await fetch(functionUrl);
        if (!response.ok) {
            throw new Error(`Search API call failed: ${response.status}`);
        }
        const data = await response.json();
        // Filter out results that are people, as we only want movies and TV shows
        return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    } catch (error) {
        console.error('Error searching media:', error);
        return [];
    }
}
