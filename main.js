// main.js - The Definitive, Robust Script for Homepage

document.addEventListener('DOMContentLoaded', () => {
    // This is the most reliable way to trigger entry animations.
    // 1. Let the browser paint the initial invisible state.
    // 2. Then, on the next "tick", add the visible class to trigger the transition.
    
    const body = document.body;
    const heroContent = document.querySelector('.hero-content');

    // Use a tiny timeout to ensure the browser has rendered the initial state.
    setTimeout(() => {
        body.classList.add('is-visible');
        heroContent.classList.add('is-visible');
    }, 100); // 100ms is a safe delay

    // Start fetching the movies immediately
    fetchPopularMovies();
});

async function fetchPopularMovies() {
    const movieGrid = document.getElementById('movie-grid');
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    movieGrid.appendChild(spinner);

    try {
        const response = await fetch('/api/tmdb?media_type=movie');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        movieGrid.innerHTML = ''; // Clear spinner

        if (data.results && data.results.length > 0) {
            data.results.forEach(movie => {
                const movieCard = createMovieCard(movie);
                movieGrid.appendChild(movieCard);
            });
            
            // Staggered animation for the cards
            const cards = document.querySelectorAll('.movie-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('is-visible');
                }, index * 100); // Stagger delay
            });
        } else {
            movieGrid.innerHTML = '<p class="error-message">Nothing found in this universe.</p>';
        }
    } catch (error) {
        console.error("Fetch error:", error);
        movieGrid.innerHTML = `<p class="error-message">Could not load content. Please try refreshing.</p>`;
    }
}

function createMovieCard(movie) {
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = `#`; // Placeholder

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
}
