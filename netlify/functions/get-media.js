// Located at: netlify/functions/get-media.js

const fetch = require('node-fetch');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const fetchFromTMDB = async (endpoint) => {
  const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&append_to_response=images`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TMDB API error for endpoint ${endpoint}! Status: ${response.status}`);
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

        // Use Promise.allSettled for resilience. It will not fail if one of these fails.
        const results = await Promise.allSettled([
            fetchFromTMDB(`/${type}/${id}`),
            fetchFromTMDB(`/${type}/${id}/credits`),
            fetchFromTMDB(`/${type}/${id}/recommendations`)
        ]);

        // Manually check the status of each promise
        const details = results[0].status === 'fulfilled' ? results[0].value : null;
        const credits = results[1].status === 'fulfilled' ? results[1].value : { cast: [] };
        const recommendations = results[2].status === 'fulfilled' ? results[2].value : { results: [] };

        // If the main details fetch failed, we cannot proceed.
        if (!details) throw new Error(`Failed to fetch primary details for ${type}/${id}`);

        const logoUrl = getBestLogoUrl(details.images);

        if (type === 'tv' && details.seasons && Array.isArray(details.seasons)) {
            const seasonPromises = details.seasons.map(season => 
                fetchFromTMDB(`/tv/${id}/season/${season.season_number}`)
            );
            
            // Use allSettled again for fetching seasons
            const seasonResults = await Promise.allSettled(seasonPromises);
            
            const seasonsDetails = seasonResults
                .filter(res => res.status === 'fulfilled') // Only keep successful fetches
                .map(res => {
                    const seasonData = res.value;
                    if (seasonData.episodes && Array.isArray(seasonData.episodes)) {
                        seasonData.episodes.forEach(ep => {
                            ep.thumbnail_url = ep.still_path 
                                ? `https://image.tmdb.org/t/p/w300${ep.still_path}` 
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
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    return { statusCode: 200, body: JSON.stringify(responseData) };
  } catch (error) {
    console.error('CRITICAL ERROR in get-media function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch media data.' }) };
  }
};
