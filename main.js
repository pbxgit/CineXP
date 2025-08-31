// main.js - Phase 2 (Corrected and Simplified)

document.addEventListener('DOMContentLoaded', () => {
    // We are now calling the fetch function directly,
    // removing the Intersection Observer to ensure reliability.
    fetchPopularMovies();
});

async function fetchPopularMovies() {
    const movieGrid = document.getElementById('movie-grid');
    
    // Add a loading spinner while we fetch
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    movieGrid.appendChild(spinner);

    try {
        const response = await fetch('/api/tmdb?media_type=movie');
        if (!response.ok) {
            const errorInfo = await response.json();
            throw new Error(`HTTP error! status: ${response.status} - ${errorInfo.message}`);
        }
        
        const data = await response.json();

        // Important: Clear the grid (and the spinner) before adding new content
        movieGrid.innerHTML = '';

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
            movieGrid.innerHTML = '<p class="error-message">Nothing found in this universe.</p>';
        }
    } catch (error) {
        console.error("Fetch error:", error);
        // Clear the grid and show a user-friendly error
        movieGrid.innerHTML = `<p class="error-message">Could not load content. The server might be waking up. Please try refreshing the page.</p>`;
    }
}

function createMovieCard(movie) {
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = `#`; // Placeholder for the detail page

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
