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
        return []; // Return an empty array to prevent the site from crashing.
    }
}
