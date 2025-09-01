// main.js - Phase 4 (with Shimmer Loading & Corrected Links)

document.addEventListener('DOMContentLoaded', () => {
    // ... (Animation Triggers and Media Switcher Logic remain the same) ...
    setTimeout(() => {
        document.body.classList.add('is-loaded');
        document.querySelector('.hero-content').classList.add('is-visible');
    }, 100);

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

    fetchAndDisplayMedia('movie');
});

async function fetchAndDisplayMedia(mediaType) {
    const movieGrid = document.getElementById('movie-grid');
    
    // --- UI POLISH: Shimmer Loading State ---
    movieGrid.innerHTML = ''; // Clear previous content
    for (let i = 0; i < 10; i++) { // Create 10 shimmer placeholders
        const placeholder = document.createElement('div');
        placeholder.className = 'card-placeholder';
        movieGrid.appendChild(placeholder);
    }

    try {
        const response = await fetch(`/api/tmdb?media_type=${mediaType}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
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
        console.error("Fetch error:", error);
        movieGrid.innerHTML = `<p class="error-message">Could not load content.</p>`;
    }
}

function createMediaCard(item, mediaType) {
    const card = document.createElement('a');
    card.className = 'movie-card';
    // --- CRUCIAL FIX: Pass the mediaType to the details page ---
    card.href = `/details.html?id=${item.id}&type=${mediaType}`;

    const title = item.title || item.name;
    const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';

    card.innerHTML = `
        <img src="${posterUrl}" alt="${title}" loading="lazy">
        <div class="card-info">
            <h3 class="card-title">${title}</h3>
            <p class="card-rating">⭐ ${item.vote_average.toFixed(1)}</p>
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
