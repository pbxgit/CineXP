// CINEVERSE - Main Application Logic (Universal for Movies & TV)

// This listener ensures the whole page is loaded before we run any scripts.
document.addEventListener('DOMContentLoaded', () => {
    // This code ONLY runs if we are on the homepage (because only index.html has these tabs)
    const moviesTab = document.getElementById('movies-tab');
    const showsTab = document.getElementById('shows-tab');

    if (moviesTab && showsTab) {
        // Load popular movies by default when the page loads
        fetchMedia('movie');

        moviesTab.addEventListener('click', () => {
            if (!moviesTab.classList.contains('active')) {
                showsTab.classList.remove('active');
                moviesTab.classList.add('active');
                fetchMedia('movie');
            }
        });

        showsTab.addEventListener('click', () => {
            if (!showsTab.classList.contains('active')) {
                moviesTab.classList.remove('active');
                showsTab.classList.add('active');
                fetchMedia('tv');
            }
        });
    }
});

async function fetchMedia(mediaType) {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`/api/tmdb?media_type=${mediaType}`);
        const data = await response.json();
        appContainer.innerHTML = '';

        if (data.results && data.results.length > 0) {
            data.results.forEach(mediaItem => {
                // Pass the mediaType to the card creator
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

// This is the universal card creation function. It needs to be available to all pages.
function createMediaCard(mediaItem, mediaType) {
    const title = mediaItem.title || mediaItem.name;
    // We will make a universal details page later. For now, this link structure is okay.
    const link = `/movie.html?id=${mediaItem.id}&media_type=${mediaType}`; 
    
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = link;
    
    // THE FIX: Pass the mediaType to our smart poster API
    const posterPath = `/api/poster?id=${mediaItem.id}&media_type=${mediaType}`;

    card.innerHTML = `
        <img src="${posterPath}" alt="${title}" loading="lazy">
        <div class="card-glow"></div>
        <div class.card-content">
            <h3 class="movie-title">${title}</h3>
            <div class="movie-info">
                <span>⭐ ${mediaItem.vote_average.toFixed(1)}</span>
            </div>
        </div>
    `;
    return card;
}
