// netlify/functions/get-media.js
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  
  // Get query parameters from the request URL
  const { endpoint, id, type = 'movie' } = event.queryStringParameters;

  let apiUrl;

  // This logic determines which TMDB API URL to use based on the 'endpoint' parameter
  if (endpoint === 'details') {
    // Fetches details for a specific movie or tv show
    if (!id) return { statusCode: 400, body: 'ID is required for details endpoint' };
    apiUrl = `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=en-US`;
  } else if (endpoint === 'trending_movies') {
    // Fetches the weekly trending movies
    apiUrl = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`;
  } else if (endpoint === 'popular_tv') {
    // Fetches popular TV shows
    apiUrl = `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
  } else {
    // Default or error case
    return { statusCode: 400, body: 'Invalid endpoint specified' };
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.success === false) {
      throw new Error(data.status_message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to fetch from TMDB. Reason: ${error.message}` }),
    };
  }
};
