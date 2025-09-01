// CORRECTION: Use 'require' instead of 'import'
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const movieId = event.queryStringParameters.id;
  let apiUrl;

  if (movieId) {
    apiUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`;
  } else {
    apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    // Add a check to see if the API key is valid
    if (data.success === false) {
        throw new Error(data.status_message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Function Error:', error);
    // Return a more descriptive error
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to fetch from TMDB. Reason: ${error.message}` }),
    };
  }
};
