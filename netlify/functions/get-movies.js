// Import the native fetch API
import fetch from 'node-fetch';

// The main function that Netlify will run
exports.handler = async function (event, context) {
  // Get the TMDB API key from the environment variables you set in Netlify
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  
  // Get the movie ID from the request URL, if it exists
  const movieId = event.queryStringParameters.id;

  let apiUrl;

  if (movieId) {
    // If an ID is provided, get details for that specific movie
    apiUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`;
  } else {
    // If no ID is provided, get the list of popular movies
    apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Return a successful response with the movie data
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    // If an error occurs, return an error message
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from TMDB' }),
    };
  }
};
