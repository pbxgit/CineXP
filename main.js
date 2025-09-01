// main.js - Phase 3 (with Page Transitions)

document.addEventListener('DOMContentLoaded', () => {
    // --- Animation Triggers ---
    const body = document.body;
    const heroContent = document.querySelector('.hero-content');

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
    fetchAndDisplayMedia('movie');
});

async function fetchAndDisplayMedia(mediaType) {
    const movieGrid = document.getElementById('movie-grid');
    movieGrid.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`/api/tmdb?media_type=${mediaType}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        movieGrid.innerHTML = '';

        if (data.results && data.results.length > 0) {
            data.results.forEach(item => {
                const mediaCard = createMediaCard(item, mediaType);
                movieGrid.appendChild(mediaCard);
            });
            
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
    // --- CHANGE 1: The link now points to the details page with correct parameters ---
    card.href = `/details.html?id=${item.id}&type=${mediaType}`;

    const title = item.title || item.name;
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
    
    // --- CHANGE 2: Add a click listener to handle the fade-out transition ---
    card.addEventListener('click', (e) => {
        e.preventDefault(); // Stop the browser from navigating instantly
        const destination = e.currentTarget.href;
        
        document.body.classList.add('fade-out'); // Apply the fade-out animation
        
        // Wait for the animation to finish, then go to the new page
        setTimeout(() => {
            window.location.href = destination;
        }, 500); // This duration should match your CSS transition time
    });

    return card;
}
