// watchlist.js - V1 (Renewed & Stable)

document.addEventListener('DOMContentLoaded', () => {
    fetchWatchlist();
});

async function fetchWatchlist() {
    const watchlistGrid = document.getElementById('watchlist-grid');
    watchlistGrid.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch('/api/watchlist');
        if (!response.ok) {
            throw new Error('Could not fetch your watchlist at this time.');
        }

        const items = await response.json();
        renderWatchlist(items);
    } catch (error) {
        console.error("Watchlist fetch error:", error);
        watchlistGrid.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
}

function renderWatchlist(items) {
    const watchlistGrid = document.getElementById('watchlist-grid');
    watchlistGrid.innerHTML = '';

    if (items.length === 0) {
        watchlistGrid.innerHTML = '<p class="error-message">Your watchlist is empty. Add movies and shows to see them here!</p>';
        return;
    }

    // The API now returns items pre-sorted by most recently added.
    let cardsHtml = '';
    items.forEach(item => {
        cardsHtml += createMediaCard(item);
    });
    watchlistGrid.innerHTML = cardsHtml;
}

function createMediaCard(item) {
    const title = item.title;
    const posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;

    return `
        <a class="movie-card" href="/details.html?id=${item.id}&type=${item.media_type}">
            <div class="card-poster">
                <img src="${posterUrl}" alt="${title}" loading="lazy">
            </div>
            <div class="card-body">
                <h3>${title}</h3>
            </div>
        </a>
    `;
}
