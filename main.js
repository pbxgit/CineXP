// main.js - The Definitive, Polished Homepage Script

document.addEventListener('DOMContentLoaded', () => {
    // --- Animation Triggers ---
    const body = document.body;
    const heroContent = document.querySelector('.hero-content');

    // Use a tiny timeout for a reliable fade-in animation on page load.
    setTimeout(() => {
        body.classList.add('is-loaded');
        heroContent.classList.add('is-visible');
    }, 100);

    // --- Media Switcher Logic ---
    const moviesTab = document.getElementById('movies-tab');
    const showsTab = document.getElementById('shows-tab');

    moviesTab.addEventListener('click', () => {
        if (!moviesTab.classList.contains('active')) {
            showsTab.classList.remove('active');
            moviesTab.classList.add('active');
            fetchAndDisplayMedia('movie');
        }
    });

    showsTab.addEventListener('click', () => {
        if (!showsTab.classList.contains('active')) {
            moviesTab.classList.remove('active');
            showsTab.classList.add('active');
            fetchAndDisplayMedia('tv');
        }
    });

    // --- Initial Load ---
    fetchAndDisplayMedia('movie'); // Load movies by default
});

async function fetchAndDisplayMedia(mediaType) {
    const movieGrid = document.getElementById('movie-grid');
    movieGrid.innerHTML = '<div class="loading-spinner"></div>'; // Show spinner immediately

    try {
        const response = await fetch(`/api/tmdb?media_type=${mediaType}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        movieGrid.innerHTML = ''; // Clear spinner

        if (data.results && data.results.length > 0) {
            data.results.forEach(item => {
                const mediaCard = createMediaCard(item, mediaType);
                movieGrid.appendChild(mediaCard);
            });
            
            // Staggered animation for the new cards
            const cards = document.querySelectorAll('.movie-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('is-visible');
                }, index * 100);
            });
        } else {
            movieGrid.innerHTML = '<p class="error-message">Nothing found in this universe.</p>';
        }
    } catch (error) {
        console.error("Fetch error:", error);
        movieGrid.innerHTML = `<p class="error-message">Could not load content. Please try refreshing.</p>`;
    }
}

function createMediaCard(item, mediaType) {
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = `#`; // Placeholder

    const title = item.title || item.name; // Use 'name' for TV shows
    const rating = item.vote_average.toFixed(1);

    const posterUrl = item.poster_path 
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : 'https://via.placeholder.com/500x750.png?text=No+Poster';

    card.innerHTML = `
        <img src="${posterUrl}" alt="${title}" loading="lazy">
        <div class="card-info">
            <h3 class="card-title">${title}</h3>
            <p class="card-rating">⭐ ${rating}</p>
        </div>
    `;
    
    return card;
}
