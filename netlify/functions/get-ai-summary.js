// CORRECTION: Use 'require' instead of 'import'
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const { movieTitle } = JSON.parse(event.body);

  if (!movieTitle) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Movie title is required.' }),
    };
  }

  const prompt = `Based on the movie titled "${movieTitle}", write a short, compelling, and completely spoiler-free paragraph explaining why someone should watch it. Focus on the mood, themes, and what makes it unique.`;
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error: ${errorData.error.message}`);
    }
    
    const data = await response.json();
    const summary = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ summary }),
    };
  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to generate AI summary. Reason: ${error.message}` }),
    };
  }
};
