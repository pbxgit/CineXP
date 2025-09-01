// search.js - V15 (Stable & Clean)

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query');

    const searchTitle = document.getElementById('search-title');
    
    if (query) {
        searchTitle.textContent = `Results for "${query}"`;
        document.title = `Search: ${query} - Cineverse`;
        fetchSearchResults(query);
    } else {
        searchTitle.textContent = 'Please enter a search term.';
    }
});

async function fetchSearchResults(query) {
    const searchGrid = document.getElementById('search-grid');
    searchGrid.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`/api/tmdb?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search request failed.');

        const data = await response.json();
        renderResults(data.results);
    } catch (error) {
        console.error("Search fetch error:", error);
        searchGrid.innerHTML = `<p class="error-message">Could not perform search. Please try again.</p>`;
    }
}

function renderResults(results) {
    const searchGrid = document.getElementById('search-grid');
    searchGrid.innerHTML = '';

    const filteredResults = results.filter(item => item.media_type !== 'person' && item.poster_path);

    if (filteredResults.length === 0) {
        searchGrid.innerHTML = '<p class="error-message">No movies or shows found for this search term.</p>';
        return;
    }

    filteredResults.forEach(item => {
        searchGrid.insertAdjacentHTML('beforeend', createMediaCard(item, item.media_type));
    });
}

function createMediaCard(item, mediaType) {
    const title = item.title || item.name;
    const posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;

    return `
        <a class="movie-card" href="/details.html?id=${item.id}&type=${mediaType}">
            <div class="card-poster">
                <img src="${posterUrl}" alt="${title}" loading="lazy">
            </div>
            <div class="card-body">
                <h3>${title}</h3>
            </div>
        </a>
    `;
}```

---

### **5. `watchlist.js`**
```javascript
// watchlist.js - V15 (Stable & Clean)

document.addEventListener('DOMContentLoaded', () => {
    fetchWatchlist();
});

async function fetchWatchlist() {
    const watchlistGrid = document.getElementById('watchlist-grid');
    watchlistGrid.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch('/api/watchlist');
        if (!response.ok) throw new Error('Could not fetch your watchlist.');

        const items = await response.json();
        renderWatchlist(items);
    } catch (error) {
        console.error("Watchlist fetch error:", error);
        watchlistGrid.innerHTML = `<p class="error-message">Could not load your watchlist. It might be empty.</p>`;
    }
}

function renderWatchlist(items) {
    const watchlistGrid = document.getElementById('watchlist-grid');
    watchlistGrid.innerHTML = '';

    if (items.length === 0) {
        watchlistGrid.innerHTML = '<p class="error-message">Your watchlist is empty. Add movies and shows to see them here!</p>';
        return;
    }

    // Sort by most recently added
    items.sort((a, b) => b.added_at - a.added_at);

    items.forEach(item => {
        watchlistGrid.insertAdjacentHTML('beforeend', createMediaCard(item, item.media_type));
    });
}

function createMediaCard(item, mediaType) {
    const title = item.title;
    const posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;

    return `
        <a class="movie-card" href="/details.html?id=${item.id}&type=${mediaType}">
            <div class="card-poster">
                <img src="${posterUrl}" alt="${title}" loading="lazy">
            </div>
            <div class="card-body">
                <h3>${title}</h3>
            </div>
        </a>
    `;
}
