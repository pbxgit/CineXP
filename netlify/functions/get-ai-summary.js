// netlify/functions/get-ai-summary.js
// Version 1: Code Beautification

const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // 1. Validate Input
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Request body is required.' }),
        };
    }

    const { movieTitle } = JSON.parse(event.body);

    if (!movieTitle) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Movie title is required.' }),
        };
    }

    // 2. Prepare Prompt and Request Body
    const prompt = `Based on the movie titled "${movieTitle}", write a short, compelling, and completely spoiler-free paragraph explaining why someone should watch it. Focus on the mood, themes, and what makes it unique.`;
    
    const requestBody = {
        contents: [{ 
            parts: [{ text: prompt }] 
        }]
    };

    // 3. Execute API Call and Handle Response
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Log the detailed error for debugging on the server
            console.error('Gemini API Error:', errorData); 
            throw new Error(errorData.error.message || 'Gemini API request failed');
        }
    
        const data = await response.json();
        
        // Safely access the summary text
        const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!summary) {
            throw new Error('Could not extract a valid summary from the API response.');
        }

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
