// search.js - V1 (Renewed & Stable)

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
        searchGrid.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
}

function renderResults(results) {
    const searchGrid = document.getElementById('search-grid');
    const filteredResults = results.filter(item => item.media_type !== 'person' && item.poster_path);
    if (filteredResults.length === 0) {
        searchGrid.innerHTML = '<p class="error-message">No results found.</p>';
        return;
    }
    searchGrid.innerHTML = filteredResults.map(createMediaCard).join('');
}

function createMediaCard(item) {
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    return `<a class="movie-card" href="/details.html?id=${item.id}&type=${mediaType}"><div class="card-poster"><img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" loading="lazy"></div><div class="card-body"><h3>${item.title || item.name}</h3></div></a>`;
}
