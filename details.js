// details.js - V1 (Renewed with Cinematic UI)

document.addEventListener('DOMContentLoaded', () => {
    initializeDetailsPage();
});

async function initializeDetailsPage() {
    const container = document.getElementById('detail-container');
    container.innerHTML = `<div class="loading-spinner"></div>`;
    
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('type');

    if (!mediaId || !mediaType) {
        showError("Missing media information.");
        return;
    }

    try {
        const [mediaResponse, watchlistResponse] = await Promise.all([
            fetch(`/api/tmdb?id=${mediaId}&media_type=${mediaType}`),
            fetch('/api/watchlist')
        ]);

        if (!mediaResponse.ok) throw new Error("Could not load media details.");
        
        const media = await mediaResponse.json();
        if (media.success === false) throw new Error("Media not found.");

        const watchlist = watchlistResponse.ok ? await watchlistResponse.json() : [];
        const isInWatchlist = watchlist.some(item => item.id.toString() === media.id.toString());

        renderMediaDetails(media, mediaType, isInWatchlist);

    } catch (error) {
        console.error("Details page error:", error);
        showError(error.message);
    }
}

function renderMediaDetails(media, mediaType, isInWatchlist) {
    const container = document.getElementById('detail-container');
    document.title = `${media.title || media.name} - Cineverse`;

    const backdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : '';
    const posterUrl = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : '';
    const title = media.title || media.name;
    const year = new Date(media.release_date || media.first_air_date).getFullYear() || 'N/A';
    const runtime = media.runtime ? `${media.runtime} min` : (media.episode_run_time?.[0] ? `${media.episode_run_time[0]} min` : '');

    container.innerHTML = `
        <div class="detail-hero" style="background-image: url('${backdropUrl}');">
            <div class="detail-hero-overlay"></div>
        </div>
        <div class="detail-content">
            <div class="detail-poster">
                <img src="${posterUrl}" alt="${title}">
            </div>
            <div class="detail-info">
                <div class="detail-header">
                    <h1 class="detail-title">${title}</h1>
                    <div id="watchlist-button-container"></div>
                </div>
                <div class="quick-info">
                    <span class="rating">⭐ ${(media.vote_average || 0).toFixed(1)}</span>
                    <span>${year}</span>
                    ${runtime ? `<span>${runtime}</span>` : ''}
                </div>
                <div class="genres">${(media.genres || []).map(g => `<span class="genre-tag">${g.name}</span>`).join('')}</div>
                <h2>Overview</h2>
                <p class="overview">${media.overview || 'No overview available.'}</p>
            </div>
        </div>
    `;

    renderWatchlistButton(document.getElementById('watchlist-button-container'), media, mediaType, isInWatchlist);
    setTimeout(() => container.classList.add('visible'), 50);
}

function renderWatchlistButton(container, media, mediaType, isInWatchlist) {
    const icon = isInWatchlist 
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="m10 15.586-3.293-3.293-1.414 1.414L10 18.414l9.707-9.707-1.414-1.414z"></path></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"></path></svg>`;

    container.innerHTML = `<button class="watchlist-button nav-icon ${isInWatchlist ? 'remove' : 'add'}" aria-label="${isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}">${icon}</button>`;
    
    container.querySelector('.watchlist-button').addEventListener('click', async (e) => {
        const button = e.currentTarget;
        button.disabled = true;
        try {
            await fetch('/api/watchlist', {
                method: isInWatchlist ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: media.id, title: media.title || media.name, poster_path: media.poster_path, media_type: mediaType })
            });
            renderWatchlistButton(container, media, mediaType, !isInWatchlist);
        } catch (error) {
            console.error('Failed to update watchlist:', error);
            button.disabled = false;
        }
    });
}

function showError(message) {
    document.getElementById('detail-container').innerHTML = `<main id="app-container"><p class="error-message">${message}</p></main>`;
}
