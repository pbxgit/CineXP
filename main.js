// main.js - FINAL High-Performance Version (Corrected)

let watchlist = [];

document.addEventListener('DOMContentLoaded', async () => {
    watchlist = await getWatchlistFromServer();
    const path = window.location.pathname;
    if (path === '/' || path.endsWith('index.html')) {
        initHomePage();
    } else if (path.endsWith('details.html')) {
        initDetailsPage();
    } else if (path.endsWith('watchlist.html')) {
        initWatchlistPage();
    }
    setupScrollAnimations();
});

// --- HOMEPAGE LOGIC ---
function initHomePage() {
    fetchMediaCarousel('trending_movies', '#trending-movies-grid');
    fetchMediaCarousel('popular_tv', '#popular-tv-grid');
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

// --- DETAILS PAGE LOGIC ---
function initDetailsPage() {
    const mainContent = document.querySelector('#details-main-content');
    const urlParams = new URLSearchParams(window.location.search);
    const mediaType = urlParams.get('type');
    const mediaId = urlParams.get('id');

    if (!mediaType || !mediaId) {
        mainContent.innerHTML = '<h1>Error: Missing Information</h1>';
        return;
    }
    
    mainContent.innerHTML = getDetailsSkeletonHTML();
    fetchAndDisplayDetails(mediaType, mediaId);
}

async function fetchAndDisplayDetails(type, id) {
    const mainContent = document.querySelector('#details-main-content');
    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=details&type=${type}&id=${id}`);
        const { details: media, logoUrl } = await response.json();

        const smallBackdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w300${media.backdrop_path}` : '';
        const largeBackdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : '';
        const backdropElement = mainContent.querySelector('.details-backdrop');
        if (backdropElement) {
            backdropElement.style.backgroundImage = `url('${smallBackdropUrl}')`;
            const highResImage = new Image();
            highResImage.src = largeBackdropUrl;
            highResImage.onload = () => {
                backdropElement.style.backgroundImage = `url('${largeBackdropUrl}')`;
            };
        }

        const titleElement = logoUrl
            ? `<img src="${logoUrl}" alt="${media.name || media.title}" class="media-logo">`
            : `<h1 class="fallback-title">${media.name || media.title}</h1>`;

        const releaseDate = media.release_date || media.first_air_date;
        let metaPillsHTML = `<div class="meta-pill">${releaseDate ? releaseDate.substring(0, 4) : 'N/A'}</div>`;
        if (media.genres) {
            media.genres.slice(0, 3).forEach(genre => {
                metaPillsHTML += `<div class="meta-pill">${genre.name}</div>`;
            });
        }
        if (media.vote_average) {
            metaPillsHTML += `<div class="meta-pill rating">⭐ ${media.vote_average.toFixed(1)}</div>`;
        }

        mainContent.querySelector('.details-content').innerHTML = `
            <div class="details-content-overlay">
                ${titleElement}
                <div class="details-meta-pills">${metaPillsHTML}</div>
                <p class="details-overview">${media.overview}</p>
                <div class="action-buttons">
                    <button id="watchlist-btn" class="btn-primary"></button>
                    <button class="btn-secondary" onclick="window.location.href='/'">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor"/></svg>
                        More Info
                    </button>
                </div>
            </div>
        `;
        
        updateWatchlistButton(media, type);

    } catch (error) {
        mainContent.innerHTML = '<h1>Could not load details.</h1>';
        console.error('Error fetching details:', error);
    }
} // **THIS IS THE BRACE THAT WAS MISSING**

function getDetailsSkeletonHTML() {
    return `
        <div class="details-backdrop"></div>
        <div class="details-content">
            <!-- SKELETON LOADER FOR THE NEW OVERLAY LAYOUT -->
            <div class="details-content-overlay">
                <div class="skeleton-title skeleton" style="height: 5em; width: 60%; margin: 1.5rem auto;"></div>
                <div class="skeleton-text skeleton" style="width: 80%; margin: 1rem auto;"></div>
                <div class="skeleton-text skeleton" style="width: 90%; margin: 1rem auto;"></div>
                <div class="skeleton-text skeleton" style="width: 50%; margin: 1rem auto;"></div>
                <div class="action-buttons" style="margin-top: 1.5rem;">
                    <div class="skeleton-button skeleton"></div>
                </div>
            </div>
        </div>
    `;
}

// --- WATCHLIST PAGE LOGIC ---
function initWatchlistPage() {
    const watchlistGrid = document.querySelector('#watchlist-grid');
    watchlistGrid.innerHTML = '';
    if (watchlist.length === 0) {
        watchlistGrid.innerHTML = `
            <div class="empty-state">
                <h2>Your Watchlist is Empty</h2>
                <p>Add movies and shows to see them here.</p>
                <a href="/">Discover Something New</a>
            </div>
        `;
        return;
    }
    const carousel = document.createElement('div');
    carousel.className = 'carousel-scroll-area';
    watchlist.forEach(media => carousel.appendChild(createMediaCard(media)));
    watchlistGrid.appendChild(carousel);
}

// --- WATCHLIST & UNIVERSAL HELPERS ---
async function getWatchlistFromServer() {
    try {
        const response = await fetch('/.netlify/functions/update-watchlist', { method: 'GET' });
        const data = await response.json();
        return data.map(item => JSON.parse(item));
    } catch (error) {
        console.error('Error getting watchlist:', error);
        return [];
    }
}

function isMediaInWatchlist(mediaId) {
    return watchlist.some(item => item.id === mediaId);
}

function updateWatchlistButton(media, mediaType) {
    const button = document.getElementById('watchlist-btn');
    if (!button) return;
    if (isMediaInWatchlist(media.id)) {
        button.textContent = '✓ Remove from Watchlist';
        button.className = 'btn-secondary';
        button.onclick = () => handleWatchlistAction('DELETE', media, mediaType);
    } else {
        button.textContent = '＋ Add to Watchlist';
        button.className = 'btn-primary';
        button.onclick = () => handleWatchlistAction('POST', media, mediaType);
    }
}

async function handleWatchlistAction(action, media, mediaType) {
    const button = document.getElementById('watchlist-btn');
    button.disabled = true;
    const itemData = { id: media.id, title: media.title || media.name, poster_path: media.poster_path, mediaType: mediaType };
    try {
        await fetch('/.netlify/functions/update-watchlist', { method: action, body: JSON.stringify(itemData) });
        if (action === 'POST') {
            watchlist.unshift(itemData);
        } else {
            watchlist = watchlist.filter(item => item.id !== media.id);
        }
        updateWatchlistButton(media, mediaType);
    } catch (error) {
        console.error(`Error with watchlist ${action}:`, error);
    } finally {
        button.disabled = false;
    }
}

function createMediaCard(media) {
    const card = document.createElement('a');
    card.className = 'media-card';
    const mediaType = media.mediaType || (media.first_air_date ? 'tv' : 'movie');
    card.href = `/details.html?type=${mediaType}&id=${media.id}`;
    const posterPath = media.poster_path ? `https://image.tmdb.org/t/p/w342${media.poster_path}` : 'https://via.placeholder.com/342x513?text=No+Image';
    card.innerHTML = `<img src="${posterPath}" alt="${media.title || media.name}" loading="lazy">`;
    return card;
}

function setupScrollAnimations() {
    const carousels = document.querySelectorAll('.media-carousel');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    carousels.forEach(carousel => observer.observe(carousel));
}
