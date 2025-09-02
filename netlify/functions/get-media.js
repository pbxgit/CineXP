// Located at: netlify/functions/get-media.js

const fetch = require('node-fetch');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const fetchFromTMDB = async (endpoint) => {
  const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&append_to_response=images`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TMDB API error! Status: ${response.status}`);
  return response.json();
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

        // Reverted TV Show Logic: Fetch all seasons from TMDB at once
        if (type === 'tv') {
            // CRITICAL SAFETY CHECK: Only proceed if 'seasons' is a valid array.
            if (details.seasons && Array.isArray(details.seasons)) {
                const seasonsDetails = await Promise.all(
                    details.seasons.map(async (season) => {
                        const seasonData = await fetchFromTMDB(`/tv/${id}/season/${season.season_number}`);
                        // Second safety check for episodes within a season
                        if (seasonData.episodes && Array.isArray(seasonData.episodes)) {
                            seasonData.episodes.forEach(ep => {
                                // Use TMDB still_path as the single source of truth
                                if (ep.still_path) {
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
            }
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
