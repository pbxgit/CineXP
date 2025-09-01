// main.js - V5: Recommendations & Global Header Integration

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('is-loaded');
    // Dynamically load the header on the homepage
    fetch('header.html')
        .then(res => res.text())
        .then(data => {
            document.getElementById('global-header').innerHTML = data;
            // Run the global script logic for the newly loaded header
            const globalScript = document.createElement('script');
            globalScript.src = 'global.js';
            document.body.appendChild(globalScript);
        });
    initializeHomepage();
});

// ... (The rest of main.js remains largely the same, but with one new function call)

async function initializeHomepage() {
    const contentContainer = document.getElementById('content-container');
    contentContainer.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const [moviesResponse, showsResponse, recommendedResponse] = await Promise.all([
            fetch('/api/tmdb?media_type=movie'),
            fetch('/api/tmdb?media_type=tv'),
            fetch('/api/tmdb?endpoint=top_rated') // Fetch top-rated as placeholder for AI
        ]);

        if (!moviesResponse.ok || !showsResponse.ok || !recommendedResponse.ok) {
            throw new Error('Failed to fetch media from the API.');
        }

        const moviesData = await moviesResponse.json();
        const showsData = await showsResponse.json();
        const recommendedData = await recommendedResponse.json();
        
        contentContainer.innerHTML = '';

        if (moviesData.results && moviesData.results.length > 0) {
            renderHeroCarousel(moviesData.results.slice(0, 5));
            renderCategoryRow('Popular Movies', moviesData.results, contentContainer, 'movie');
        }
        
        // --- NEW RECOMMENDATIONS ROW ---
        if (recommendedData.results && recommendedData.results.length > 0) {
            renderCategoryRow('Recommended For You', recommendedData.results, contentContainer, 'movie');
        }

        if (showsData.results && showsData.results.length > 0) {
            renderCategoryRow('Popular TV Shows', showsData.results, contentContainer, 'tv');
        }

    } catch (error) {
        console.error("Initialization Error:", error);
        contentContainer.innerHTML = `<p class="error-message">Could not load the Cineverse.</p>`;
    }
}

// ALL OTHER FUNCTIONS in main.js (renderHeroCarousel, startCarousel, renderCategoryRow, createMediaCard, and the delegated click listener) remain EXACTLY THE SAME as the previous version. You can copy them from the last update.
