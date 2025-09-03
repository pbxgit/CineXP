// =====================================================
// Personal Cinema - Serverless Function: get-ai-insights (No Auth)
// =====================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

exports.handler = async (event) => {
  const { movieTitle, genres } = event.queryStringParameters;
  if (!movieTitle || !genres) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Movie title and genres are required.' }),
    };
  }

  const prompt = `
    You are an expert film critic.
    For the movie titled "${movieTitle}", which is in the genres of "${genres}", do the following:
    Write a short, compelling, and completely spoiler-free paragraph that explains the unique VIBE and EXPERIENCE of watching it.
    Do not just summarize the plot. Instead, focus on the mood, the tone, the cinematic style, and what makes it a standout film.
    Keep it concise and engaging, around 3-4 sentences.
  `;

  const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'The AI model failed to respond.');
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!summary) throw new Error('Could not extract a valid summary from the AI response.');

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
