// watchlist.js - Handles fetching and displaying watchlist items

document.addEventListener('DOMContentLoaded', () => {
    // Dynamically load the header
    fetch('header.html')
        .then(res => res.text())
        .then(data => {
            document.getElementById('global-header').innerHTML = data;
            // Re-run the global script logic for the newly loaded header
            const globalScript = document.createElement('script');
            globalScript.src = 'global.js';
            document.body.appendChild(globalScript);
        });

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
        console.error("Watchlist fetch error:", error);
        watchlistGrid.innerHTML = `<p class="error-message">Your watchlist appears to be empty.</p>`;
    }
}

function renderWatchlist(items) {
    const watchlistGrid = document.getElementById('watchlist-grid');
    watchlistGrid.innerHTML = '';

    if (items.length === 0) {
        watchlistGrid.innerHTML = '<p class="error-message">Your watchlist appears to be empty. Add some movies and shows!</p>';
        return;
    }

    items.forEach(item => {
        const card = createMediaCard(item, item.media_type);
        watchlistGrid.appendChild(card);
    });
}

function createMediaCard(item, mediaType) {
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = `/details.html?id=${item.id}&type=${mediaType}`;

    const title = item.title;
    const posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;

    card.innerHTML = `
        <div class="card-poster">
            <img src="${posterUrl}" alt="${title}" loading="lazy">
        </div>
        <div class="card-body">
            <h3 class="card-title">${title}</h3>
        </div>
    `;
    return card;
}
