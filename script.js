document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    // These are the empty containers in our HTML that we will fill with content.
    const showcaseSection = document.getElementById('showcase-section');
    const pageContent = document.getElementById('page-content');
    const imageBaseUrl = 'https://image.tmdb.org/t/p/';

    // --- API & DATA HANDLING ---
    // This function calls our own secure backend engine. It does NOT call TMDb directly.
    async function fetchFromTMDb(endpoint, params = {}) {
        const url = new URL('/.netlify/functions/getMedia', window.location.origin);
        url.searchParams.append('endpoint', endpoint);
        for (const key in params) { url.searchParams.append(key, params[key]); }
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`API Error: ${response.status}`, await response.json());
                return null;
            }
            return response.json();
        } catch (error) {
            console.error("Fatal error fetching from Netlify function:", error);
            return null;
        }
    }

    // --- UI BUILDERS ---
    // This function constructs the HTML for the top showcase section.
    function displayShowcase(item) {
        if (!item || !item.backdrop_path) {
            console.warn("Showcase item invalid or missing backdrop. Skipping.");
            return;
        }
        const backdropUrl = imageBaseUrl + 'original' + item.backdrop_path;
        
        showcaseSection.innerHTML = `
            <div class="showcase-background">
                <img src="${backdropUrl}" alt="Promotional backdrop for ${item.title || item.name}">
            </div>
            <div class="showcase-content">
                <h1 class="showcase-title">${item.title || item.name}</h1>
                <p class="showcase-overview">${item.overview}</p>
            </div>
        `;
    }

    // This function constructs the HTML for a single carousel.
    function createCarousel(title, items) {
        if (!items || items.length === 0) {
            console.warn(`No items for carousel "${title}". Skipping.`);
            return;
        }
        
        const carousel = document.createElement('div');
        carousel.className = 'carousel';

        let cardsHTML = '';
        items.forEach(item => {
            if (item.poster_path) {
                cardsHTML += `
                    <div class="poster-card">
                        <img src="${imageBaseUrl}w500${item.poster_path}" alt="Poster for ${item.title || item.name}">
                    </div>
                `;
            }
        });

        if (cardsHTML === '') return; // Don't create a carousel if no items had posters.

        carousel.innerHTML = `
            <h2 class="carousel-title">${title}</h2>
            <div class="carousel-track">${cardsHTML}</div>
        `;
        pageContent.appendChild(carousel);
    }

    // --- INITIALIZATION ---
    // This is the master function that runs when the page loads.
    async function initialize() {
        // We use Promise.all to fetch both lists at the same time for speed.
        const [popularMovies, topRatedShows] = await Promise.all([
            fetchFromTMDb('movie/popular'),
            fetchFromTMDb('tv/top_rated')
        ]);
        
        // Populate the Showcase with the #1 most popular movie.
        if (popularMovies && popularMovies.results) {
            displayShowcase(popularMovies.results[0]);
            createCarousel('Popular Movies', popularMovies.results.slice(1));
        }

        // Populate the second carousel with top-rated shows.
        if (topRatedShows && topRatedShows.results) {
            createCarousel('Top Rated TV Shows', topRatedShows.results);
        }
    }
    
    initialize();
});
