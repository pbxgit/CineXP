// In file: netlify/functions/get-ai-search-query.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
    // ... (API key check remains the same)

    const { query } = event.queryStringParameters;
    if (!query) { /* ... */ }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
        You are a movie database expert. Convert the user's query into a TMDb Discover API JSON object.
        User Query: "${query}"

        Analyze for:
        - media_type: 'movie' or 'tv'. Default to 'movie' if ambiguous.
        - with_genres: TMDb genre IDs (e.g., Sci-Fi is 878, Comedy is 35, Action is 28, Horror is 27, Thriller is 53, Romance is 10749).
        - primary_release_year: A single year (e.g., 2023).
        - 'primary_release_date.gte' & 'primary_release_date.lte': For decades (e.g., "90s" is 1990-01-01 to 1999-12-31).
        - sort_by: Use 'vote_average.desc' for "best" or "critically acclaimed". Use 'revenue.desc' for "blockbuster" or "highest grossing". Default to 'popularity.desc'.

        Rules:
        1. Your response MUST be ONLY a raw JSON object. No markdown.
        2. Omit any keys that are not present in the user's query.
        3. If the query is vague (e.g., "something fun"), creatively choose a genre (e.g., Comedy, ID 35).

        Example Query: "A fun sci-fi blockbuster from the 80s"
        Example Output:
        {
          "media_type": "movie",
          "with_genres": "878,35",
          "primary_release_date.gte": "1980-01-01",
          "primary_release_date.lte": "1989-12-31",
          "sort_by": "revenue.desc"
        }
    `;

    // ... (The rest of the function remains the same)
};
