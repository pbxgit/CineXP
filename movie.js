// A global Set to hold the IDs of items in our watchlist for fast checks
let watchlistIds = new Set();

// Function to fetch the watchlist and populate our Set of IDs
async function fetchAndCacheWatchlist() {
    try {
        const response = await fetch('/api/watchlist');
        const watchlistData = await response.json();
        const ids = watchlistData.map(itemStr => JSON.parse(itemStr).id);
        watchlistIds = new Set(ids);
    } catch (error) {
        console.error("Could not fetch watchlist for state check:", error);
        // If this fails, the button will default to "Add" mode, which is a safe fallback.
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('media_type');

    if (mediaId && mediaType) {
        fetchMediaDetails(mediaId, mediaType);
    } else {
        document.getElementById('movie-detail-container').innerHTML = '<p class="error-message">Missing media information.</p>';
    }
});

async function fetchMediaDetails(id, mediaType) {
    // Before doing anything else, fetch the watchlist to determine the button's state
    await fetchAndCacheWatchlist();
    
    const container = document.getElementById('movie-detail-container');
    try {
        const response = await fetch(`/api/tmdb?id=${id}&media_type=${mediaType}`);
        const media = await response.json();
        document.title = `${media.title || media.name} - Cineverse`;
        renderMediaDetails(media, container, mediaType);
    } catch (error) {
        container.innerHTML = '<p class="error-message">Could not load details for this item.</p>';
    }
}

function renderMediaDetails(media, container, mediaType) {
    container.innerHTML = ''; 

    const title = media.title || media.name;
    const releaseDate = media.release_date || media.first_air_date || '';
    const year = releaseDate.substring(0, 4);
    const runtime = media.runtime || (media.episode_run_time ? media.episode_run_time[0] : null);
    const posterUrl = `/api/poster?id=${media.id}&media_type=${mediaType}`;
    const backdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : '';

    // Check if the current item's ID is in our cached watchlist Set
    let isBookmarked = watchlistIds.has(media.id);
    
    container.innerHTML = `
        <div class="hero-section" style="background-image: url('${backdropUrl}')">
            <div class="hero-overlay"></div>
        </div>
        <div class="movie-content">
            <div class="poster-container">
                <img class="movie-poster" src="${posterUrl}" alt="${title}">
            </div>
            <div class="info-container">
                <h1 class="movie-title-detail">${title}</h1>
                <p class="tagline"><em>${media.tagline || ''}</em></p>
                <div class="quick-info">
                    <span>${year}</span>
                    ${runtime ? `<span>•</span><span>${runtime} min</span>` : ''}
                    <span class="rating">⭐ ${media.vote_average.toFixed(1)}</span>
                </div>
                <div class="genres">${media.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')}</div>
                <h2>Overview</h2>
                <p>${media.overview}</p>
                <button id="watchlist-btn" class="cta-button ${isBookmarked ? 'secondary' : ''}">
                    ${isBookmarked ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </button>
            </div>
        </div>
    `;

    const watchlistBtn = document.getElementById('watchlist-btn');
    watchlistBtn.addEventListener('click', async () => {
        watchlistBtn.disabled = true;

        if (isBookmarked) {
            // --- REMOVE LOGIC ---
            watchlistBtn.textContent = 'Removing...';
            try {
                await fetch(`/api/watchlist?id=${media.id}`, { method: 'DELETE' });
                watchlistBtn.textContent = 'Add to Watchlist';
                watchlistBtn.classList.remove('secondary');
                watchlistIds.delete(media.id);
                isBookmarked = false;
            } catch (error) {
                watchlistBtn.textContent = 'Failed - Try Again';
            }
        } else {
            // --- ADD LOGIC ---
            watchlistBtn.textContent = 'Adding...';
            const itemToAdd = { id: media.id, title: media.title, name: media.name, poster_path: media.poster_path, vote_average: media.vote_average, media_type: mediaType };
            try {
                await fetch('/api/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(itemToAdd) });
                watchlistBtn.textContent = 'Remove from Watchlist';
                watchlistBtn.classList.add('secondary');
                watchlistIds.add(media.id);
                isBookmarked = true;
            } catch (error) {
                watchlistBtn.textContent = 'Failed - Try Again';
            }
        }
        watchlistBtn.disabled = false;
    });
}
