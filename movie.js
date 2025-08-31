document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');

    if (movieId) {
        fetchMovieById(movieId);
    } else {
        const container = document.getElementById('movie-detail-container');
        container.innerHTML = '<p class="error-message">No movie ID provided.</p>';
    }
});

async function fetchMovieById(id) {
    const container = document.getElementById('movie-detail-container');
    try {
        // We use our lean tmdb API, but pass the ID to it
        const response = await fetch(`/api/tmdb?id=${id}`);
        if (!response.ok) throw new Error('Failed to fetch movie details');
        
        const movie = await response.json();
        document.title = `${movie.title} - Cineverse`;
        renderMovieDetails(movie, container);
    } catch (error) {
        container.innerHTML = '<p class="error-message">Could not load movie details.</p>';
    }
}

function renderMovieDetails(movie, container) {
    container.innerHTML = ''; // Clear spinner

    // We use our smart poster API here as well!
    const posterUrl = `/api/poster?id=${movie.id}`;
    const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : '';

    container.innerHTML = `
        <div class="hero-section" style="background-image: url('${backdropUrl}')">
            <div class="hero-overlay"></div>
        </div>
        <div class="movie-content">
            <img class="movie-poster" src="${posterUrl}" alt="${movie.title}">
            <div class="movie-header">
                <h1 class="movie-title-detail">${movie.title}</h1>
                <p class="tagline"><em>${movie.tagline || ''}</em></p>
                <div class="quick-info">
                    <span>${(movie.release_date || '').substring(0, 4)}</span>
                    ${movie.runtime ? `<span>•</span><span>${movie.runtime} min</span>` : ''}
                    <span>•</span>
                    <span class="rating">⭐ ${movie.vote_average.toFixed(1)}</span>
                </div>
            </div>
            <div class="movie-body">
                <h2>Overview</h2>
                <p>${movie.overview}</p>
                <h2>Genres</h2>
                <div class="genres">
                    ${movie.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}
