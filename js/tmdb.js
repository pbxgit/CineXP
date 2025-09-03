/**
 * Fetches media from our secure Netlify function.
 * This is the central function for all TMDb API calls.
 *
 * @param {string} type - The type of media to fetch (e.g., 'movie' or 'tv').
 * @param {string} category - The category to fetch (e.g., 'trending', 'popular', 'top_rated').
 * @returns {Promise<Array>} A promise that resolves to an array of media items (movies or TV shows).
 *                           Returns an empty array if the fetch fails, preventing the site from crashing.
 */
async function fetchMedia(type, category) {
    // This URL points to our secure Netlify function, passing the desired media type and category
    // as query parameters. This is how the client tells the backend what data it needs.
    const functionUrl = `/.netlify/functions/get-media?type=${type}&category=${category}`;

    try {
        const response = await fetch(functionUrl);

        // Error handling: If the server response is not 'ok' (e.g., 404, 500 errors),
        // we throw an error to be caught by the catch block.
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        const data = await response.json();

        // The TMDb API returns the list of movies/shows inside a 'results' property.
        // We return this specific array to the function that called fetchMedia.
        return data.results;

    } catch (error) {
        // If anything goes wrong (network error, failed API call, etc.),
        // we log the error to the console for debugging and return an empty array.
        // This ensures that the rest of the site can still function even if one API call fails.
        console.error(`Error fetching ${type} (${category}):`, error);
        return [];
    }
}
