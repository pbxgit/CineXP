/**
 * =================================================================
 * Movie Explorer - Main JavaScript File (Final Version)
 * =================================================================
 *
 * This version populates the Hero Slider, fixing the "black screen" issue,
 * and also populates the content shelves below it.
 *
 */

const API_BASE_URL = '/.netlify/functions/get-media';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

/**
 * -----------------------------------------------------------------
 * Main Initializer
 * -----------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', () => {
    handleHeaderScroll();

    if (document.body.classList.contains('home-page')) {
        initHomePage();
    } else if (document.body.classList.contains('details-page')) {
        initDetailsPage();
    }
});

/**
 * -----------------------------------------------------------------
 * Global UI Functions
 * -----------------------------------------------------------------
 */
function handleHeaderScroll() {
    const header = document.getElementById('main-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
}

/**
 * -----------------------------------------------------------------
 * Homepage Logic
 * -----------------------------------------------------------------
 */
async function initHomePage() {
    console.log("Homepage Initializing...");
    try {
        const [trendingMovies, popularTV] = await Promise.all([
            fetchMediaData('trending_movies'),
            fetchMediaData('popular_tv')
        ]);

        // *** FIX: Populate the Hero Section ***
        populateHeroSlider(trendingMovies.results);

        // Populate the content shelves that are below the hero
        populateShelf('trending-shelf', 'Top Rated Movies', trendingMovies.results, 'movie');
        populateShelf('popular-shelf', 'Popular on TV', popularTV.results, 'tv');

    } catch (error) {
        console.error("CRITICAL: Failed to initialize home page.", error);
        const mainContent = document.getElementById('main-content-area');
        if(mainContent) {
            mainContent.innerHTML = `<div class="container"><p style="text-align: center; padding: 4rem 0;">Could not load content. Please try again later.</p></div>`;
        }
    } finally {
        // This class triggers the CSS to hide the skeleton loaders for the shelves
        document.body.classList.add('loaded');
        console.log("Homepage 'loaded' class applied.");
    }
}

// *** NEW FUNCTION TO BUILD THE HERO SLIDER ***
function populateHeroSlider(items) {
    const wrapper = document.getElementById('hero-slider-wrapper');
    const contentContainer = document.getElementById('hero-content-container');
    if (!wrapper || !contentContainer || !items || items.length === 0) return;

    // Use the top 5 trending items for the slider
    const sliderItems = items.slice(0, 5);

    let sliderHTML = '';
    let contentHTML = '';

    sliderItems.forEach((item, index) => {
        const backdropUrl = `${TMDB_IMAGE_BASE_URL}original${item.backdrop_path}`;
        const title = item.title || item.name;
        
        // Create the background slide image
        sliderHTML += `
            <div class="swiper-slide">
                <div class="hero-slide-background" style="background-image: url(${backdropUrl});"></div>
            </div>
        `;
        
        // Create the corresponding content for the slide
        const activeClass = index === 0 ? 'is-active' : '';
        contentHTML += `
            <div class="hero-content ${activeClass}" data-slide="${index}">
                <h1 class="hero-title-fallback">${title}</h1>
                <p class="hero-overview">${item.overview}</p>
                <a href="/details.html?id=${item.id}&type=${item.media_type}" class="hero-cta">View Details</a>
            </div>
        `;
    });
    
    wrapper.innerHTML = sliderHTML;
    contentContainer.innerHTML = contentHTML;

    // Initialize the Swiper slider
    new Swiper('.hero-slider', {
        loop: true,
        effect: 'fade',
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        on: {
            slideChange: function () {
                document.querySelectorAll('.hero-content').forEach(el => el.classList.remove('is-active'));
                const activeContent = document.querySelector(`.hero-content[data-slide="${this.realIndex}"]`);
                if (activeContent) {
                    activeContent.classList.add('is-active');
                }
            }
        }
    });
}

function populateShelf(elementId, title, items, defaultType) {
    const shelfElement = document.getElementById(elementId);
    if (!shelfElement || !items || items.length === 0) return;

    const itemsHtml = items.map(item => createMediaCard(item, defaultType)).join('');
    shelfElement.innerHTML = `
        <div class="container">
            <h2 class="shelf-title">${title}</h2>
            <div class="media-scroller"><div class="media-scroller-inner">${itemsHtml}</div></div>
        </div>
    `;
}

function createMediaCard(item, defaultType) {
    const posterPath = item.poster_path ? `${TMDB_IMAGE_BASE_URL}w342${item.poster_path}` : '';
    const mediaType = item.media_type || defaultType;
    const itemTitle = item.title || item.name;

    return `
        <a href="/details.html?id=${item.id}&type=${mediaType}" class="media-card" title="${itemTitle}">
            <img src="${posterPath}" alt="${itemTitle}" loading="lazy">
        </a>
    `;
}

/**
 * -----------------------------------------------------------------
 * Details Page Logic (No Changes Needed Here)
 * -----------------------------------------------------------------
 */
async function initDetailsPage() {
    // This function remains the same as before
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('type');

    if (!mediaId || !mediaType) {
        displayDetailsError("Page not found: Media ID or type is missing.");
        return;
    }
    try {
        const data = await fetchMediaData('details', { type: mediaType, id: mediaId });
        populateDetailsPage(data);
    } catch (error) {
        displayDetailsError("Could not load details for this item.");
    }
}

function populateDetailsPage({ details, logoUrl }) {
    document.getElementById('skeleton-loader').style.display = 'none';
    const backdropImage = document.getElementById('backdrop-image');
    if (details.backdrop_path) {
        backdropImage.style.backgroundImage = `url(${TMDB_IMAGE_BASE_URL}original${details.backdrop_path})`;
        backdropImage.style.opacity = '1';
    }
    const mainContent = document.getElementById('details-main-content');
    const title = details.title || details.name;
    const titleElement = logoUrl ? `<img src="${logoUrl}" alt="${title}" class="media-logo">` : `<h1 class="fallback-title">${title}</h1>`;
    mainContent.innerHTML = `<div class="details-content-overlay">${titleElement}<p class="details-overview">${details.overview}</p></div>`;
}

function displayDetailsError(message) {
    const mainContent = document.getElementById('details-main-content');
    mainContent.innerHTML = `<div class="details-content-overlay"><h1 class="fallback-title">Error</h1><p>${message}</p></div>`;
}

/**
 * -----------------------------------------------------------------
 * Reusable Data Fetching Function
 * -----------------------------------------------------------------
 */
async function fetchMediaData(endpoint, params = {}) {
    const url = new URL(API_BASE_URL, window.location.origin);
    url.searchParams.set('endpoint', endpoint);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json();
}
