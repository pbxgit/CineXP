/*
=====================================================
    Personal Media Explorer - Main JavaScript File (CORRECTED)
=====================================================

    TABLE OF CONTENTS
    -----------------
    1.  DOM ELEMENT SELECTION
    2.  API ENDPOINT
    3.  CORE LOGIC: DATA FETCHING & PAGE BUILDING
    4.  INITIALIZATION & EVENT LISTENERS
    5.  UI INTERACTIVITY & ANIMATIONS
*/

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM ELEMENT SELECTION ---
    const heroSliderWrapper = document.getElementById('hero-slider-wrapper');
    const topTenGrid = document.getElementById('top-10-grid');
    const trendingMoviesGrid = document.getElementById('trending-movies-grid');
    const popularTvGrid = document.getElementById('popular-tv-grid');
    const header = document.getElementById('main-header');

    // --- 2. API ENDPOINT (CORRECTED) ---
    // This now points to your single, consolidated Netlify function.
    const API_BASE_URL = '/.netlify/functions/get-media';

    // --- 3. CORE LOGIC: DATA FETCHING & PAGE BUILDING ---

    /**
     * Corrected function to fetch data using the proper endpoint parameter.
     * @param {string} endpoint - The instruction for the get-media function (e.g., 'trending_movies').
     * @returns {Promise<any>} The JSON data from the response, or null on error.
     */
    async function fetchData(endpoint) {
        const url = `${API_BASE_URL}?endpoint=${endpoint}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Network response was not ok. Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch from ${url}:`, error);
            return null;
        }
    }

    /**
     * Populates the hero slider and initializes Swiper.
     * @param {Array} movies - An array of movie objects.
     */
    function populateHeroSlider(movies = []) {
        if (!movies.length || !heroSliderWrapper) return;
        const sliderMovies = movies.slice(0, 5);

        heroSliderWrapper.innerHTML = sliderMovies.map(movie => {
            const backdropUrl = `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;
            return `
                <div class="swiper-slide hero-slide" style="background-image: url(${backdropUrl});">
                    <a href="/details.html?id=${movie.id}&type=movie" class="hero-slide-content">
                        <h2 class="hero-slide-title">${movie.title}</h2>
                        <p class="hero-slide-overview">${movie.overview}</p>
                    </a>
                </div>
            `;
        }).join('');

        new Swiper('.hero-slider', {
            loop: true, effect: 'fade', fadeEffect: { crossFade: true },
            autoplay: { delay: 6000, disableOnInteraction: false },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        });
    }

    /**
     * Populates a standard media shelf.
     * @param {Array} mediaItems - An array of media objects.
     * @param {HTMLElement} gridElement - The DOM element to inject the cards into.
     */
    function populateStandardShelf(mediaItems = [], gridElement) {
        if (!mediaItems.length || !gridElement) return;

        gridElement.innerHTML = mediaItems.map(item => {
            if (!item.poster_path) return ''; // Skip items without a poster
            const posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
            const title = item.title || item.name;
            const mediaType = item.title ? 'movie' : 'tv';
            return `
                <a href="/details.html?id=${item.id}&type=${mediaType}" class="media-card">
                    <img src="${posterUrl}" alt="${title}" loading="lazy">
                </a>`;
        }).join('');
    }

    /**
     * Populates the "Top 10" shelf.
     * @param {Array} movies - An array of movie objects.
     * @param {HTMLElement} gridElement - The DOM element to inject the cards into.
     */
    // In main.js, REPLACE the entire populateTopTenShelf function with this:

function populateTopTenShelf(movies = [], gridElement) {
    if (!movies.length || !gridElement) return;
    const topTenMovies = movies.slice(0, 10);

    gridElement.innerHTML = topTenMovies.map((movie, index) => {
        if (!movie.poster_path) return ''; // Skip items without a poster
        const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        
        // This structure with the .poster-wrapper is crucial for the fade effect
        return `
            <a href="/details.html?id=${movie.id}&type=movie" class="top-ten-card">
                <div class="top-ten-number">${index + 1}</div>
                <div class="poster-wrapper">
                    <img src="${posterUrl}" alt="${movie.title}" class="top-ten-poster" loading="lazy">
                </div>
            </a>
        `;
    }).join('');
}

    
    // --- 4. INITIALIZATION ---

    async function initializeHomepage() {
        // Fetch all data concurrently using the corrected function calls
        const [trendingData, popularTvData, topRatedData] = await Promise.all([
            fetchData('trending_movies'),
            fetchData('popular_tv'),
            fetchData('top_rated_movies') // This will now work after updating get-media.js
        ]);

        if (trendingData && trendingData.results) {
            populateHeroSlider(trendingData.results);
            populateStandardShelf(trendingData.results, trendingMoviesGrid);
        }
        if (popularTvData && popularTvData.results) {
            populateStandardShelf(popularTvData.results, popularTvGrid);
        }
        if (topRatedData && topRatedData.results) {
            populateTopTenShelf(topRatedData.results, topTenGrid);
        }
    }

    initializeHomepage();

    // --- 5. UI INTERACTIVITY & ANIMATIONS ---
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 50));
    const animatedElements = document.querySelectorAll('[data-animation="fade-in-up"]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    animatedElements.forEach(element => observer.observe(element));
});
