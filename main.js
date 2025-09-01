// main.js - FINAL High-Performance Version

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

// --- DETAILS PAGE LOGIC (UPGRADED FOR PERFORMANCE) ---
function initDetailsPage() {
    const mainContent = document.querySelector('#details-main-content');
    const urlParams = new URLSearchParams(window.location.search);
    const mediaType = urlParams.get('type');
    const mediaId = urlParams.get('id');

    if (!mediaType || !mediaId) {
        mainContent.innerHTML = '<h1>Error: Missing Information</h1>';
        return;
    }
    
    // **STEP 1: Immediately render the Skeleton Loader**
    mainContent.innerHTML = getDetailsSkeletonHTML();

    // **STEP 2: Fetch the data**
    fetchAndDisplayDetails(mediaType, mediaId);
}

async function fetchAndDisplayDetails(type, id) {
    const mainContent = document.querySelector('#details-main-content');
    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=details&type=${type}&id=${id}`);
        const media = await response.json();

        // **STEP 3: Implement the Blur-Up Technique**
        const smallBackdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w300${media.backdrop_path}` : '';
        // **IMAGE OPTIMIZATION: Use w1280 instead of 'original'**
        const largeBackdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : '';
        
        // Find the backdrop element from the skeleton
        const backdropElement = mainContent.querySelector('.details-backdrop');
        if (backdropElement) {
            // Set the blurry, low-res image first
            backdropElement.style.backgroundImage = `url('${smallBackdropUrl}')`;

            // Create a new image in memory to load the high-res version
            const highResImage = new Image();
            highResImage.src = largeBackdropUrl;
            highResImage.onload = () => {
                // Once loaded, set it as the background for a smooth transition
                backdropElement.style.backgroundImage = `url('${largeBackdropUrl}')`;
            };
        }

        // **STEP 4: Populate the rest of the content**
        const posterUrl = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
        const title = media.name || media.title;
        const releaseDate = media.release_date || media.first_air_date;
        
        let metaInfo = `<span>${releaseDate ? releaseDate.substring(0, 4) : 'N/A'}</span>`;
        if (type === 'movie' && media.runtime) {
            metaInfo += `<span>${Math.floor(media.runtime / 60)}h ${media.runtime % 60}m</span>`;
        } else if (type === 'tv' && media.number_of_seasons) {
            metaInfo += `<span>${media.number_of_seasons} Season(s)</span>`;
        }
        metaInfo += `<span>⭐ ${media.vote_average ? media.vote_average.toFixed(1) : 'N/A'}</span>`;

        // Replace skeleton content with real content
        mainContent.querySelector('.details-poster').innerHTML = `<img src="${posterUrl}" alt="${title}">`;
        mainContent.querySelector('.details-info').innerHTML = `
            <h1>${title}</h1>
            <div class="details-meta">${metaInfo}</div>
            <p class="details-overview">${media.overview}</p>
            <div class="action-buttons">
                <button id="watchlist-btn" class="btn-primary"></button>
            </div>
        `;
        
        updateWatchlistButton(media, type);

    } catch (error) {
        mainContent.innerHTML = '<h1>Could not load details.</h1>';
        console.error('Error fetching details:', error);
    }
}

/**
 * Returns the HTML string for the details page skeleton loader.
 */
function getDetailsSkeletonHTML() {
    return `
        <div class="details-backdrop"></div>
        <div class="details-content">
            <div class="details-poster skeleton">
                <!-- Poster placeholder -->
            </div>
            <div class="details-info">
                <div class="skeleton-title skeleton"></div>
                <div class="skeleton-text skeleton"></div>
                <div class="skeleton-text skeleton" style="width: 80%;"></div>
                <div class="skeleton-text skeleton" style="width: 90%;"></div>
                <div class="skeleton-text skeleton" style="width: 50%;"></div>
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
