/*
=====================================================
    Personal Media Explorer - Main JavaScript File
=====================================================

    TABLE OF CONTENTS
    -----------------
    1.  DOM ELEMENT SELECTION
    2.  API ENDPOINTS & CONFIG
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

    // --- 2. API ENDPOINTS & CONFIG ---
    // These URLs must correspond to the names of your Netlify serverless functions.
    // Make sure you have created these functions in your `netlify/functions/` directory.
    const API_ENDPOINTS = {
        trendingMovies: '/.netlify/functions/get-trending-movies',
        popularTV: '/.netlify/functions/get-popular-tv',
        topRatedMovies: '/.netlify/functions/get-top-rated-movies' // Used for the "Top 10"
    };

    // --- 3. CORE LOGIC: DATA FETCHING & PAGE BUILDING ---

    /**
     * A robust, reusable function to fetch data from a given URL.
     * @param {string} url The Netlify Function endpoint to fetch from.
     * @returns {Promise<any>} The JSON data from the response, or null on error.
     */
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Network response was not ok. Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch data from ${url}:`, error);
            // In a real app, you might want to display an error to the user here.
            return null;
        }
    }

    /**
     * Populates the hero slider with movie data and initializes the Swiper instance.
     * @param {Array} movies - An array of movie objects.
     */
    function populateHeroSlider(movies = []) {
        if (!movies.length || !heroSliderWrapper) return;

        // Use the top 5 trending movies for the hero slider
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

        // Initialize Swiper.js AFTER the slides have been added to the DOM
        new Swiper('.hero-slider', {
            loop: true,
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
            autoplay: {
                delay: 6000, // Time between slides
                disableOnInteraction: false,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });
    }

    /**
     * Creates and populates a shelf with standard media cards.
     * @param {Array} mediaItems - An array of movie or TV show objects.
     * @param {HTMLElement} gridElement - The DOM element to inject the cards into.
     */
    function populateStandardShelf(mediaItems = [], gridElement) {
        if (!mediaItems.length || !gridElement) return;

        gridElement.innerHTML = mediaItems.map(item => {
            const posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
            const title = item.title || item.name;
            const mediaType = item.title ? 'movie' : 'tv'; // Determine if it's a movie or TV show

            // Skip items without a poster
            if (!item.poster_path) return ''; 

            return `
                <a href="/details.html?id=${item.id}&type=${mediaType}" class="media-card">
                    <img src="${posterUrl}" alt="${title}" loading="lazy">
                </a>
            `;
        }).join('');
    }

    /**
     * Creates and populates the unique "Top 10" shelf.
     * @param {Array} movies - An array of movie objects.
     * @param {HTMLElement} gridElement - The DOM element to inject the cards into.
     */
    function populateTopTenShelf(movies = [], gridElement) {
        if (!movies.length || !gridElement) return;

        const topTenMovies = movies.slice(0, 10);

        gridElement.innerHTML = topTenMovies.map((movie, index) => {
            const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
            
            // Skip items without a poster
            if (!movie.poster_path) return '';

            return `
                <a href="/details.html?id=${movie.id}&type=movie" class="top-ten-card">
                    <div class="top-ten-number">${index + 1}</div>
                    <img src="${posterUrl}" alt="${movie.title}" class="top-ten-poster" loading="lazy">
                </a>
            `;
        }).join('');
    }

    // --- 4. INITIALIZATION & EVENT LISTENERS ---

    /**
     * The main function to orchestrate the loading of all homepage content.
     */
    async function initializeHomepage() {
        // Fetch all data concurrently for maximum speed
        const [trendingMovieData, popularTvData, topRatedMovieData] = await Promise.all([
            fetchData(API_ENDPOINTS.trendingMovies),
            fetchData(API_ENDPOINTS.popularTV),
            fetchData(API_ENDPOINTS.topRatedMovies)
        ]);

        // Populate the page sections with the fetched data
        if (trendingMovieData && trendingMovieData.results) {
            populateHeroSlider(trendingMovieData.results);
            populateStandardShelf(trendingMovieData.results, trendingMoviesGrid);
        }

        if (popularTvData && popularTvData.results) {
            populateStandardShelf(popularTvData.results, popularTvGrid);
        }
        
        if (topRatedMovieData && topRatedMovieData.results) {
            populateTopTenShelf(topRatedMovieData.results, topTenGrid);
        }
    }

    // Start loading all content as soon as the DOM is ready
    initializeHomepage();

    // --- 5. UI INTERACTIVITY & ANIMATIONS ---

    // Add a class to the header when the user scrolls down
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Set up the Intersection Observer for scroll-triggered animations
    const animatedElements = document.querySelectorAll('[data-animation="fade-in-up"]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Stop observing the element once it has animated in
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    // Observe each element that has the data-animation attribute
    animatedElements.forEach(element => {
        observer.observe(element);
    });
});
