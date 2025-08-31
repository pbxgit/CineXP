// main.js - Phase 2

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');

    // Create an Intersection Observer to detect when the movie grid comes into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // If the app container is intersecting (visible)
            if (entry.isIntersecting) {
                fetchPopularMovies(); // Load the movies
                observer.unobserve(entry.target); // Stop observing, so it only loads once
            }
        });
    }, {
        rootMargin: '0px 0px -100px 0px' // Trigger when the container is 100px from the bottom of the viewport
    });

    // Start observing the app container
    observer.observe(appContainer);
});

async function fetchPopularMovies() {
    const movieGrid = document.getElementById('movie-grid');
    try {
        const response = await fetch('/api/tmdb?media_type=movie');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // Create and append all movie cards to the grid
            data.results.forEach(movie => {
                const movieCard = createMovieCard(movie);
                movieGrid.appendChild(movieCard);
            });
            
            // Animate the cards in a staggered sequence
            const cards = document.querySelectorAll('.movie-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('is-visible');
                }, index * 100); // 100ms delay between each card's animation
            });
        } else {
            movieGrid.innerHTML = '<p>Nothing found in this universe.</p>';
        }
    } catch (error) {
        console.error("Fetch error:", error);
        movieGrid.innerHTML = '<p>Could not load content.</p>';
    }
}

function createMovieCard(movie) {
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = `#`; // We will build the detail page link in a later phase

    const posterUrl = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://via.placeholder.com/500x750.png?text=No+Poster';

    card.innerHTML = `
        <img src="${posterUrl}" alt="${movie.title}" loading="lazy">
        <div class="card-info">
            <h3 class="card-title">${movie.title}</h3>
            <p class="card-rating">⭐ ${movie.vote_average.toFixed(1)}</p>
        </div>
    `;
    
    return card;
}```
