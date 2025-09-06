// In file: netlify/functions/get-ai-search-query.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
    if (!process.env.GEMINI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Gemini API key is not configured.' }) };
    }

    const { query } = event.queryStringParameters;
    if (!query) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing query parameter.' }) };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // This is the robust prompt that does the heavy lifting.
    const prompt = `
        You are an expert movie and TV show database assistant. Your task is to convert a user's natural language query into a structured JSON object that can be used to query the TMDb API.

        The user query is: "${query}"

        Analyze the query and extract the following parameters:
        - media_type: Must be 'movie' or 'tv'. If not specified or ambiguous, default to 'movie'.
        - with_genres: An array of TMDb genre IDs.
        - with_keywords: An array of TMDb keyword IDs or a string of keywords.
        - primary_release_year: A specific year (e.g., 1999).
        - 'primary_release_date.gte': The start date for a range (YYYY-MM-DD).
        - 'primary_release_date.lte': The end date for a range (YYYY-MM-DD).
        - sort_by: The sorting preference. Common values are 'popularity.desc', 'vote_average.desc', 'revenue.desc'.
        
        TMDb Genre IDs:
        Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80, Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, History: 36, Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749, Science Fiction: 878, TV Movie: 10770, Thriller: 53, War: 10752, Western: 37.

        Rules:
        1. If the user mentions a decade (e.g., "80s", "the nineties"), set 'primary_release_date.gte' to the first day of that decade and 'primary_release_date.lte' to the last. (e.g., "80s" -> gte: 1980-01-01, lte: 1989-12-31).
        2. If the user mentions a vibe or theme (e.g., "mind-bending", "dystopian future", "space opera"), translate that into relevant keywords.
        3. If the user implies a quality (e.g., "best", "critically acclaimed"), use 'vote_average.desc' for sort_by. Otherwise, default to 'popularity.desc'.
        4. Your response MUST be ONLY a raw JSON object, without any markdown formatting like \`\`\`json.
        5. If a parameter is not mentioned in the query, omit its key from the JSON object.

        Example Query: "Show me some critically acclaimed mind-bending sci-fi movies from the 90s"
        Example JSON Output:
        {
          "media_type": "movie",
          "with_genres": [878],
          "with_keywords": "mind-bending, psychological",
          "primary_release_date.gte": "1990-01-01",
          "primary_release_date.lte": "1999-12-31",
          "sort_by": "vote_average.desc"
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: text
        };
    } catch (error) {
        console.error("Error calling Gemini API for search query:", error);
        return { statusCode: 502, body: JSON.stringify({ error: 'Failed to get AI search parameters.' }) };
    }
};
