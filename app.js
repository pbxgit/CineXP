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
    const card = document.createElement('div'); // Back to a div for now
    card.className = 'movie-card';
    
    // The browser will request the poster from our smart API endpoint.
    // The API will then redirect it to the actual poster image (RPDB or TMDb).
    const posterPath = `/api/poster?id=${movie.id}`;

    card.innerHTML = `
        <img src="${posterPath}" alt="${movie.title}" loading="lazy">
        <div class="card-glow"></div>
        <div class="card-content">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-info">
                <span>⭐ ${movie.vote_average.toFixed(1)}</span>
            </div>
        </div>
    `;

    // We will add the click navigation back in the next step, once this is fixed.
    card.addEventListener('click', () => {
        // window.location.href = `/movie.html?id=${movie.id}`;
        alert(`Clicked on ${movie.title} (ID: ${movie.id}). Detail page coming soon!`);
    });

    return card;
}
