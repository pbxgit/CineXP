// functions/gemini.js
exports.handler = async function(event) {
    // We only want to handle POST requests for this function
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { GEMINI_API_KEY } = process.env;

    if (!GEMINI_API_KEY) {
        return { statusCode: 500, body: 'Gemini AI API Key not found.' };
    }

    // The Gemini Pro REST API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const { prompt } = JSON.parse(event.body);

        // This is the specific payload structure required by the Gemini REST API
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
            const errorText = await response.text();
            throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        // Carefully navigate the response structure to get the generated text
        const aiResponseText = data.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ response: aiResponseText })
        };

    } catch (error) {
        console.error('Gemini function error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to get response from AI' }) };
    }
};
