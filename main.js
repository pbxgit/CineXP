// main.js - Phase 2 (Corrected with Hero Animation Trigger)

document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero-section');

    // Use a small delay to ensure the initial CSS is applied before we trigger the transition.
    // This makes the animation smooth and reliable on all devices.
    setTimeout(() => {
        heroSection.classList.add('is-visible');
    }, 100);

    // Fetch the movies after the hero animation has started.
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
        movieGrid.innerHTML = '';

        if (data.results && data.results.length > 0) {
            data.results.forEach(movie => {
                const movieCard = createMovieCard(movie);
                movieGrid.appendChild(movieCard);
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

function createMovieCard(movie) {
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = `#`;

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
