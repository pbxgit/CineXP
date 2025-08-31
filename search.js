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
    appContainer.innerHTML = '<div class="loading-spinner"></div>'; 

    try {
        const response = await fetch(`/api/tmdb?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        appContainer.innerHTML = ''; 

        if (data.results && data.results.length > 0) {
            data.results.forEach(movie => {
                // THE FIX: Call the new function name, 'createMediaCard'
                // We pass 'movie' as the mediaType because our API currently only searches for movies.
                const movieCard = createMediaCard(movie, 'movie'); 
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
