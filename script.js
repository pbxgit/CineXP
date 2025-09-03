document.addEventListener('DOMContentLoaded', () => {
    // Select new DOM elements
    const heroSection = document.getElementById('hero-section');
    const carouselContainer = document.getElementById('carousel-container');
    const imageBaseUrl = 'https://image.tmdb.org/t/p/';

    // --- API CALLING (Unified function is still perfect) ---
    async function fetchFromTMDb(endpoint, params = {}) {
        const url = new URL('/.netlify/functions/getMedia', window.location.origin);
        url.searchParams.append('endpoint', endpoint);
        for (const key in params) {
            url.searchParams.append(key, params[key]);
        }
        try {
            const response = await fetch(url.toString());
            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
            return response.json();
        } catch (error) {
            console.error('Error fetching from Netlify function:', error);
            return null;
        }
    }

    // --- HERO SECTION BUILDER ---
    function displayHero(item) {
        if (!item) return;
        const backdropUrl = imageBaseUrl + 'w1280' + item.backdrop_path;
        heroSection.style.backgroundImage = `url(${backdropUrl})`;

        const title = item.title || item.name;
        
        heroSection.innerHTML = `
            <div class="hero-content">
                <h2 class="hero-title">${title}</h2>
                <p class="hero-overview">${item.overview}</p>
                <!-- Buttons can be added here later -->
            </div>
        `;
    }

    // --- CAROUSEL BUILDER ---
    function createCarousel(title, items) {
        if (!items || items.length === 0) return;

        const carousel = document.createElement('div');
        carousel.classList.add('carousel');

        const track = document.createElement('div');
        track.classList.add('carousel-track');

        items.forEach(item => {
            if (!item.poster_path) return;
            const card = document.createElement('div');
            card.classList.add('poster-card');
            card.innerHTML = `<img src="${imageBaseUrl}w500${item.poster_path}" alt="${item.title || item.name}">`;
            track.appendChild(card);
        });

        carousel.innerHTML = `<h3 class="carousel-title">${title}</h3>`;
        carousel.appendChild(track);
        carouselContainer.appendChild(carousel);
    }

    // --- MAIN FUNCTION TO LOAD HOMEPAGE ---
    async function loadHomepage() {
        // Use Promise.all to fetch all data concurrently for faster loading
        const [trendingData, popularMoviesData, topRatedShowsData] = await Promise.all([
            fetchFromTMDb('trending/all/week'),
            fetchFromTMDb('movie/popular'),
            fetchFromTMDb('tv/top_rated')
        ]);

        if (trendingData && trendingData.results.length > 0) {
            // Use the first trending item for the hero
            displayHero(trendingData.results[0]);
            createCarousel('Trending This Week', trendingData.results);
        }
        if (popularMoviesData) {
            createCarousel('Popular Movies', popularMoviesData.results);
        }
        if (topRatedShowsData) {
            createCarousel('Top Rated TV Shows', topRatedShowsData.results);
        }
    }

    // --- WHITELISTING & INITIALIZATION ---
    // We need to add our new endpoints to the function's whitelist!
    // Go to `netlify/functions/getMedia.js` and add:
    // 'movie/popular'
    // 'tv/top_rated'
    
    loadHomepage();
});
