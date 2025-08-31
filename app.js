// CINEVERSE - Main Application Logic (Universal for Movies & TV)

document.addEventListener('DOMContentLoaded', () => {
    // Check which page we are on. The switcher logic only runs on the homepage.
    const moviesTab = document.getElementById('movies-tab');
    if (moviesTab) {
        initializeHomepage();
    }
});

function initializeHomepage() {
    const moviesTab = document.getElementById('movies-tab');
    const showsTab = document.getElementById('shows-tab');

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

async function fetchMedia(mediaType) {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`/api/tmdb?media_type=${mediaType}`);
        const data = await response.json();

        appContainer.innerHTML = ''; // Clear spinner

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

// This function now handles both MOVIES and TV SHOWS
function createMediaCard(mediaItem, mediaType) {
    // Determine the correct title and link based on media type
    const title = mediaItem.title || mediaItem.name;
    const link = `/movie.html?id=${mediaItem.id}`; // Note: This will need updating for TV details later

    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = link;
    
    const posterPath = `/api/poster?id=${mediaItem.id}`;

    card.innerHTML = `
        <img src="${posterPath}" alt="${title}" loading="lazy">
        <div class="card-glow"></div>
        <div class="card-content">
            <h3 class="movie-title">${title}</h3>
            <div class="movie-info">
                <span>⭐ ${mediaItem.vote_average.toFixed(1)}</span>
            </div>
        </div>
    `;
    return card;
}```
