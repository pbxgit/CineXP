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


// In tmdb.js

/**
 * [NEW] Performs a smart search using AI to parse the query.
 * It first asks our AI function to create search parameters,
 * then uses those parameters to query the TMDb Discover endpoint.
 * @param {string} naturalLanguageQuery - The user's full search query.
 * @returns {Promise<Array>} A promise that resolves to an array of media items.
 */
async function fetchAiSearchResults(naturalLanguageQuery) {
    try {
        // Step 1: Call our AI function to get structured search parameters
        const aiFunctionUrl = `/.netlify/functions/get-ai-search-query?query=${encodeURIComponent(naturalLanguageQuery)}`;
        const aiResponse = await fetch(aiFunctionUrl);
        if (!aiResponse.ok) {
            throw new Error(`AI function failed with status: ${aiResponse.status}`);
        }
        const searchParams = await aiResponse.json();

        // Step 2: Build the TMDb Discover URL from the AI's response
        const mediaType = searchParams.media_type || 'movie'; // Default to movie
        
        // We need another Netlify function to securely call the TMDb Discover endpoint
        // Let's assume we have a function called 'discover-media' for this
        let discoverUrl = `/.netlify/functions/discover-media?media_type=${mediaType}`;
        
        // Append all other parameters the AI provided
        for (const key in searchParams) {
            if (key !== 'media_type') {
                 discoverUrl += `&${key}=${encodeURIComponent(searchParams[key])}`;
            }
        }
        
        // Step 3: Call the discover function to get the actual movie/TV show results
        const discoverResponse = await fetch(discoverUrl);
        if (!discoverResponse.ok) {
             throw new Error(`Discover API call failed: ${discoverResponse.status}`);
        }
        const data = await discoverResponse.json();
        
        // Add media_type to results since discover endpoint doesn't provide it
        return data.results.map(item => ({ ...item, media_type: mediaType }));

    } catch (error) {
        console.error('AI search failed:', error);
        // [FALLBACK] If the AI search fails, fall back to the simple keyword search
        console.log('Falling back to simple search...');
        return searchMedia(naturalLanguageQuery);
    }
}
