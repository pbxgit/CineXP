// main.js - Phase 5 (The Seamless Experience Overhaul)

document.addEventListener('DOMContentLoaded', () => {
    // --- Animation & Auto-Scroll Logic ---
    const body = document.body;
    const heroContent = document.querySelector('.hero-content');
    const appContainer = document.getElementById('app-container');

    // Make the hero content visible immediately
    setTimeout(() => {
        body.classList.add('is-loaded');
        heroContent.classList.add('is-visible');
    }, 100);

    // After a delay, smoothly scroll to the content
    setTimeout(() => {
        appContainer.scrollIntoView({ behavior: 'smooth' });
    }, 2500); // 2.5 second delay after page load

    // --- Media Switcher Logic ---
    const moviesTab = document.getElementById('movies-tab');
    const showsTab = document.getElementById('shows-tab');
    moviesTab.addEventListener('click', () => switchMedia('movie'));
    showsTab.addEventListener('click', () => switchMedia('tv'));

    function switchMedia(mediaType) {
        if (document.querySelector('.media-tab.active').dataset.type !== mediaType) {
            moviesTab.classList.toggle('active');
            showsTab.classList.toggle('active');
            fetchAndDisplayMedia(mediaType);
        }
    }

    // --- Initial Load ---
    fetchAndDisplayMedia('movie');
});

// --- BUG FIX: Address the "blank page on back" issue ---
// The 'pageshow' event fires every time the page is displayed, including from the back/forward cache.
window.addEventListener('pageshow', (event) => {
    // If the page is loaded from the cache, its 'fade-out' class might be stuck.
    if (event.persisted) {
        document.body.classList.remove('fade-out');
    }
});


async function fetchAndDisplayMedia(mediaType) {
    const movieGrid = document.getElementById('movie-grid');
    movieGrid.innerHTML = ''; // Clear previous content
    for (let i = 0; i < 10; i++) { // Shimmer placeholders
        const placeholder = document.createElement('div');
        placeholder.className = 'card-placeholder';
        movieGrid.appendChild(placeholder);
    }

    try {
        const response = await fetch(`/api/tmdb?media_type=${mediaType}`);
        if (!response.ok) throw new Error(`HTTP error!`);
        
        const data = await response.json();
        movieGrid.innerHTML = ''; // Clear placeholders

        if (data.results && data.results.length > 0) {
            data.results.forEach(item => {
                const mediaCard = createMediaCard(item, mediaType);
                movieGrid.appendChild(mediaCard);
            });
            
            const cards = document.querySelectorAll('.movie-card');
            cards.forEach((card, index) => {
                setTimeout(() => { card.classList.add('is-visible'); }, index * 100);
            });
        } else {
            movieGrid.innerHTML = '<p class="error-message">Nothing found in this universe.</p>';
        }
    } catch (error) {
        movieGrid.innerHTML = `<p class="error-message">Could not load content.</p>`;
    }
}

function createMediaCard(item, mediaType) {
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = `/details.html?id=${item.id}&type=${mediaType}`;

    const title = item.title || item.name;
    const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';

    // --- NEW CARD DESIGN ---
    card.innerHTML = `
        <div class="card-poster">
            <img src="${posterUrl}" alt="${title}" loading="lazy">
        </div>
        <div class="card-body">
            <h3 class="card-title">${title}</h3>
            <div class="card-rating">
                <span>⭐ ${item.vote_average.toFixed(1)}</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        e.preventDefault();
        const destination = e.currentTarget.href;
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = destination; }, 500);
    });

    return card;
}
