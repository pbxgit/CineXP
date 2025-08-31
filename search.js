document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    searchButton.addEventListener('click', performSearch);
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
                const movieCard = createMediaCard(movie, 'movie'); 
                appContainer.appendChild(movieCard);
            });
        } else {
            appContainer.innerHTML = '<p class="placeholder-text">No results found.</p>';
        }
    } catch (error) {
        appContainer.innerHTML = '<p class="error-message">Failed to load search results.</p>';
    }
}
