/**
 * =================================================================
 * Movie Explorer - Main JavaScript File (COMPLETE HOMEPAGE BUILD)
 * =================================================================
 *
 * This definitive version populates all sections of the homepage:
 * 1. Hero Slider
 * 2. Premiere Section (Headliner + Top 10 Shortlist)
 * 3. Standard Media Shelves
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
 * Homepage Logic
 * -----------------------------------------------------------------
 */
async function initHomePage() {
    console.log("Homepage Initializing: Building all sections...");
    try {
        // Fetch all necessary data in parallel for speed
        const [trendingMovies, popularTV] = await Promise.all([
            fetchMediaData('trending_movies'),
            fetchMediaData('popular_tv')
        ]);

        // Use the fetched data to build all parts of the page
        populateHeroSlider(trendingMovies.results);
        populatePremiereSection(trendingMovies.results);
        populateShelf('popular-shelf', 'Popular on TV', popularTV.results, 'tv');

    } catch (error) {
        console.error("CRITICAL: Failed to initialize home page.", error);
        const mainContent = document.getElementById('main-content-area');
        if(mainContent) {
            mainContent.innerHTML = `<div class="container"><p style="text-align: center; padding: 4rem 0;">Could not load content. Please check the console for errors.</p></div>`;
        }
    } finally {
        // This class triggers the corrected CSS to hide skeletons and show content
        document.body.classList.add('loaded');
        console.log("Homepage 'loaded' class applied. All content should be visible.");
    }
}

function populateHeroSlider(items) {
    const wrapper = document.getElementById('hero-slider-wrapper');
    const contentContainer = document.getElementById('hero-content-container');
    if (!wrapper || !contentContainer || !items || items.length === 0) return;

    const sliderItems = items.slice(0, 5); // Use top 5 for hero
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

    new Swiper('.hero-slider', {
        loop: true,
        effect: 'fade',
        autoplay: { delay: 5000, disableOnInteraction: false },
        on: {
            slideChange: function () {
                document.querySelectorAll('.hero-content').forEach(el => el.classList.remove('is-active'));
                document.querySelector(`.hero-content[data-slide="${this.realIndex}"]`)?.classList.add('is-active');
            }
        }
    });
}

// NEW FUNCTION: Builds the Premiere section (headliner + shortlist)
function populatePremiereSection(items) {
    const premiereSection = document.getElementById('premiere-section');
    if (!premiereSection || !items || items.length < 5) return;

    const headlinerItem = items[0]; // Top trending item is the headliner
    const shortlistItems = items.slice(1, 6); // Next 5 items for the list

    // Build the headliner HTML
    const headlinerHTML = `
        <a href="/details.html?id=${headlinerItem.id}&type=${headlinerItem.media_type}" class="premiere-headliner">
            <img src="${TMDB_IMAGE_BASE_URL}w1280${headlinerItem.backdrop_path}" alt="${headlinerItem.title || headlinerItem.name}" class="headliner-backdrop" loading="lazy">
            <div class="headliner-content">
                <h3 class="headliner-logo">${headlinerItem.title || headlinerItem.name}</h3>
                <p class="headliner-overview">${headlinerItem.overview}</p>
            </div>
        </a>
    `;

    // Build the shortlist HTML
    const shortlistHTML = shortlistItems.map((item, index) => `
        <a href="/details.html?id=${item.id}&type=${item.media_type}" class="shortlist-item">
            <span class="shortlist-rank">${index + 2}</span>
            <span class="shortlist-title-text">${item.title || item.name}</span>
            <img src="${TMDB_IMAGE_BASE_URL}w92${item.poster_path}" alt="${item.title || item.name}" class="shortlist-poster-peek" loading="lazy">
        </a>
    `).join('');

    // Combine and inject into the page
    premiereSection.innerHTML = `
        ${headlinerHTML}
        <div class="premiere-shortlist">
            <h2 class="shortlist-title">Top 6 This Week</h2>
            ${shortlistHTML}
        </div>
    `;
}

function populateShelf(elementId, title, items, defaultType) {
    const shelfElement = document.getElementById(elementId);
    if (!shelfElement || !items || items.length === 0) return;

    const itemsHtml = items.map(item => `
        <a href="/details.html?id=${item.id}&type=${item.media_type || defaultType}" class="media-card" title="${item.title || item.name}">
            <img src="${TMDB_IMAGE_BASE_URL}w342${item.poster_path}" alt="${item.title || item.name}" loading="lazy">
        </a>
    `).join('');

    shelfElement.innerHTML = `
        <div class="container">
            <h2 class="shelf-title">${title}</h2>
            <div class="media-scroller"><div class="media-scroller-inner">${itemsHtml}</div></div>
        </div>
    `;
}

/**
 * -----------------------------------------------------------------
 * Details Page & Utility Functions (No changes needed below)
 * -----------------------------------------------------------------
 */
async function initDetailsPage() {
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('type');
    if (!mediaId || !mediaType) { displayDetailsError("Page not found: Media ID or type is missing."); return; }
    try {
        const data = await fetchMediaData('details', { type: mediaType, id: mediaId });
        populateDetailsPage(data);
    } catch (error) { displayDetailsError("Could not load details for this item."); }
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
async function fetchMediaData(endpoint, params = {}) {
    const url = new URL(API_BASE_URL, window.location.origin);
    url.searchParams.set('endpoint', endpoint);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json();
}
