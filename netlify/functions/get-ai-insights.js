// In file: netlify/functions/get-ai-insights.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
    // 1. Setup
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use 1.5-flash as it's the latest

    // 2. Get data from the frontend request
    const { title, overview } = event.queryStringParameters;
    if (!title || !overview) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing title or overview' }) };
    }

    // 3. Craft the Prompt
    const prompt = `You are a movie recommendation assistant. Based on the following movie title and description, generate a one-sentence, spoiler-free 'vibe check' that captures the film's emotional tone, and 5-7 thematic 'smart tags'.
    
    Title: ${title}
    Description: ${overview}
    
    Provide the response strictly as a JSON object with the keys 'vibe_check' and 'smart_tags' (which should be an array of strings).`;

    try {
        // 4. Call the Gemini API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean the response to ensure it's valid JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // 5. Return the clean JSON to the frontend
        return {
            statusCode: 200,
            body: text 
        };
    } catch (error) {
        console.error("Error with Gemini API:", error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to get AI insights.' }) };
    }
};
