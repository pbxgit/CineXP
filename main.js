// main.js - FINAL VERSION

// Global state to hold watchlist data for the entire session
let watchlist = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch watchlist data once when the app starts
    watchlist = await getWatchlistFromServer();

    // Route to the correct initialization function based on the page
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


// --- HOMEPAGE LOGIC (No changes needed) ---
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


// --- DETAILS PAGE LOGIC (Completely Overhauled) ---
async function initDetailsPage() {
    const mainContent = document.querySelector('#details-main-content');
    const urlParams = new URLSearchParams(window.location.search);
    const mediaType = urlParams.get('type');
    const mediaId = urlParams.get('id');

    if (!mediaType || !mediaId) {
        mainContent.innerHTML = '<h1>Error: Missing Information</h1>';
        return;
    }

    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=details&type=${mediaType}&id=${mediaId}`);
        const media = await response.json();

        // Build the final, polished details page layout
        const backdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/original${media.backdrop_path}` : '';
        const posterUrl = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';

        const title = media.name || media.title;
        const releaseDate = media.release_date || media.first_air_date;
        
        // Dynamic meta info based on media type
        let metaInfo = `<span>${releaseDate ? releaseDate.substring(0, 4) : 'N/A'}</span>`;
        if (mediaType === 'movie' && media.runtime) {
            metaInfo += `<span>${Math.floor(media.runtime / 60)}h ${media.runtime % 60}m</span>`;
        } else if (mediaType === 'tv' && media.number_of_seasons) {
            metaInfo += `<span>${media.number_of_seasons} Season(s)</span>`;
        }
        metaInfo += `<span>⭐ ${media.vote_average ? media.vote_average.toFixed(1) : 'N/A'}</span>`;

        mainContent.innerHTML = `
            <div class="details-backdrop" style="background-image: url('${backdropUrl}')"></div>
            <div class="details-content">
                <div class="details-poster">
                    <img src="${posterUrl}" alt="${title}">
                </div>
                <div class="details-info">
                    <h1>${title}</h1>
                    <div class="details-meta">${metaInfo}</div>
                    <p class="details-overview">${media.overview}</p>
                    <div class="action-buttons">
                        <button id="watchlist-btn" class="btn-primary"></button>
                        <!-- AI button can be added here -->
                    </div>
                </div>
            </div>
        `;
        
        updateWatchlistButton(media, mediaType);

    } catch (error) {
        mainContent.innerHTML = '<h1>Could not load details.</h1>';
        console.error('Error fetching details:', error);
    }
}


// --- WATCHLIST PAGE LOGIC (Now Fully Functional) ---
function initWatchlistPage() {
    const watchlistGrid = document.querySelector('#watchlist-grid');
    watchlistGrid.innerHTML = ''; // Clear any placeholders

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

    // Create a new carousel structure for the watchlist items
    const carousel = document.createElement('div');
    carousel.className = 'carousel-scroll-area';
    watchlist.forEach(media => {
        carousel.appendChild(createMediaCard(media));
    });
    watchlistGrid.appendChild(carousel);
}


// --- WATCHLIST HELPER FUNCTIONS (The Core Logic) ---
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

    // Create a lean object for storage.
    const itemData = {
        id: media.id,
        title: media.title || media.name,
        poster_path: media.poster_path,
        mediaType: mediaType
    };

    try {
        await fetch('/.netlify/functions/update-watchlist', {
            method: action,
            body: JSON.stringify(itemData),
        });

        // Update local state for instant UI feedback
        if (action === 'POST') {
            watchlist.unshift(itemData);
        } else {
            watchlist = watchlist.filter(item => item.id !== media.id);
        }
        
        // Refresh the button state
        updateWatchlistButton(media, mediaType);

    } catch (error) {
        console.error(`Error with watchlist ${action}:`, error);
    } finally {
        button.disabled = false;
    }
}


// --- UNIVERSAL & ANIMATION FUNCTIONS ---
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
