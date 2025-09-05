const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
    if (!process.env.GEMINI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Gemini API key is not configured.' }) };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { title, overview } = event.queryStringParameters;
    if (!title || !overview) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing title or overview parameters.' }) };
    }

    const prompt = `You are a movie recommendation expert. Based on the following movie, generate a one-sentence, spoiler-free "vibe check" that captures its emotional tone, and 5 thematic "smart tags".

    Title: "${title}"
    Description: "${overview}"

    Provide the response strictly as a valid JSON object with the keys "vibe_check" (a string) and "smart_tags" (an array of strings). Do not include any markdown formatting.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Clean the response to ensure it is pure JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: text
        };
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return { statusCode: 502, body: JSON.stringify({ error: 'Failed to get AI insights from Gemini.' }) };
    }
};
