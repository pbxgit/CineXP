/*
=====================================================
    Personal Media Explorer - Main JavaScript Engine
=====================================================
*/

let watchlist = [];

document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    
    // Add a class to the body for page-specific CSS styling
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

    // On the details page, the header is always glassmorphism.
    if (document.body.classList.contains('details-page')) {
        header.classList.add('glass-header');
    } else {
        // For other pages, make the header solid immediately.
        header.classList.add('scrolled');
    }
}

function initHomePage() {
    fetchMediaCarousel('trending_movies', '#trending-movies-grid');
    fetchMediaCarousel('popular_tv', '#popular-tv-grid');
    setupScrollAnimations('.media-carousel');
}

async function fetchMediaCarousel(endpoint, gridSelector) {
    const grid = document.querySelector(gridSelector);
    if (!grid) return;
    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=${endpoint}`);
        const data = await response.json();
        grid.innerHTML = '';
        data.results.forEach(media => grid.appendChild(createMediaCard(media)));
    } catch (error) {
        grid.innerHTML = '<p style="color: var(--color-text-secondary);">Could not load this section.</p>';
    }
}

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
//  STREAMING SERVICE STYLE - DETAILS PAGE LOGIC
// =================================================================

async function fetchAndDisplayDetails(type, id) {
    const mainContent = document.querySelector('#details-main-content');
    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=details&type=${type}&id=${id}`);
        const { details: media, recommendations, credits } = await response.json();

        // 1. Set the dynamic accent color from the poster
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

            <div class="details-content-body content-reveal">
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
                ${(type === 'tv' && media.seasons_details) ? '<div id="season-browser-container" class="content-reveal"></div>' : ''}
                ${(credits && credits.cast.length > 0) ? '<div id="cast-container" class="content-reveal"></div>' : ''}
                ${(recommendations && recommendations.results.length > 0) ? '<div id="recommendations-container" class="content-reveal"></div>' : ''}
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

        // 6. Trigger animations
        setTimeout(() => {
            mainContent.querySelectorAll('.content-reveal').forEach(el => el.classList.add('loaded'));
            setupScrollAnimations('.content-reveal');
        }, 100);

    } catch (error) {
        mainContent.innerHTML = '<h1>Could not load details.</h1>';
        console.error('Error fetching details:', error);
    }
}

function applyDynamicAccentColor(posterPath) {
    if (!posterPath) return;
    const posterUrl = `https://image.tmdb.org/t/p/w92${posterPath}`;
    const posterImage = new Image();
    posterImage.crossOrigin = "Anonymous";
    posterImage.src = posterUrl;
    posterImage.onload = () => {
        const colorThief = new ColorThief();
        const vibrantColor = colorThief.getColor(posterImage);
        const accentColor = `rgb(${vibrantColor.join(',')})`;
        document.documentElement.style.setProperty('--color-dynamic-accent', accentColor);
    };
    posterImage.onerror = () => {
        document.documentElement.style.setProperty('--color-dynamic-accent', '#FFFFFF'); // Fallback to white/grey
    };
}


function setupInteractiveOverview() {
    // This function remains the same
    const toggleBtn = document.querySelector('.overview-toggle-btn');
    const overviewText = document.querySelector('.details-overview');
    if (!toggleBtn || !overviewText) return;
    if (overviewText.scrollHeight <= overviewText.clientHeight) {
        toggleBtn.style.display = 'none';
        overviewText.style.maskImage = 'none';
        overviewText.style.webkitMaskImage = 'none';
    } else {
        toggleBtn.addEventListener('click', () => {
            overviewText.classList.toggle('expanded');
            toggleBtn.textContent = overviewText.classList.contains('expanded') ? 'Less' : 'More';
        });
    }
}

// ... The rest of your main.js file remains the same ...
function renderCastCarousel(cast, container) { /* ... same as before ... */ }
function renderRecommendationsCarousel(recommendations, container) { /* ... same as before ... */ }
function renderSeasonBrowser(media, container) {
    let tabsHTML = '';
    let listsHTML = '';
    media.seasons_details.forEach((season, index) => {
        if (season.season_number === 0) return;
        const isActive = index === 1 || media.seasons_details.length === 1;
        tabsHTML += `<button class="season-tab ${isActive ? 'active' : ''}" data-season="season-${season.id}">${season.name}</button>`;
        listsHTML += `<ul class="episode-list ${isActive ? 'active' : ''}" id="season-${season.id}">`;
        season.episodes.forEach(ep => {
            const stillPath = ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : 'https://via.placeholder.com/300x169?text=No+Image';
            const episodeWatchUrl = `https://www.cineby.app/tv/${media.id}/${ep.season_number}/${ep.episode_number}?play=true`;
            listsHTML += `<li class="episode-item"><img class="episode-thumbnail" src="${stillPath}" alt="${ep.name}" loading="lazy"><div class="episode-info"><h4>${ep.episode_number}. ${ep.name}</h4><p>${ep.overview ? ep.overview.substring(0, 120) + '...' : 'No description available.'}</p></div><a href="${episodeWatchUrl}" target="_blank" class="episode-watch-link btn-secondary" rel="noopener noreferrer">Watch</a></li>`;
        });
        listsHTML += `</ul>`;
    });
    // Add the glass-container wrapper here
    container.innerHTML = `<div class="season-browser glass-container"><h2 class="details-section-title">Seasons</h2><div class="season-tabs">${tabsHTML}</div>${listsHTML}</div>`;
    container.querySelectorAll('.season-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelector('.season-tab.active').classList.remove('active');
            container.querySelector('.episode-list.active').classList.remove('active');
            tab.classList.add('active');
            document.getElementById(tab.dataset.season).classList.add('active');
        });
    });
}
function initWatchlistPage() { /* ... same as before ... */ }
async function getWatchlistFromServer() { /* ... same as before ... */ }
function isMediaInWatchlist(mediaId) { /* ... same as before ... */ }
function updateWatchlistButton(media, mediaType) {
    const button = document.getElementById('watchlist-btn');
    if (!button) return;
    if (isMediaInWatchlist(media.id)) {
        button.textContent = '✓ In Watchlist';
        button.className = 'btn-secondary'; // Changed to secondary style when added
        button.onclick = () => handleWatchlistAction('DELETE', media, mediaType);
    } else {
        button.textContent = '＋ Add to Watchlist';
        button.className = 'btn-primary'; // Primary style for adding
        button.onclick = () => handleWatchlistAction('POST', media, mediaType);
    }
}
async function handleWatchlistAction(action, media, mediaType) { /* ... same as before ... */ }
function createMediaCard(media) { /* ... same as before ... */ }
function setupScrollAnimations(selector) { /* ... same as before ... */ }
