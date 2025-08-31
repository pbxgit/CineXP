// A global Set to hold the IDs of items in our watchlist for fast, efficient checks.
let watchlistIds = new Set();

/**
 * Fetches the user's watchlist from our API and caches the IDs.
 */
async function fetchAndCacheWatchlist() {
    try {
        const response = await fetch('/api/watchlist');
        const watchlistData = await response.json();
        // No more JSON.parse() needed here either
        const ids = watchlistData.map(item => item.id);
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
        document.getElementById('movie-detail-container').innerHTML = '<p class="error-message">Missing media information.</p>';
    }
});

/**
 * Fetches the full details for a specific movie or show.
 */
async function fetchMediaDetails(id, mediaType) {
    await fetchAndCacheWatchlist();
    
    const container = document.getElementById('movie-detail-container');
    try {
        const response = await fetch(`/api/tmdb?id=${id}&media_type=${mediaType}`);
        const media = await response.json();

        // **DEFENSIVE CHECK**: If the API returned an error or no ID, stop here.
        if (!media || !media.id) {
            throw new Error("Invalid data received from API.");
        }

        document.title = `${media.title || media.name} - Cineverse`;
        renderMediaDetails(media, container, mediaType);
    } catch (error) {
        console.error("Error fetching media details:", error);
        container.innerHTML = '<p class="error-message">Could not load details for this item.</p>';
    }
}

/**
 * Renders the entire detail page UI and sets up the interactive watchlist button.
 * This version is robust and will not crash on missing data.
 */
function renderMediaDetails(media, container, mediaType) {
    container.innerHTML = ''; // Clear the loading spinner

    // Use nullish coalescing ('??') to provide safe default values.
    const title = media.title || media.name ?? 'Untitled';
    const releaseDate = media.release_date || media.first_air_date || '';
    const year = releaseDate.substring(0, 4);
    const runtime = media.runtime || (media.episode_run_time ? media.episode_run_time[0] : null);
    
    const posterUrl = `/api/poster?id=${media.id}&media_type=${mediaType}`;
    const backdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : '';

    // Check if the current item's ID exists in our cached watchlist.
    let isBookmarked = watchlistIds.has(media.id);
    
    // Construct the HTML. Use optional chaining ('?.') on the .map to prevent crashes.
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
                <p class="tagline"><em>${media.tagline ?? ''}</em></p>
                <div class="quick-info">
                    <span>${year}</span>
                    ${runtime ? `<span>•</span><span>${runtime} min</span>` : ''}
                    <span class="rating">⭐ ${(media.vote_average ?? 0).toFixed(1)}</span>
                </div>
                <div class="genres">
                    ${(media.genres ?? []).map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')}
                </div>
                <h2>Overview</h2>
                <p>${media.overview ?? 'No overview available.'}</p>
                <button id="watchlist-btn" class="cta-button ${isBookmarked ? 'secondary' : ''}">
                    ${isBookmarked ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </button>
            </div>
        </div>
    `;

    // Attach the event listener to the button.
    const watchlistBtn = document.getElementById('watchlist-btn');
    watchlistBtn.addEventListener('click', async () => {
        watchlistBtn.disabled = true;

        if (isBookmarked) {
            watchlistBtn.textContent = 'Removing...';
            try {
                await fetch(`/api/watchlist?id=${media.id}`, { method: 'DELETE' });
                watchlistBtn.textContent = 'Add to Watchlist';
                watchlistBtn.classList.remove('secondary');
                watchlistIds.delete(media.id);
                isBookmarked = false;
            } catch (error) { watchlistBtn.textContent = 'Failed - Try Again'; }
        } else {
            watchlistBtn.textContent = 'Adding...';
            const itemToAdd = { id: media.id, title: media.title, name: media.name, poster_path: media.poster_path, vote_average: media.vote_average, media_type: mediaType };
            try {
                await fetch('/api/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(itemToAdd) });
                watchlistBtn.textContent = 'Remove from Watchlist';
                watchlistBtn.classList.add('secondary');
                watchlistIds.add(media.id);
                isBookmarked = true;
            } catch (error) { watchlistBtn.textContent = 'Failed - Try Again'; }
        }
        watchlistBtn.disabled = false;
    });
}
