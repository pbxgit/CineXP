document.addEventListener('DOMContentLoaded', () => {
    fetchPopularMovies();
});

async function fetchPopularMovies() {
    const appContainer = document.getElementById('app-container');
    try {
        const response = await fetch('/api/tmdb?media_type=movie');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Clear the loading spinner
        appContainer.innerHTML = '';

        if (data.results && data.results.length > 0) {
            data.results.forEach(movie => {
                const movieCard = createMovieCard(movie);
                appContainer.appendChild(movieCard);
            });
        } else {
            appContainer.innerHTML = '<p class="error-message">Nothing found in this universe.</p>';
        }
    } catch (error) {
        console.error("Fetch error:", error);
        appContainer.innerHTML = '<p class="error-message">Could not load content. Please try again later.</p>';
    }
}

function createMovieCard(movie) {
    const card = document.createElement('a');
    card.className = 'movie-card';
    // We will build the detail page in the next phase
    card.href = `/details.html?id=${movie.id}&media_type=movie`; 

    const posterUrl = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://via.placeholder.com/500x750.png?text=No+Poster';

    card.innerHTML = `<img src="${posterUrl}" alt="${movie.title}" loading="lazy">`;
    
    return card;
}
