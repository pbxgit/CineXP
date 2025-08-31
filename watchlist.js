document.addEventListener('DOMContentLoaded', () => {
    fetchWatchlist();
});

function fetchWatchlist() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = '<div class="loading-spinner"></div>';
    fetch('/api/watchlist')
        .then(response => response.json())
        .then(watchlistData => {
            appContainer.innerHTML = '';
            if (watchlistData && watchlistData.length > 0) {
                watchlistData.forEach(item => {
                    const mediaCard = createMediaCard(item, item.media_type);
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-button';
                    removeBtn.innerHTML = '&times;';
                    removeBtn.ariaLabel = 'Remove from watchlist';
                    removeBtn.addEventListener('click', async (e) => {
                        e.preventDefault(); 
                        e.stopPropagation();
                        mediaCard.style.opacity = '0.5';
                        await fetch(`/api/watchlist?id=${item.id}`, { method: 'DELETE' });
                        mediaCard.remove();
                    });
                    mediaCard.appendChild(removeBtn);
                    appContainer.appendChild(mediaCard);
                });
            } else {
                appContainer.innerHTML = '<p class="placeholder-text">Your watchlist is empty.</p>';
            }
        })
        .catch(error => {
            appContainer.innerHTML = '<p class="error-message">Could not load your watchlist.</p>';
        });
}
