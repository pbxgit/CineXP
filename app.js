document.addEventListener('DOMContentLoaded', () => {
    console.log("Welcome to Cineverse! Fetching popular movies...");
    fetchPopularMovies();
});

async function fetchPopularMovies() {
    const appContainer = document.getElementById('app-container');
    
    try {
        // We call our OWN API endpoint, not the TMDb one directly.
        const response = await fetch('/api/tmdb');
        const data = await response.json();

        // Clear the loading shimmer
        appContainer.innerHTML = ''; 

        data.results.forEach(movie => {
            const movieCard = createMovieCard(movie);
            appContainer.appendChild(movieCard);
        });

    } catch (error) {
        console.error('Error fetching movies from our API:', error);
        appContainer.innerHTML = '<p class="error-message">Could not load movies. Please try again later.</p>';
    }
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';

    const posterPath = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://via.placeholder.com/500x750.png?text=No+Image';

    card.innerHTML = `
        <img src="${posterPath}" alt="${movie.title}" loading="lazy">
        <div class="card-glow"></div>
        <div class="card-content">
            <h3 class="movie-title">${movie.title}</h3>
        </div>
    `;
    return card;
}
