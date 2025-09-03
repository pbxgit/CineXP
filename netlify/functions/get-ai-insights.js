// =====================================================
// Personal Cinema - Serverless Function: get-ai-insights
// =====================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Note: Using v1beta for the latest models like 1.5 Flash. Adjust if needed.
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

exports.handler = async (event, context) => {
  // 1. Secure the function: Only allow logged-in users to make requests.
  const { user } = context.clientContext;
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Authentication is required to use AI features.' }),
    };
  }

  // 2. Get data from the frontend request.
  const { movieTitle, genres } = event.queryStringParameters;
  if (!movieTitle || !genres) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Movie title and genres are required.' }),
    };
  }

  // 3. Construct the prompt for Gemini.
  const prompt = `
    You are an expert film critic.
    For the movie titled "${movieTitle}", which is in the genres of "${genres}", do the following:
    Write a short, compelling, and completely spoiler-free paragraph that explains the unique VIBE and EXPERIENCE of watching it.
    Do not just summarize the plot. Instead, focus on the mood, the tone, the cinematic style, and what makes it a standout film.
    Keep it concise and engaging, around 3-4 sentences.
  `;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    // Optional: Add safety settings and generation config if needed
    // generationConfig: { "temperature": 0.7, "maxOutputTokens": 200 }
  };

  // 4. Call the Gemini API and return the response.
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(errorData.error?.message || 'The AI model failed to respond.');
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      throw new Error('Could not extract a valid summary from the AI response.');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ summary }),
    };

  } catch (error) {
    console.error('AI Insights Handler Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to generate AI insights. Reason: ${error.message}` }),
    };
  }
};
