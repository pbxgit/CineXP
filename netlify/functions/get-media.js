// Located at: netlify/functions/get-media.js

// Using node-fetch v2, as specified in your package.json
const fetch = require('node-fetch');

// --- API Configuration ---
// Keys are stored securely in Netlify environment variables
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TVDB_API_KEY = process.env.TVDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TVDB_BASE_URL = 'https://api4.thetvdb.com/v4';

let tvdbToken = null; // A temporary cache for the TVDB token

// --- Helper Functions ---

/**
 * Fetches data from a TMDB API endpoint.
 */
const fetchFromTMDB = async (endpoint) => {
  const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&append_to_response=images`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TMDB API error! Status: ${response.status}`);
  return response.json();
};

/**
 * Acquires a JWT token from the TVDB API.
 * The token is cached temporarily to avoid logging in on every single request.
 */
const getTVDBToken = async () => {
  if (tvdbToken) {
    return tvdbToken;
  }
  try {
    const response = await fetch(`${TVDB_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apikey: TVDB_API_KEY }),
    });
    const data = await response.json();
    tvdbToken = data.data.token;
    return tvdbToken;
  } catch (error) {
    console.error('Failed to get TVDB token:', error);
    return null;
  }
};

/**
 * Finds the best available logo URL from TMDB's image data.
 */
const getBestLogoUrl = (images) => {
    if (!images || !images.logos || images.logos.length === 0) return null;
    // Prefer an English logo if available
    let logo = images.logos.find(l => l.iso_639_1 === 'en');
    // Otherwise, just take the first one
    if (!logo) logo = images.logos[0];
    return `https://image.tmdb.org/t/p/w500${logo.file_path}`;
};


// --- Main Netlify Function Handler ---

exports.handler = async (event) => {
  const { endpoint, type, id } = event.queryStringParameters;

  try {
    let responseData;

    switch (endpoint) {
      case 'trending_movies':
        responseData = await fetchFromTMDB('/trending/movie/week');
        break;

      case 'popular_tv':
        responseData = await fetchFromTMDB('/tv/popular');
        break;

      case 'details':
        if (!type || !id) throw new Error('Missing type or id for details endpoint');

        // Fetch common data points concurrently
        const [details, credits, recommendations] = await Promise.all([
            fetchFromTMDB(`/${type}/${id}`),
            fetchFromTMDB(`/${type}/${id}/credits`),
            fetchFromTMDB(`/${type}/${id}/recommendations`)
        ]);

        const logoUrl = getBestLogoUrl(details.images);

        // --- TV Show Specific Logic for Spoiler-Free Thumbnails ---
        if (type === 'tv') {
            const externalIds = await fetchFromTMDB(`/tv/${id}/external_ids`);
            const tvdbId = externalIds.tvdb_id;
            const tvdbImagesMap = new Map();

            if (tvdbId) {
                const token = await getTVDBToken();
                if (token) {
                    try {
                        const tvdbResponse = await fetch(`${TVDB_BASE_URL}/series/${tvdbId}/episodes/default?page=0`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const tvdbJson = await tvdbResponse.json();
                        tvdbJson.data.episodes.forEach(ep => {
                            const key = `S${String(ep.seasonNumber).padStart(2, '0')}E${String(ep.number).padStart(2, '0')}`;
                            if (ep.image) tvdbImagesMap.set(key, ep.image);
                        });
                    } catch (e) {
                        console.warn(`Could not fetch TVDB data for id: ${tvdbId}`, e);
                    }
                }
            }

            // Fetch full season details from TMDB and merge with TVDB data
            const seasonsDetails = await Promise.all(
                details.seasons.map(async (season) => {
                    const seasonData = await fetchFromTMDB(`/tv/${id}/season/${season.season_number}`);
                    seasonData.episodes.forEach(ep => {
                        const key = `S${String(ep.season_number).padStart(2, '0')}E${String(ep.episode_number).padStart(2, '0')}`;
                        if (tvdbImagesMap.has(key)) {
                            ep.thumbnail_url = tvdbImagesMap.get(key); // Use TVDB image
                        } else if (ep.still_path) {
                            ep.thumbnail_url = `https://image.tmdb.org/t/p/w300${ep.still_path}`; // Fallback to TMDB
                        } else {
                            ep.thumbnail_url = `https://via.placeholder.com/300x169?text=No+Image`; // Final fallback
                        }
                    });
                    return seasonData;
                })
            );
            details.seasons_details = seasonsDetails;
        }

        responseData = { details, logoUrl, credits, recommendations };
        break;

      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(responseData),
    };

  } catch (error) {
    console.error('Error in get-media function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch media data.' }),
    };
  }
};
