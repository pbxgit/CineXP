// CINEVERSE - Main Application Logic (Universal for Movies & TV)

document.addEventListener('DOMContentLoaded', () => {
    // This logic only runs on the homepage (index.html)
    const moviesTab = document.getElementById('movies-tab');
    const showsTab = document.getElementById('shows-tab');

    if (moviesTab && showsTab) {
        // Load popular movies by default when the page first loads
        fetchMedia('movie');

        // Add click listener for the "Cineverse" (movies) tab
        moviesTab.addEventListener('click', () => {
            if (!moviesTab.classList.contains('active')) {
                showsTab.classList.remove('active');
                moviesTab.classList.add('active');
                fetchMedia('movie');
            }
        });

        // Add click listener for the "Televerse" (TV shows) tab
        showsTab.addEventListener('click', () => {
            if (!showsTab.classList.contains('active')) {
                moviesTab.classList.remove('active');
                showsTab.classList.add('active');
                fetchMedia('tv');
            }
        });
    }
});

/**
 * Fetches the list of popular media (either movies or TV shows) from our API.
 * @param {string} mediaType - 'movie' or 'tv'.
 */
async function fetchMedia(mediaType) {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`/api/tmdb?media_type=${mediaType}`);
        const data = await response.json();

        // Clear the loading spinner
        appContainer.innerHTML = '';

        if (data.results && data.results.length > 0) {
            data.results.forEach(mediaItem => {
                const mediaCard = createMediaCard(mediaItem, mediaType);
                appContainer.appendChild(mediaCard);
            });
        } else {
            appContainer.innerHTML = '<p class="placeholder-text">Nothing found in this universe.</p>';
        }
    } catch (error) {
        console.error(`Error fetching media type ${mediaType}:`, error);
        appContainer.innerHTML = '<p class="error-message">Could not load content. Please try again later.</p>';
    }
}

/**
 * Creates the HTML for a single movie or TV show card.
 * This function is used by the homepage, search page, and watchlist page.
 * @param {object} mediaItem - The movie or TV show object.
 * @param {string} mediaType - 'movie' or 'tv'.
 * @returns {HTMLElement} - The created card element.
 */
function createMediaCard(mediaItem, mediaType) {
    // Unify the title property between movies and TV shows
    const title = mediaItem.title || mediaItem.name;
    // Create the correct link to the detail page
    const link = `/movie.html?id=${mediaItem.id}&media_type=${mediaType}`; 
    
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = link;
    
    // The poster URL points to our smart API endpoint
    const posterPath = `/api/poster?id=${mediaItem.id}&media_type=${mediaType}`;

    // This is the corrected innerHTML with no syntax errors
    card.innerHTML = `
        <img src="${posterPath}" alt="${title}" loading="lazy">
        <div class="card-glow"></div>
        <div class="card-content">
            <h3 class="movie-title">${title}</h3>
            <div class="movie-info">
                <span>⭐ ${(mediaItem.vote_average || 0).toFixed(1)}</span>
            </div>
        </div>
    `;
    return card;
}```
