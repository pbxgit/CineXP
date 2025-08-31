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
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = `/movie.html?id=${movie.id}`;

    const posterPath = movie.poster_url_high_quality || 'https://via.placeholder.com/500x750.png?text=No+Image';

    // Log the received movie object to the browser console for detailed inspection
    console.log(`Movie: ${movie.title}`, movie);

    card.innerHTML = `
        <img src="${posterPath}" alt="${movie.title}" loading="lazy">
        <div class="card-glow"></div>
        <div class="card-content">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-info">
                <span>⭐ ${movie.vote_average.toFixed(1)}</span>
                <!-- Temporary Debug Info -->
                <span style="color: ${movie.debug_poster_source === 'RPDB' ? '#00F5FF' : '#FF6F91'}; font-size: 10px; background: #000; padding: 2px;">
                    Source: ${movie.debug_poster_source}
                </span>
            </div>
        </div>
    `;
    return card;
}
