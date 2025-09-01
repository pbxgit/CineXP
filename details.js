// details.js - V6: Simplified & Corrected

document.addEventListener('DOMContentLoaded', async () => {
    document.body.classList.add('is-loaded');
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('type');

    if (mediaId && mediaType) {
        try {
            const [mediaResponse, watchlistResponse] = await Promise.all([
                fetch(`/api/tmdb?id=${mediaId}&media_type=${mediaType}`),
                fetch('/api/watchlist')
            ]);

            if (!mediaResponse.ok) throw new Error("Could not load media details.");
            
            const media = await mediaResponse.json();
            const watchlist = watchlistResponse.ok ? await watchlistResponse.json() : [];
            const isInWatchlist = watchlist.some(item => item.id.toString() === media.id.toString());

            renderMediaDetails(media, mediaType, isInWatchlist);
        } catch (error) {
            console.error("Details page error:", error);
            showError(error.message);
        }
    } else {
        showError("Missing media information.");
    }
});
// ALL OTHER FUNCTIONS (renderMediaDetails, updateWatchlistButton, showError) are unchanged from the previous version. They can remain.
