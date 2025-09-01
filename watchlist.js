// watchlist.js - V1 (Renewed & Stable)

document.addEventListener('DOMContentLoaded', () => {
    fetchWatchlist();
});

async function fetchWatchlist() {
    const watchlistGrid = document.getElementById('watchlist-grid');
    watchlistGrid.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const response = await fetch('/api/watchlist');
        if (!response.ok) throw new Error('Could not fetch watchlist.');
        const items = await response.json();
        renderWatchlist(items);
    } catch (error) {
        watchlistGrid.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
}

function renderWatchlist(items) {
    const watchlistGrid = document.getElementById('watchlist-grid');
    if (items.length === 0) {
        watchlistGrid.innerHTML = '<p class="error-message">Your watchlist is empty.</p>';
        return;
    }
    // API returns items pre-sorted
    watchlistGrid.innerHTML = items.map(createMediaCard).join('');
}

function createMediaCard(item) {
    return `<a class="movie-card" href="/details.html?id=${item.id}&type=${item.media_type}"><div class="card-poster"><img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title}" loading="lazy"></div><div class="card-body"><h3>${item.title}</h3></div></a>`;
}
