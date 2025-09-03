// src/services/api.js (add this)
export async function askGemini(prompt) {
    try {
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error calling Gemini function:', error);
        return "Sorry, I couldn't get a response.";
    }
}
