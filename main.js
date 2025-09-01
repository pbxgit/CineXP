/*
=====================================================
    Personal Media Explorer - Main JavaScript Engine
=====================================================
*/

let watchlist = [];

document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    if (path.endsWith('details.html')) {
        document.body.classList.add('details-page');
    }
    setupHeaderStyle();
    watchlist = await getWatchlistFromServer();

    if (path === '/' || path.endsWith('index.html')) {
        initHomePage();
    } else if (path.endsWith('details.html')) {
        initDetailsPage();
    } else if (path.endsWith('watchlist.html')) {
        initWatchlistPage();
    }
});

function setupHeaderStyle() {
    const header = document.getElementById('main-header');
    if (!header) return;
    if (document.body.classList.contains('details-page')) {
        header.classList.add('glass-header');
    } else {
        header.classList.add('scrolled');
    }
}

function initHomePage() {
    fetchMediaCarousel('trending_movies', '#trending-movies-grid');
    fetchMediaCarousel('popular_tv', '#popular-tv-grid');
    setupScrollAnimations('.media-carousel');
}

async function fetchMediaCarousel(endpoint, gridSelector) { /* ... same as before ... */ }

function initDetailsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const mediaType = urlParams.get('type');
    const mediaId = urlParams.get('id');
    if (!mediaType || !mediaId) {
        document.querySelector('#details-main-content').innerHTML = '<h1>Error: Missing Information</h1>';
        return;
    }
    fetchAndDisplayDetails(mediaType, mediaId);
}

// =================================================================
//  FIXED & REFINED - DETAILS PAGE LOGIC
// =================================================================

async function fetchAndDisplayDetails(type, id) {
    const mainContent = document.querySelector('#details-main-content');
    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=details&type=${type}&id=${id}`);
        const { details: media, recommendations, credits } = await response.json();

        // 1. Set the dynamic accent color from the poster with smart text color
        applyDynamicAccentColor(media.poster_path);
        
        // 2. Prepare Meta Pills
        const releaseDate = media.release_date || media.first_air_date;
        let metaPillsHTML = `<div class="meta-pill">${releaseDate ? releaseDate.substring(0, 4) : 'N/A'}</div>`;
        if (media.genres) {
            media.genres.slice(0, 2).forEach(genre => metaPillsHTML += `<div class="meta-pill">${genre.name}</div>`);
        }
        if (media.vote_average > 0) {
            metaPillsHTML += `<div class="meta-pill rating">⭐ ${media.vote_average.toFixed(1)}</div>`;
        }

        // 3. Prepare other dynamic content
        const watchUrl = type === 'movie' ? `https://www.cineby.app/movie/${media.id}?play=true` : `https://www.cineby.app/tv/${media.id}/1/1?play=true`;

        // 4. Build the new "Banner + Content" HTML Structure
        mainContent.innerHTML = `
            <div class="details-hero-banner" id="details-hero-banner"></div>

            <div class="details-content-body">
                <!-- IMPORTANT FIX: Added the title back in! -->
                <h1 class="details-title">${media.title || media.name}</h1>
                <div class="details-meta-pills">${metaPillsHTML}</div>
                <p class="details-overview">${media.overview}</p>
                <div class="action-buttons">
                    <button id="watchlist-btn"></button>
                    <a href="${watchUrl}" target="_blank" class="btn-secondary" rel="noopener noreferrer">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;"><path d="M8 5v14l11-7z"/></svg>
                        Watch
                    </a>
                </div>
            </div>
            
            <div class="details-more-info">
                ${(type === 'tv' && media.seasons_details) ? '<div id="season-browser-container"></div>' : ''}
                ${(credits && credits.cast.length > 0) ? '<div id="cast-container"></div>' : ''}
                ${(recommendations && recommendations.results.length > 0) ? '<div id="recommendations-container"></div>' : ''}
            </div>
        `;

        // 5. Populate dynamic components
        const heroBanner = document.getElementById('details-hero-banner');
        if (media.backdrop_path) {
            heroBanner.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${media.backdrop_path})`;
        }

        updateWatchlistButton(media, type);
        setupInteractiveOverview();
        if (type === 'tv' && media.seasons_details) {
            renderSeasonBrowser(media, document.getElementById('season-browser-container'));
        }
        if (credits && credits.cast.length > 0) {
            renderCastCarousel(credits.cast, document.getElementById('cast-container'));
        }
        if (recommendations && recommendations.results.length > 0) {
            renderRecommendationsCarousel(recommendations.results, document.getElementById('recommendations-container'));
        }

    } catch (error) {
        mainContent.innerHTML = '<h1>Could not load details.</h1>';
        console.error('Error fetching details:', error);
    }
}

// ** UPDATED with smart text color logic **
function applyDynamicAccentColor(posterPath) {
    if (!posterPath) return;
    const posterUrl = `https://image.tmdb.org/t/p/w92${posterPath}`;
    const posterImage = new Image();
    posterImage.crossOrigin = "Anonymous";
    posterImage.src = posterUrl;

    posterImage.onload = () => {
        try {
            const colorThief = new ColorThief();
            const vibrantColor = colorThief.getColor(posterImage);
            const [r, g, b] = vibrantColor;

            // Check the brightness of the color (Luma formula)
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            const textColor = brightness > 0.5 ? '#000000' : '#FFFFFF'; // Use black text for light colors, white for dark

            document.documentElement.style.setProperty('--color-dynamic-accent', `rgb(${vibrantColor.join(',')})`);
            document.documentElement.style.setProperty('--color-dynamic-accent-text', textColor);
        } catch (e) {
            // Fallback if ColorThief fails
            resetAccentColor();
        }
    };
    posterImage.onerror = resetAccentColor;
}

function resetAccentColor() {
    document.documentElement.style.setProperty('--color-dynamic-accent', '#FFFFFF');
    document.documentElement.style.setProperty('--color-dynamic-accent-text', '#000000');
}

// ... The rest of your main.js file remains the same ...
function setupInteractiveOverview() { /* ... same as before ... */ }
function renderCastCarousel(cast, container) { /* ... same as before ... */ }
function renderRecommendationsCarousel(recommendations, container) { /* ... same as before ... */ }
function renderSeasonBrowser(media, container) { /* ... same as before ... */ }
function initWatchlistPage() { /* ... same as before ... */ }
async function getWatchlistFromServer() { /* ... same as before ... */ }
function isMediaInWatchlist(mediaId) { /* ... same as before ... */ }
function updateWatchlistButton(media, mediaType) { /* ... same as before ... */ }
async function handleWatchlistAction(action, media, mediaType) { /* ... same as before ... */ }
function createMediaCard(media) { /* ... same as before ... */ }
function setupScrollAnimations(selector) { /* ... same as before ... */ }
