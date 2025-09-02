// =================================================================
//                 MEDIA EXPLORER - MAIN JAVASCRIPT
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // This is the entry point. It runs when the page is ready.
    // We check which page we are on and run the appropriate functions.
    
    // Global elements that are on most pages
    const mainHeader = document.getElementById('main-header');

    // Initialize Global Features
    if (mainHeader) {
        initStickyHeader(mainHeader);
    }

    // Page-specific initializations
    if (document.body.classList.contains('home-page')) {
        initHomepage();
    }
    
    if (document.body.classList.contains('details-page')) {
        // We will add the details page logic here later
    }

    if (document.body.classList.contains('watchlist-page')) {
        // We will add the watchlist page logic here later
    }
});


// =================================================================
//                 GLOBAL & UTILITY FUNCTIONS
// =================================================================

/**
 * Attaches a scroll listener to the window to add a 'scrolled' class
 * to the header when the user scrolls down.
 * @param {HTMLElement} headerElement The main header element.
 */
function initStickyHeader(headerElement) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            headerElement.classList.add('scrolled');
        } else {
            headerElement.classList.remove('scrolled');
        }
    });
}

/**
 * A reusable utility to fetch data from our Netlify functions.
 * @param {string} endpoint The specific API endpoint to hit (e.g., 'trending_movies').
 * @returns {Promise<object>} The JSON data from the API.
 */
async function fetchData(endpoint, params = '') {
    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=${endpoint}${params}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error(`Failed to fetch data for endpoint "${endpoint}":`, error);
        // Return a default structure to prevent the app from crashing
        return { results: [] };
    }
}


// =================================================================
//                         HOMEPAGE LOGIC
// =================================================================

/**
 * Initializes all functionality for the homepage.
 */
async function initHomepage() {
    // Use Promise.all to fetch all data concurrently for faster loading
    const [heroData, top10Data, trendingData, popularData] = await Promise.all([
        fetchData('trending_movies'), // Using trending for the hero slider
        fetchData('top_rated_movies'), // Using top rated for the Top 10
        fetchData('trending_movies'),
        fetchData('popular_tv')
    ]);

    // Populate the page sections with the fetched data
    populateHeroSlider(heroData.results);
    populateShelf('top-10-shelf', top10Data.results.slice(0, 10), 'top-ten');
    populateShelf('trending-shelf', trendingData.results, 'standard', 'Trending Movies');
    populateShelf('popular-shelf', popularData.results, 'standard', 'Popular TV Shows');

    // Once data is loaded and rendered, hide skeleton and show content
    document.body.classList.add('loaded');
}

/**
 * Populates the hero slider with media content.
 * @param {Array} mediaList An array of media objects for the slider.
 */
function populateHeroSlider(mediaList) {
    const sliderWrapper = document.getElementById('hero-slider-wrapper');
    if (!sliderWrapper) return;

    // Clear the skeleton loader
    sliderWrapper.innerHTML = ''; 

    sliderWrapper.innerHTML = mediaList.slice(0, 5).map(media => createHeroSlide(media)).join('');

    // Initialize Swiper.js after the slides are in the DOM
    new Swiper('.hero-slider', {
        loop: true,
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        },
        autoplay: {
            delay: 7000, // A bit longer for hero slides
            disableOnInteraction: false,
            pauseOnMouseEnter: true, // Pauses slider when mouse is over it
        },
        speed: 1000,
    });
}

/**
 * Populates a generic media shelf.
 * @param {string} shelfId The ID of the shelf element.
 * @param {Array} mediaList An array of media objects.
 * @param {string} cardType The type of card to render ('standard' or 'top-ten').
 * @param {string} [title] The title for the shelf (optional).
 */
function populateShelf(shelfId, mediaList, cardType, title) {
    const shelfElement = document.getElementById(shelfId);
    if (!shelfElement) return;

    let content = '';
    if (title) {
        content += `<h2 class="shelf-title container">${title}</h2>`;
    }

    const scrollerContent = mediaList.map((media, index) => {
        if (cardType === 'top-ten') {
            return createTopTenCard(media, index);
        }
        return createMediaCard(media);
    }).join('');

    content += `<div class="media-scroller"><div class="media-scroller-inner">${scrollerContent}</div></div>`;
    shelfElement.innerHTML = content;
}


// =================================================================
//                      COMPONENT FUNCTIONS
// =================================================================
// These functions generate the HTML for different UI elements.

/**
 * Creates the HTML for a single hero slide.
 * @param {object} media The media object from the API.
 * @returns {string} The HTML string for the slide.
 */
const createHeroSlide = (media) => {
    const backdropUrl = `https://image.tmdb.org/t/p/original${media.backdrop_path}`;
    // For now, we use a title fallback. We can integrate logos later.
    const title = media.title || media.name; 
    const mediaType = media.title ? 'movie' : 'tv';

    return `
        <div class="swiper-slide hero-slide" style="background-image: url('${backdropUrl}');">
            <div class="hero-slide-content">
                <h2 class="hero-slide-title-fallback">${title}</h2>
                <p>${media.overview.substring(0, 150)}...</p>
                <a href="/details.html?type=${mediaType}&id=${media.id}" class="hero-cta-button">View Details</a>
            </div>
        </div>
    `;
};

/**
 * Creates the HTML for a standard media card.
 * @param {object} media The media object from the API.
 * @returns {string} The HTML string for the card.
 */
const createMediaCard = (media) => {
    const posterUrl = `https://image.tmdb.org/t/p/w500${media.poster_path}`;
    const title = media.title || media.name;
    const mediaType = media.title ? 'movie' : 'tv';

    return `
        <a href="/details.html?type=${mediaType}&id=${media.id}" class="media-card" title="${title}">
            <img src="${posterUrl}" alt="${title}" loading="lazy" width="200" height="300">
        </a>
    `;
};

/**
 * Creates the HTML for a Top 10 card.
 * @param {object} media The media object from the API.
 * @param {number} rank The rank (index) of the item.
 * @returns {string} The HTML string for the card.
 */
const createTopTenCard = (media, rank) => {
    const posterUrl = `https://image.tmdb.org/t/p/w500${media.poster_path}`;
    const title = media.title || media.name;
    const mediaType = media.title ? 'movie' : 'tv';

    return `
        <a href="/details.html?type=${mediaType}&id=${media.id}" class="top-ten-card" title="${title}">
            <span class="top-ten-number">${rank + 1}</span>
            <img src="${posterUrl}" alt="${title}" class="top-ten-poster" loading="lazy" width="180" height="270">
        </a>
    `;
};
