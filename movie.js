// CINEVERSE - Movie/TV Detail Page Logic (UI Overhaul)

document.addEventListener('DOMContentLoaded', () => {
    // Parse the URL to get the ID and media_type for the item we need to display
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('media_type');

    if (mediaId && mediaType) {
        // If we have the necessary info, fetch the details from our API
        fetchMediaDetails(mediaId, mediaType);
    } else {
        // If info is missing, show an error
        const container = document.getElementById('movie-detail-container');
        container.innerHTML = '<p class="error-message">Missing movie or show information in URL.</p>';
    }
});

async function fetchMediaDetails(id, mediaType) {
    const container = document.getElementById('movie-detail-container');
    try {
        // Call our own API to get the details for the specific movie or show
        const response = await fetch(`/api/tmdb?id=${id}&media_type=${mediaType}`);
        if (!response.ok) {
            throw new Error('Failed to fetch details from API');
        }
        
        const media = await response.json();
        
        // Update the browser tab title
        document.title = `${media.title || media.name} - Cineverse`;
        
        // Render the full detail page UI
        renderMediaDetails(media, container, mediaType);
        
    } catch (error) {
        console.error("Error fetching media details:", error);
        container.innerHTML = '<p class="error-message">Could not load details for this item.</p>';
    }
}

function renderMediaDetails(media, container, mediaType) {
    container.innerHTML = ''; // Clear the initial loading spinner

    // Unify data fields between movies (title, release_date) and TV shows (name, first_air_date)
    const title = media.title || media.name;
    const releaseDate = media.release_date || media.first_air_date || '';
    const year = releaseDate.substring(0, 4);
    const runtime = media.runtime || (media.episode_run_time ? media.episode_run_time[0] : null);
    
    // Get poster and backdrop URLs from our own API and TMDb respectively
    const posterUrl = `/api/poster?id=${media.id}&media_type=${mediaType}`;
    const backdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : '';

    // Construct the complete inner HTML for the detail page
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

    // --- Watchlist Button Functionality ---
    const addButton = document.getElementById('add-to-watchlist-btn');
    addButton.addEventListener('click', async () => {
        // Disable button to prevent multiple clicks while processing
        addButton.disabled = true;
        addButton.textContent = 'Adding...';
        
        // Create a minimal object with only the data needed for the watchlist card.
        // This keeps our database lean.
        const itemToAdd = {
            id: media.id,
            title: media.title,       // Keep original movie title if it exists
            name: media.name,         // Keep original show name if it exists
            poster_path: media.poster_path,
            vote_average: media.vote_average,
            media_type: mediaType
        };

        try {
            const response = await fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemToAdd)
            });

            if (!response.ok) {
                // If the server responds with an error (e.g., 500), handle it.
                throw new Error('Server responded with an error during add.');
            }

            addButton.textContent = 'Added!'; // Success!
        } catch (error) {
            console.error("Failed to add item to watchlist:", error);
            addButton.textContent = 'Failed - Try Again';
            addButton.disabled = false; // Re-enable the button if the API call fails
        }
    });
}
