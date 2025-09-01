import fetch from 'node-fetch';

exports.handler = async function (event, context) {
  // Get the Gemini API key from your Netlify environment variables
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Get the movie title from the request
  const { movieTitle } = JSON.parse(event.body);

  if (!movieTitle) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Movie title is required.' }),
    };
  }

  // This is the prompt we send to the Gemini AI
  const prompt = `Based on the movie titled "${movieTitle}", write a short, compelling, and completely spoiler-free paragraph explaining why someone should watch it. Focus on the mood, themes, and what makes it unique.`;

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the generated text from the AI's response
    const summary = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ summary }),
    };
  } catch (error) {
    console.error('Error fetching from Gemini API:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate AI summary.' }),
    };
  }
};
