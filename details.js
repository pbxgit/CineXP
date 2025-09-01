// details.js - V8 (Definitive Bug Fix & Watchlist Polish)

document.addEventListener('DOMContentLoaded', () => {
    initializeDetailsPage();
});

async function initializeDetailsPage() {
    document.body.classList.add('is-loaded');
    const container = document.getElementById('detail-container');
    
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

        if (!mediaResponse.ok) {
            throw new Error("Could not load media details.");
        }
        
        const media = await mediaResponse.json();
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
    const releaseDate = media.release_date || media.first_air_date || '';
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
    const runtime = media.runtime ? `${media.runtime} min` : (media.episode_run_time?.[0] ? `${media.episode_run_time[0]} min` : '');

    container.innerHTML = `
        <div class="detail-hero">
            <div class="detail-hero-backdrop" style="background-image: url(${backdropUrl})"></div>
            <div class="detail-hero-overlay"></div>
        </div>
        <div class="detail-content">
            <div class="detail-poster">
                <img src="${posterUrl}" alt="${title}">
            </div>
            <div class="detail-info">
                <h1 class="detail-title">${title}</h1>
                <div class="quick-info">
                    <span class="rating">⭐ ${media.vote_average.toFixed(1)}</span>
                    <span>•</span>
                    <span>${year}</span>
                    ${runtime ? `<span>•</span><span>${runtime}</span>` : ''}
                </div>
                <div class="genres">${media.genres.map(g => `<span class="genre-tag">${g.name}</span>`).join('')}</div>
                <p class="tagline">${media.tagline || ''}</p>
                <div id="watchlist-button-container"></div>
                <h2>Overview</h2>
                <p class="overview">${media.overview || 'No overview available.'}</p>
            </div>
        </div>
    `;

    updateWatchlistButton(document.getElementById('watchlist-button-container'), media, mediaType, isInWatchlist);

    setTimeout(() => container.classList.add('visible'), 50);
}

function updateWatchlistButton(container, media, mediaType, isInWatchlist) {
    container.innerHTML = `<button class="watchlist-button ${isInWatchlist ? 'remove' : 'add'}">${isInWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}</button>`;
    
    const button = container.querySelector('.watchlist-button');
    button.addEventListener('click', async (e) => {
        e.currentTarget.disabled = true;
        e.currentTarget.textContent = 'Updating...';

        const method = isInWatchlist ? 'DELETE' : 'POST';
        await fetch('/api/watchlist', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: media.id, title: media.title || media.name, poster_path: media.poster_path, media_type: mediaType })
        });

        updateWatchlistButton(container, media, mediaType, !isInWatchlist);
    });
}

function showError(message) {
    const container = document.getElementById('detail-container');
    container.innerHTML = `<div id="app-container"><p class="error-message">${message}</p></div>`;
}
