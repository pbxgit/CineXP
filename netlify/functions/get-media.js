// netlify/functions/get-media.js
// Version 1: Code Beautification

const fetch = require('node-fetch');

// --- Configuration ---
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// --- Helper Functions ---

/**
 * Fetches data from a specified TMDB endpoint.
 * @param {string} endpoint - The API endpoint (e.g., '/trending/movie/week').
 * @returns {Promise<object>} The JSON response from the API.
 */
const fetchFromTMDB = async (endpoint) => {
    const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&append_to_response=images`;
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`TMDB API error for endpoint ${endpoint}! Status: ${response.status}`);
        throw new Error(`TMDB API request failed.`);
    }
    return response.json();
};

/**
 * Finds the best available logo URL from an images object, preferring English.
 * @param {object} images - The 'images' object from a TMDB response.
 * @returns {string|null} The full URL to the logo or null if not found.
 */
const getBestLogoUrl = (images) => {
    if (!images?.logos?.length) {
        return null;
    }
    const logo = images.logos.find(l => l.iso_639_1 === 'en') || images.logos[0];
    return `${IMAGE_BASE_URL}w500${logo.file_path}`;
};

// --- Main Handler ---

exports.handler = async (event) => {
    const { endpoint, type, id } = event.queryStringParameters;

    try {
        let responseData;

        switch (endpoint) {
            case 'trending_movies':
                responseData = await fetchFromTMDB('/trending/movie/week');
                break;

            case 'top_rated_movies':
                responseData = await fetchFromTMDB('/movie/top_rated');
                break;

            case 'popular_tv':
                responseData = await fetchFromTMDB('/tv/popular');
                break;
                
            case 'details':
                if (!type || !id) {
                    throw new Error('Missing "type" or "id" for details endpoint.');
                }

                // Fetch details, credits, and recommendations concurrently for performance.
                const results = await Promise.allSettled([
                    fetchFromTMDB(`/${type}/${id}`),
                    fetchFromTMDB(`/${type}/${id}/credits`),
                    fetchFromTMDB(`/${type}/${id}/recommendations`)
                ]);

                // Gracefully handle individual API call failures.
                const detailsResult = results[0];
                if (detailsResult.status === 'rejected') {
                    throw new Error(`Failed to fetch primary details for ${type}/${id}`);
                }
                
                const details = detailsResult.value;
                const credits = results[1].status === 'fulfilled' ? results[1].value : { cast: [] };
                const recommendations = results[2].status === 'fulfilled' ? results[2].value : { results: [] };

                const logoUrl = getBestLogoUrl(details.images);

                // If it's a TV show, fetch details for each season.
                if (type === 'tv' && Array.isArray(details.seasons) && details.seasons.length > 0) {
                    const seasonPromises = details.seasons.map(season => 
                        fetchFromTMDB(`/tv/${id}/season/${season.season_number}`)
                    );
                    
                    const seasonResults = await Promise.allSettled(seasonPromises);
                    
                    const seasonsDetails = seasonResults
                        .filter(res => res.status === 'fulfilled')
                        .map(res => {
                            const seasonData = res.value;
                            if (Array.isArray(seasonData.episodes)) {
                                seasonData.episodes.forEach(ep => {
                                    ep.thumbnail_url = ep.still_path 
                                        ? `${IMAGE_BASE_URL}w300${ep.still_path}` 
                                        : `https://via.placeholder.com/300x169?text=No+Image`;
                                });
                            }
                            return seasonData;
                        });

                    details.seasons_details = seasonsDetails;
                }

                responseData = { details, logoUrl, credits, recommendations };
                break;

            default:
                throw new Error(`Unknown endpoint provided: ${endpoint}`);
        }

        return { 
            statusCode: 200, 
            body: JSON.stringify(responseData) 
        };

    } catch (error) {
        console.error('CRITICAL ERROR in get-media function:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Failed to fetch media data.' }) 
        };
    }
};
