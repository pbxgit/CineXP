document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');

    fetch('/api/watchlist')
        .then(response => response.json())
        .then(watchlistData => {
            // Log the raw data we get from the server to the browser console
            console.log("Received raw watchlist data from API:", watchlistData);

            appContainer.innerHTML = '';
            if (watchlistData && watchlistData.length > 0) {
                watchlistData.forEach(itemData => {
                    try {
                        // The data from KV might already be an object, or it might be a string.
                        // This handles both cases safely.
                        const item = (typeof itemData === 'string') ? JSON.parse(itemData) : itemData;

                        if (item && item.id) {
                            const mediaCard = createMediaCard(item, item.media_type);
                            appContainer.appendChild(mediaCard);
                        } else {
                            console.warn("Skipping invalid item from watchlist:", itemData);
                        }
                    } catch (error) {
                        console.error("Failed to parse an item from the watchlist:", itemData, error);
                    }
                });

                // After trying to render, if the container is still empty, it means all items were invalid.
                if (appContainer.innerHTML === '') {
                     appContainer.innerHTML = '<p class="placeholder-text">Could not display watchlist items. Data may be corrupted.</p>';
                }

            } else {
                appContainer.innerHTML = '<p class="placeholder-text">Add movies and shows to see them here.</p>';
            }
        })
        .catch(error => {
            console.error("Failed to fetch or process watchlist:", error);
            appContainer.innerHTML = '<p class="error-message">Could not load your watchlist.</p>';
        });
});
