// A global-like variable to hold the IDs of items in our watchlist
let watchlistIds = new Set();

// Function to fetch the watchlist and store only the IDs for quick lookups
async function fetchAndCacheWatchlist() {
    try {
        const response = await fetch('/api/watchlist');
        const watchlistData = await response.json();
        const ids = watchlistData.map(itemStr => JSON.parse(itemStr).id);
        watchlistIds = new Set(ids);
    } catch (error) {
        console.error("Could not fetch watchlist for state check:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('media_type');

    if (mediaId && mediaType) {
        fetchMediaDetails(mediaId, mediaType);
    } else {
        document.getElementById('movie-detail-container').innerHTML = '<p class="error-message">Missing info.</p>';
    }
});

async function fetchMediaDetails(id, mediaType) {
    // FIRST, fetch the watchlist to know the state of our button
    await fetchAndCacheWatchlist();
    
    const container = document.getElementById('movie-detail-container');
    try {
        const response = await fetch(`/api/tmdb?id=${id}&media_type=${mediaType}`);
        const media = await response.json();
        document.title = `${media.title || media.name} - Cineverse`;
        renderMediaDetails(media, container, mediaType);
    } catch (error) {
        container.innerHTML = '<p class="error-message">Could not load details.</p>';
    }
}

function renderMediaDetails(media, container, mediaType) {
    container.innerHTML = ''; // Clear spinner

    const title = media.title || media.name;
    const releaseDate = media.release_date || media.first_air_date || '';
    const year = releaseDate.substring(0, 4);
    const runtime = media.runtime || (media.episode_run_time ? media.episode_run_time[0] : null);
    const posterUrl = `/api/poster?id=${media.id}&media_type=${mediaType}`;
    const backdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : '';

    // Check if the current item is in our cached watchlist
    let isBookmarked = watchlistIds.has(media.id);
    
    container.innerHTML = `
        <div class="hero-section" style="background-image: url('${backdropUrl}')">...</div>
        <div class="movie-content">
            ...
            <div class="info-container">
                ...
                <!-- The button's text and style will now be set dynamically -->
                <button id="watchlist-btn" class="cta-button ${isBookmarked ? 'secondary' : ''}">
                    ${isBookmarked ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </button>
            </div>
        </div>
    `;
    // Note: You need to copy the full innerHTML from your previous movie.js to fill in the '...' above.

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
                watchlistIds.delete(media.id); // Update local state
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
                watchlistIds.add(media.id); // Update local state
                isBookmarked = true;
            } catch (error) {
                watchlistBtn.textContent = 'Failed - Try Again';
            }
        }
        watchlistBtn.disabled = false;
    });
}
