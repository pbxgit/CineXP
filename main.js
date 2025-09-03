/**
 * =================================================================
 * Movie Explorer - Main JavaScript File (Definitive Version)
 * =================================================================
 *
 * This script is designed to work with your original HTML and CSS.
 * It populates ALL dynamic sections of the homepage to ensure the
 * entire page loads correctly.
 *
 * It will:
 * 1. Build the Hero Slider to remove the initial black screen.
 * 2. Build the "Premiere Section" with its headliner and shortlist.
 * 3. Build the standard content shelves below.
 * 4. Ensure all links to the details page are correct.
 * 5. Load data correctly on the details page.
 *
 */

const API_BASE_URL = '/.netlify/functions/get-media';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

/**
 * -----------------------------------------------------------------
 * Main Initializer - Runs when the page is ready
 * -----------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', () => {
    // A simple router to run the correct code for the current page
    if (document.body.classList.contains('home-page')) {
        initHomePage();
    } else if (document.body.classList.contains('details-page')) {
        initDetailsPage();
    }
});

/**
 * -----------------------------------------------------------------
 * Homepage Logic
 * -----------------------------------------------------------------
 */
async function initHomePage() {
    console.log("Homepage: Initializing all sections.");

    try {
        // Fetch all data needed for the page at once for speed
        const [trendingMovies, popularTV] = await Promise.all([
            fetchAPIData('trending_movies'),
            fetchAPIData('popular_tv')
        ]);

        console.log("Homepage: Data fetched successfully.");

        // Use the data to build the page sections
        populateHeroSlider(trendingMovies.results);
        populatePremiereSection(trendingMovies.results);
        populateShelf('trending-shelf', 'Trending Movies', trendingMovies.results, 'movie');
        populateShelf('popular-shelf', 'Popular on TV', popularTV.results, 'tv');

    } catch (error) {
        console.error("Homepage: A critical error stopped the page from loading.", error);
        const mainContentArea = document.getElementById('main-content-area');
        if (mainContentArea) {
            mainContentArea.innerHTML = `<div class="container"><p>Sorry, content could not be loaded.</p></div>`;
        }
    } finally {
        // This is crucial: It tells the CSS to hide the skeletons and show the real content.
        // It runs even if there was an error, so the page doesn't get stuck.
        document.body.classList.add('loaded');
        console.log("Homepage: 'loaded' class added. Content should be visible.");
    }
}

/**
 * Builds the main hero slider at the top of the page.
 */
function populateHeroSlider(items) {
    const wrapper = document.getElementById('hero-slider-wrapper');
    const contentContainer = document.getElementById('hero-content-container');
    if (!wrapper || !contentContainer || !items || items.length === 0) return;

    const sliderItems = items.slice(0, 5); // Use top 5 for the slider
    let sliderHTML = '';
    let contentHTML = '';

    sliderItems.forEach((item, index) => {
        const backdropUrl = `${TMDB_IMAGE_BASE_URL}original${item.backdrop_path}`;
        sliderHTML += `<div class="swiper-slide"><div class="hero-slide-background" style="background-image: url(${backdropUrl});"></div></div>`;

        const activeClass = index === 0 ? 'is-active' : '';
        contentHTML += `
            <div class="hero-content ${activeClass}" data-slide="${index}">
                <h1 class="hero-title-fallback">${item.title || item.name}</h1>
                <p class="hero-overview">${item.overview}</p>
                <a href="/details.html?id=${item.id}&type=${item.media_type}" class="hero-cta">View Details</a>
            </div>
        `;
    });

    wrapper.innerHTML = sliderHTML;
    contentContainer.innerHTML = contentHTML;

    // This part requires Swiper.js to be loaded, which it is in your index.html
    new Swiper('.hero-slider', {
        loop: true,
        effect: 'fade',
        autoplay: { delay: 5000, disableOnInteraction: false },
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

/**
 * Builds the "Premiere" section with the main headliner and the top list.
 */
function populatePremiereSection(items) {
    const premiereSection = document.getElementById('premiere-section');
    if (!premiereSection || !items || items.length < 6) return;

    const headlinerItem = items[0];
    const shortlistItems = items.slice(1, 6); // Use items 2 through 6 for the list

    const headlinerHTML = `
        <a href="/details.html?id=${headlinerItem.id}&type=${headlinerItem.media_type}" class="premiere-headliner">
            <img src="${TMDB_IMAGE_BASE_URL}w1280${headlinerItem.backdrop_path}" alt="${headlinerItem.title || headlinerItem.name}" class="headliner-backdrop" loading="lazy">
            <div class="headliner-content">
                <h3 class="headliner-logo">${headlinerItem.title || headlinerItem.name}</h3>
                <p class="headliner-overview">${headlinerItem.overview}</p>
            </div>
        </a>
    `;

    const shortlistHTML = shortlistItems.map((item, index) => `
        <a href="/details.html?id=${item.id}&type=${item.media_type}" class="shortlist-item">
            <span class="shortlist-rank">${index + 2}</span>
            <span class="shortlist-title-text">${item.title || item.name}</span>
            <img src="${TMDB_IMAGE_BASE_URL}w92${item.poster_path}" alt="${item.title || item.name}" class="shortlist-poster-peek" loading="lazy">
        </a>
    `).join('');

    premiereSection.innerHTML = `
        ${headlinerHTML}
        <div class="premiere-shortlist">
            <h2 class="shortlist-title">Top Items This Week</h2>
            ${shortlistHTML}
        </div>
    `;
}

/**
 * Builds a standard horizontal media shelf.
 */
function populateShelf(elementId, title, items, defaultType) {
    const shelfElement = document.getElementById(elementId);
    if (!shelfElement || !items || items.length === 0) return;

    const itemsHtml = items.map(item => {
        const posterPath = item.poster_path ? `${TMDB_IMAGE_BASE_URL}w342${item.poster_path}` : '';
        const mediaType = item.media_type || defaultType;
        const itemTitle = item.title || item.name;
        return `
            <a href="/details.html?id=${item.id}&type=${mediaType}" class="media-card" title="${itemTitle}">
                <img src="${posterPath}" alt="${itemTitle}" loading="lazy">
            </a>
        `;
    }).join('');

    shelfElement.innerHTML = `
        <div class="container">
            <h2 class="shelf-title">${title}</h2>
            <div class="media-scroller">
                <div class="media-scroller-inner">
                    ${itemsHtml}
                </div>
            </div>
        </div>
    `;
}


/**
 * -----------------------------------------------------------------
 * Details Page Logic & Utilities (No changes needed here)
 * -----------------------------------------------------------------
 */
async function initDetailsPage() {
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('type');
    if (!mediaId || !mediaType) { displayDetailsError("Page not found: Media ID or type is missing."); return; }
    try {
        const data = await fetchAPIData('details', { type: mediaType, id: mediaId });
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
    if (mainContent) mainContent.innerHTML = `<div class="details-content-overlay"><h1 class="fallback-title">Error</h1><p>${message}</p></div>`;
}

async function fetchAPIData(endpoint, params = {}) {
    const url = new URL(API_BASE_URL, window.location.origin);
    url.searchParams.set('endpoint', endpoint);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
    return response.json();
}
