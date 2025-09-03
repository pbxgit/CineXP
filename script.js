document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const heroSection = document.getElementById('hero-section');
    const heroBackground = document.getElementById('hero-background');
    const heroTitle = document.getElementById('hero-title');
    const heroOverview = document.getElementById('hero-overview');
    const pageContent = document.getElementById('page-content');
    const imageBaseUrl = 'https://image.tmdb.org/t/p/';

    // --- GSAP Parallax Animation ---
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        // The 0.3 factor creates the parallax effect. Lower number = more pronounced effect.
        gsap.to(heroBackground, {
            y: scrollY * 0.3,
            ease: "power1.out" // Makes the movement smooth
        });
    });

    // --- API & DATA HANDLING ---
    async function fetchFromTMDb(endpoint) {
        // Our unified function remains perfect.
        const url = new URL('/.netlify/functions/getMedia', window.location.origin);
        url.searchParams.append('endpoint', endpoint);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return response.json();
        } catch (error) {
            console.error("Fetch error:", error);
            return null;
        }
    }

    // --- UI BUILDERS ---
    function displayHero(item) {
        if (!item) return;
        const backdropUrl = imageBaseUrl + 'original' + item.backdrop_path;
        heroBackground.style.backgroundImage = `url(${backdropUrl})`;
        heroTitle.textContent = item.title || item.name;
        heroOverview.textContent = item.overview;
    }

    function createCarousel(title, items) {
        if (!items || items.length === 0) return;
        const carousel = document.createElement('div');
        carousel.className = 'carousel';

        const track = document.createElement('div');
        track.className = 'carousel-track';

        items.forEach(item => {
            if (!item.poster_path) return;
            const card = document.createElement('div');
            card.className = 'poster-card';
            card.innerHTML = `<img src="${imageBaseUrl}w500${item.poster_path}" alt="${item.title || item.name}">`;
            track.appendChild(card);
        });

        carousel.innerHTML = `<h2 class="carousel-title">${title}</h2>`;
        carousel.appendChild(track);
        pageContent.appendChild(carousel);
    }

    // --- INITIALIZATION ---
    async function loadHomepage() {
        // For now, we only need trending data
        const trendingData = await fetchFromTMDb('trending/all/week');
        
        if (trendingData && trendingData.results) {
            // First item becomes the hero
            displayHero(trendingData.results[0]);
            // The rest populate the first carousel
            createCarousel('Trending This Week', trendingData.results.slice(1));
        }
    }

    // Your getMedia function is already whitelisted for 'trending/all/week',
    // so no changes are needed there.

    loadHomepage();
});
