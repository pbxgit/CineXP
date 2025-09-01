// netlify/functions/get-media.js
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const { endpoint, id, type = 'movie' } = event.queryStringParameters;

  let apiUrl;

  if (endpoint === 'details') {
    if (!id) return { statusCode: 400, body: 'ID is required' };
    
    // We now need to make two API calls for the details page
    const detailsUrl = `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=en-US`;
    const imagesUrl = `https://api.themoviedb.org/3/${type}/${id}/images?api_key=${TMDB_API_KEY}`;

    try {
      // Fetch both simultaneously for speed
      const [detailsResponse, imagesResponse] = await Promise.all([
        fetch(detailsUrl),
        fetch(imagesUrl)
      ]);

      const details = await detailsResponse.json();
      const images = await imagesResponse.json();

      // Find the best available English logo
      const englishLogos = images.logos.filter(logo => logo.iso_639_1 === 'en');
      const logoUrl = englishLogos.length > 0 ? `https://image.tmdb.org/t/p/w500${englishLogos[0].file_path}` : null;

      // Return a combined object
      return {
        statusCode: 200,
        body: JSON.stringify({ details, logoUrl }),
      };

    } catch (error) {
      console.error('Function Error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: `Failed to fetch details. Reason: ${error.message}` }) };
    }

  } else if (endpoint === 'trending_movies') {
    apiUrl = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`;
  } else if (endpoint === 'popular_tv') {
    apiUrl = `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
  } else {
    return { statusCode: 400, body: 'Invalid endpoint' };
  }

  // This part remains for the homepage carousels
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    console.error('Function Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: `Failed to fetch from TMDB. Reason: ${error.message}` }) };
  }
};
