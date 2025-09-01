// details.js - V5: Watchlist Integration with Upstash Redis

document.addEventListener('DOMContentLoaded', async () => {
    document.body.classList.add('is-loaded');

    // Load header
    const headerResponse = await fetch('header.html');
    const headerData = await headerResponse.text();
    document.getElementById('global-header').innerHTML = headerData;
    const globalScript = document.createElement('script');
    globalScript.src = 'global.js';
    document.body.appendChild(globalScript);

    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('type');

    if (mediaId && mediaType) {
        // Fetch both media details and the current watchlist in parallel
        const [mediaResponse, watchlistResponse] = await Promise.all([
            fetch(`/api/tmdb?id=${mediaId}&media_type=${mediaType}`),
            fetch('/api/watchlist')
        ]);

        if (!mediaResponse.ok) {
            showError("Could not load details for this item.");
            return;
        }

        const media = await mediaResponse.json();
        const watchlist = await watchlistResponse.json();
        
        const isInWatchlist = watchlist.some(item => item.id === media.id);

        renderMediaDetails(media, mediaType, isInWatchlist);

    } else {
        showError("Missing media information.");
    }
});

function renderMediaDetails(media, mediaType, isInWatchlist) {
    const container = document.getElementById('detail-container');
    document.title = `${media.title || media.name} - Cineverse`;

    const backdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : '';
    // ... (all other variable definitions for title, year, etc. are the same)

    container.innerHTML = `
        <div class="detail-hero" style="background-image: url(${backdropUrl})">
            <div class="detail-hero-overlay"></div>
        </div>
        <div class="detail-content">
            <div class="detail-poster">
                <img src="https://image.tmdb.org/t/p/w500${media.poster_path}" alt="${media.title || media.name}">
            </div>
            <div class="detail-info">
                <div id="watchlist-button-container"></div> <!-- Placeholder for the button -->
                <h1 class="detail-title">${media.title || media.name}</h1>
                <!-- ... (rest of the detail-info inner HTML is the same) ... -->
            </div>
        </div>
    `;

    const watchlistContainer = document.getElementById('watchlist-button-container');
    updateWatchlistButton(watchlistContainer, media, mediaType, isInWatchlist);
}

function updateWatchlistButton(container, media, mediaType, isInWatchlist) {
    container.innerHTML = `
        <button class="watchlist-button ${isInWatchlist ? 'remove' : 'add'}">
            ${isInWatchlist ? '✓ Remove from Watchlist' : '+ Add to Watchlist'}
        </button>
    `;
    
    container.querySelector('.watchlist-button').addEventListener('click', async () => {
        const itemData = {
            id: media.id,
            title: media.title || media.name,
            poster_path: media.poster_path,
            media_type: mediaType
        };

        const method = isInWatchlist ? 'DELETE' : 'POST';

        await fetch('/api/watchlist', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });

        // Toggle the state and re-render the button
        updateWatchlistButton(container, media, mediaType, !isInWatchlist);
    });
}

function showError(message) {
    const container = document.getElementById('detail-container');
    container.innerHTML = `<p class="error-message">${message}</p>`;
}
