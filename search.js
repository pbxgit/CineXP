// CINEVERSE - Search Page Logic

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    // Trigger search when the button is clicked
    searchButton.addEventListener('click', performSearch);

    // Trigger search when the user presses "Enter"
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            fetchSearchResults(query);
        }
    }
});

async function fetchSearchResults(query) {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = '<div class="loading-spinner"></div>'; // Show loading spinner

    try {
        // Call our API with the user's search query
        const response = await fetch(`/api/tmdb?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        appContainer.innerHTML = ''; // Clear spinner

        if (data.results && data.results.length > 0) {
            data.results.forEach(movie => {
                // We can reuse the createMovieCard function from app.js!
                const movieCard = createMovieCard(movie);
                appContainer.appendChild(movieCard);
            });
        } else {
            appContainer.innerHTML = '<p class="placeholder-text">No results found.</p>';
        }
    } catch (error) {
        console.error('Error fetching search results:', error);
        appContainer.innerHTML = '<p class="error-message">Failed to load search results.</p>';
    }
}
