// netlify/functions/gemini.js
// Note: Google's AI SDK is for Node.js. In a serverless function without npm,
// we will use the REST API via fetch.

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    // v1beta is the current version for the REST API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    try {
        const { prompt } = JSON.parse(event.body);

        const payload = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract the text from the complex response structure
        const aiResponseText = data.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ response: aiResponseText })
        };

    } catch (error) {
        console.error('Gemini AI Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to get response from AI' })
        };
    }
};
