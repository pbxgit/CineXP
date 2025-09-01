// main.js - Overhauled for a Premium Experience

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the correct functionality based on the current page.
    const path = window.location.pathname;
    if (path === '/' || path.endsWith('index.html')) {
        initHomePage();
    } else if (path.endsWith('details.html')) {
        initDetailsPage();
    } else if (path.endsWith('watchlist.html')) {
        initWatchlistPage();
    }
    
    // Set up scroll animations for any carousels on the page.
    setupScrollAnimations();
});

// --- UNIVERSAL HELPER FUNCTIONS ---

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

/**
 * Creates a media card for either a movie or a TV show.
 * @param {object} media - The movie or TV show object from TMDB.
 * @returns {HTMLElement} - The anchor element representing the media card.
 */
function createMediaCard(media) {
    const card = document.createElement('a');
    card.className = 'media-card';
    
    // Differentiate between movie and TV show for the details link.
    const mediaType = media.first_air_date ? 'tv' : 'movie';
    card.href = `/details.html?type=${mediaType}&id=${media.id}`;

    const posterPath = media.poster_path 
        ? `${TMDB_IMAGE_BASE_URL}w342${media.poster_path}`
        : 'https://via.placeholder.com/342x513?text=No+Image';

    card.innerHTML = `<img src="${posterPath}" alt="${media.title || media.name}" loading="lazy">`;
    return card;
}

// --- HOMEPAGE LOGIC ---

function initHomePage() {
    // Fetch data for both carousels simultaneously for faster loading.
    fetchMediaCarousel('trending_movies', '#trending-movies-grid');
    fetchMediaCarousel('popular_tv', '#popular-tv-grid');
}

/**
 * Fetches data from our Netlify function and populates a carousel.
 * @param {string} endpoint - The endpoint for the get-media function.
 * @param {string} gridSelector - The CSS selector for the grid to populate.
 */
async function fetchMediaCarousel(endpoint, gridSelector) {
    const grid = document.querySelector(gridSelector);
    if (!grid) return;

    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=${endpoint}`);
        const data = await response.json();

        grid.innerHTML = ''; // Clear any loading state.
        data.results.forEach(media => {
            const card = createMediaCard(media);
            grid.appendChild(card);
        });
    } catch (error) {
        grid.innerHTML = '<p style="color: var(--color-text-secondary);">Could not load this section.</p>';
        console.error(`Error fetching ${endpoint}:`, error);
    }
}

// --- DETAILS PAGE LOGIC ---

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

async function fetchAndDisplayDetails(type, id) {
    const mainContent = document.querySelector('#details-main-content');
    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=details&type=${type}&id=${id}`);
        const media = await response.json();

        // Build the new, immersive details page layout.
        const backdropUrl = media.backdrop_path ? `${TMDB_IMAGE_BASE_URL}original${media.backdrop_path}` : '';
        const posterUrl = media.poster_path ? `${TMDB_IMAGE_BASE_URL}w500${media.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';

        // Use 'name' for TV shows and 'title' for movies.
        const title = media.name || media.title;
        const releaseDate = media.release_date || media.first_air_date;
        
        mainContent.innerHTML = `
            <div class="details-backdrop" style="background-image: url('${backdropUrl}')"></div>
            <div class="details-content">
                <div class="details-poster">
                    <img src="${posterUrl}" alt="${title}">
                </div>
                <div class="details-info">
                    <h1>${title}</h1>
                    <div class="details-meta">
                        <span>${releaseDate ? releaseDate.substring(0, 4) : 'N/A'}</span>
                        <span>⭐ ${media.vote_average ? media.vote_average.toFixed(1) : 'N/A'}</span>
                    </div>
                    <p class="details-overview">${media.overview}</p>
                    <button id="watchlist-btn">＋ Add to Watchlist</button>
                    <!-- AI summary section can be added here later -->
                </div>
            </div>
        `;
        
    } catch (error) {
        mainContent.innerHTML = '<h1>Could not load details.</h1>';
        console.error('Error fetching details:', error);
    }
}


// --- WATCHLIST PAGE LOGIC ---

function initWatchlistPage() {
    // This will be fully implemented after the details page logic is complete.
    const watchlistGrid = document.querySelector('#watchlist-grid');
    watchlistGrid.innerHTML = `
        <div class="empty-state">
            <h2>Your Watchlist is Empty</h2>
            <p>Add movies and shows to your watchlist to see them here.</p>
            <a href="/">Discover Something New</a>
        </div>
    `;
}


// --- ANIMATION LOGIC ---

function setupScrollAnimations() {
    const carousels = document.querySelectorAll('.media-carousel');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animate only once.
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible.
    });

    carousels.forEach(carousel => {
        observer.observe(carousel);
    });
}
