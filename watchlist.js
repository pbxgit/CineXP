document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');

    // Fetch the watchlist data from our API
    fetch('/api/watchlist')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(watchlistData => {
            // Clear the loading spinner
            appContainer.innerHTML = '';

            // Check if the watchlist has any items
            if (watchlistData && watchlistData.length > 0) {
                watchlistData.forEach(itemStr => {
                    const item = JSON.parse(itemStr);
                    // Reuse the universal createMediaCard function from app.js
                    const mediaCard = createMediaCard(item, item.media_type);
                    appContainer.appendChild(mediaCard);
                });
            } else {
                // Display a message if the watchlist is empty
                appContainer.innerHTML = '<p class="placeholder-text">Add movies and shows to see them here.</p>';
            }
        })
        .catch(error => {
            console.error("Failed to fetch watchlist:", error);
            appContainer.innerHTML = '<p class="error-message">Could not load your watchlist.</p>';
        });
});
