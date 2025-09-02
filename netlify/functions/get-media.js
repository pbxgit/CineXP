// Located at: netlify/functions/get-media.js

const fetch = require('node-fetch');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TVDB_API_KEY = process.env.TVDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TVDB_BASE_URL = 'https://api4.thetvdb.com/v4';

let tvdbToken = null;

const fetchFromTMDB = async (endpoint) => {
  const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&append_to_response=images`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TMDB API error! Status: ${response.status}`);
  return response.json();
};

const getTVDBToken = async () => {
  if (tvdbToken) return tvdbToken;
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

const getBestLogoUrl = (images) => {
    if (!images?.logos?.length) return null;
    let logo = images.logos.find(l => l.iso_639_1 === 'en') || images.logos[0];
    return `https://image.tmdb.org/t/p/w500${logo.file_path}`;
};

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
        if (!type || !id) throw new Error('Missing type or id');

        const [details, credits, recommendations] = await Promise.all([
            fetchFromTMDB(`/${type}/${id}`),
            fetchFromTMDB(`/${type}/${id}/credits`),
            fetchFromTMDB(`/${type}/${id}/recommendations`)
        ]);

        const logoUrl = getBestLogoUrl(details.images);

        if (type === 'tv') {
            // --- CRITICAL SAFETY CHECK ---
            // Only proceed if details.seasons is a valid array.
            if (details.seasons && Array.isArray(details.seasons)) {
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
                            if (tvdbJson.data?.episodes) {
                                tvdbJson.data.episodes.forEach(ep => {
                                    const key = `S${String(ep.seasonNumber).padStart(2, '0')}E${String(ep.number).padStart(2, '0')}`;
                                    if (ep.image) tvdbImagesMap.set(key, ep.image);
                                });
                            }
                        } catch (e) { console.warn(`Could not fetch TVDB data`, e); }
                    }
                }

                const seasonsDetails = await Promise.all(
                    details.seasons.map(async (season) => {
                        const seasonData = await fetchFromTMDB(`/tv/${id}/season/${season.season_number}`);
                        if (seasonData?.episodes) { // Second safety check
                            seasonData.episodes.forEach(ep => {
                                const key = `S${String(ep.season_number).padStart(2, '0')}E${String(ep.episode_number).padStart(2, '0')}`;
                                if (tvdbImagesMap.has(key)) {
                                    ep.thumbnail_url = tvdbImagesMap.get(key);
                                } else if (ep.still_path) {
                                    ep.thumbnail_url = `https://image.tmdb.org/t/p/w300${ep.still_path}`;
                                } else {
                                    ep.thumbnail_url = `https://via.placeholder.com/300x169?text=No+Image`;
                                }
                            });
                        }
                        return seasonData;
                    })
                );
                details.seasons_details = seasonsDetails;
            } // End of safety check
        }

        responseData = { details, logoUrl, credits, recommendations };
        break;

      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    return { statusCode: 200, body: JSON.stringify(responseData) };

  } catch (error) {
    console.error('CRITICAL ERROR in get-media function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch media data.' }) };
  }
};
