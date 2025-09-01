// main.js - V6: Simplified & Corrected

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('is-loaded');
    initializeHomepage();
});

async function initializeHomepage() {
    const contentContainer = document.getElementById('content-container');
    
    try {
        const [moviesResponse, showsResponse, recommendedResponse] = await Promise.all([
            fetch('/api/tmdb?media_type=movie'),
            fetch('/api/tmdb?media_type=tv'),
            fetch('/api/tmdb?endpoint=top_rated')
        ]);

        if (!moviesResponse.ok || !showsResponse.ok || !recommendedResponse.ok) {
            throw new Error('One or more API requests failed.');
        }

        const moviesData = await moviesResponse.json();
        const showsData = await showsResponse.json();
        const recommendedData = await recommendedResponse.json();
        
        contentContainer.innerHTML = '';

        if (moviesData.results?.length > 0) {
            renderHeroCarousel(moviesData.results.slice(0, 5));
            renderCategoryRow('Popular Movies', moviesData.results, contentContainer, 'movie');
        }
        
        if (recommendedData.results?.length > 0) {
            renderCategoryRow('Recommended For You', recommendedData.results, contentContainer, 'movie');
        }

        if (showsData.results?.length > 0) {
            renderCategoryRow('Popular TV Shows', showsData.results, contentContainer, 'tv');
        }

    } catch (error) {
        console.error("Initialization Error:", error);
        document.getElementById('hero-carousel').innerHTML = ''; // Clear spinner
        contentContainer.innerHTML = `<p class="error-message">Could not load the Cineverse.</p>`;
    }
}
// ALL OTHER FUNCTIONS in main.js (renderHeroCarousel, startCarousel, etc.) are unchanged from the version that had the shuffle and persistent animations. They can remain as they were.
