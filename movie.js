// CINEVERSE - Movie/TV Detail Page Logic (UI Overhaul)

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('media_type');

    if (mediaId && mediaType) {
        fetchMediaDetails(mediaId, mediaType);
    } else {
        const container = document.getElementById('movie-detail-container');
        container.innerHTML = '<p class="error-message">Missing movie/show information.</p>';
    }
});

async function fetchMediaDetails(id, mediaType) {
    const container = document.getElementById('movie-detail-container');
    try {
        const response = await fetch(`/api/tmdb?id=${id}&media_type=${mediaType}`);
        if (!response.ok) throw new Error('Failed to fetch details');
        
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
                <div class="genres">
                    ${media.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')}
                </div>

                <h2>Overview</h2>
                <p>${media.overview}</p>

                <button id="add-to-watchlist-btn" class="cta-button">Add to Watchlist</button>
            </div>
        </div>
    `;

    // --- Add Watchlist Functionality ---
    const addButton = document.getElementById('add-to-watchlist-btn');
    addButton.addEventListener('click', async () => {
        addButton.disabled = true;
        addButton.textContent = 'Adding...';
        
        // We only need to store a minimal object
        const itemToAdd = {
            id: media.id,
            title: title,
            poster_path: media.poster_path,
            vote_average: media.vote_average,
            media_type: mediaType
        };

        try {
            await fetch('/api/watchlist', { // This API doesn't exist yet, but we're preparing for it
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemToAdd)
            });
            addButton.textContent = 'Added!';
        } catch (error) {
            console.error("Failed to add to watchlist:", error);
            addButton.textContent = 'Failed to Add';
            addButton.disabled = false;
        }
    });
}
