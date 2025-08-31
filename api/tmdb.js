// Vercel Serverless Function: /api/tmdb.js
// Handles popular movies, single movie details, AND search queries.

export default async function handler(request, response) {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const { id, query } = request.query; // Check for ID and query

    if (!tmdbApiKey) {
        return response.status(500).json({ message: 'Server configuration error.' });
    }

    // --- ROUTING LOGIC ---
    if (id) {
        await getMovieDetails(id, tmdbApiKey, response);
    } else if (query) {
        await getSearchResults(query, tmdbApiKey, response);
    } else {
        await getPopularMovies(tmdbApiKey, response);
    }
}

// --- HANDLER FUNCTIONS ---

async function getPopularMovies(apiKey, response) {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
    await fetchAndRespond(url, response);
}

async function getMovieDetails(id, apiKey, response) {
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`;
    await fetchAndRespond(url, response);
}

async function getSearchResults(query, apiKey, response) {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    await fetchAndRespond(url, response);
}

// --- UTILITY FUNCTION ---
// A single, reliable function to fetch data and send it back.
async function fetchAndRespond(url, response) {
    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) {
            throw new Error(`TMDb API Error: ${apiResponse.statusText}`);
        }
        const data = await apiResponse.json();
        response.status(200).json(data);
    } catch (error) {
        console.error(`Error fetching from TMDb URL: ${url}`, error);
        response.status(500).json({ message: 'Failed to fetch data from TMDb.' });
    }
}```

---

### **Step 4: Add New CSS and Update Navigation**

Finally, a few styles for the search bar and an update to the main `index.html` navigation.

**1. Add to `style.css`:**
```css
/* --- 10. Search Page --- */
.search-bar-container {
    display: flex;
    padding: 1rem;
    gap: 0.5rem;
}

#search-input {
    flex-grow: 1;
    height: 50px;
    border: 2px solid rgba(0, 245, 255, 0.2);
    border-radius: 12px;
    background: var(--glass-background);
    color: var(--color-text-primary);
    font-family: var(--font-body);
    font-size: 1rem;
    padding: 0 1rem;
    transition: var(--transition-smooth);
}

#search-input:focus {
    outline: none;
    border-color: var(--color-primary-accent);
    box-shadow: 0 0 15px var(--color-primary-accent);
}

#search-button {
    width: 50px;
    height: 50px;
    border: none;
    border-radius: 12px;
    background: var(--color-primary-accent);
    color: var(--color-background);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-smooth);
}
#search-button:hover {
    transform: scale(1.1);
    box-shadow: 0 0 15px var(--color-primary-accent);
}
#search-button .icon {
    width: 28px;
    height: 28px;
    fill: currentColor;
}

.placeholder-text {
    grid-column: 1 / -1; /* Make it span the full width */
    text-align: center;
    color: var(--color-text-secondary);
    font-size: 1.2rem;
    margin-top: 4rem;
}
