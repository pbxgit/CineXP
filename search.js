// search.js - V1 (Renewed & Stable)

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query');
    const searchTitle = document.getElementById('search-title');
    const searchGrid = document.getElementById('search-grid');
    
    if (query) {
        searchTitle.textContent = `Results for "${query}"`;
        document.title = `Search: ${query} - Cineverse`;
        fetchSearchResults(query);
    } else {
        searchTitle.textContent = 'Please enter a search term.';
        searchGrid.innerHTML = '';
    }
});

async function fetchSearchResults(query) {
    const searchGrid = document.getElementById('search-grid');
    searchGrid.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`/api/tmdb?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error('The search request failed. Please try again.');
        }

        const data = await response.json();
        renderResults(data.results);
    } catch (error) {
        console.error("Search fetch error:", error);
        searchGrid.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
}

function renderResults(results) {
    const searchGrid = document.getElementById('search-grid');
    searchGrid.innerHTML = '';

    const filteredResults = results.filter(item => item.media_type !== 'person' && item.poster_path);

    if (filteredResults.length === 0) {
        searchGrid.innerHTML = '<p class="error-message">No movies or shows were found for this search term.</p>';
        return;
    }
    
    let cardsHtml = '';
    filteredResults.forEach(item => {
        cardsHtml += createMediaCard(item);
    });
    searchGrid.innerHTML = cardsHtml;
}

function createMediaCard(item) {
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
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
}
