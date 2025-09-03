// src/app.js

// --- MODULE IMPORTS ---
// Importing functions from other files to keep code organized.
import { getTrending, getNowPlaying, searchMedia, getMediaDetails } from './services/api.js';
import { getWatchlist, isMovieInWatchlist, addToWatchlist, removeFromWatchlist } from './services/storage.js';
import { createMovieCard } from './components/MovieCard.js';
import { createCarousel } from './components/Carousel.js';

// --- DOM ELEMENT REFERENCE ---
const app = document.getElementById('app-root');

// --- DYNAMIC BACKGROUND FUNCTIONALITY ---
/**
 * Updates the body's background to a blurred version of the provided poster.
 * @param {string | null} backdropPath - The path to the backdrop image from the API.
 */
function updateBackdrop(backdropPath) {
    if (backdropPath && backdropPath !== 'null') {
        const imageUrl = `https://image.tmdb.org/t/p/original${backdropPath}`;
        document.body.style.setProperty('--bg-image', `url(${imageUrl})`);
        document.body.classList.add('has-backdrop');
    } else {
        document.body.classList.remove('has-backdrop');
    }
}

// --- PAGE RENDER FUNCTIONS ---
// Each function is responsible for fetching data and rendering a specific "page".

/**
 * Renders the Home Page with carousels for trending and now-playing content.
 */
async function renderHomePage() {
    updateBackdrop(null); // Clear backdrop on home page
    app.innerHTML = '<div class="loading">Loading cinematic wonders...</div>';

    // Fetch data in parallel for faster loading
    const [trending, nowPlaying] = await Promise.all([
        getTrending('movie'),
        getNowPlaying('movie')
    ]);

    const homeContent = `
        <div class="fade-in">
            ${createCarousel('trending-movies', 'Trending This Week', trending.results)}
            ${createCarousel('now-playing-movies', 'Now Playing in Theaters', nowPlaying.results)}
        </div>
    `;
    app.innerHTML = homeContent;
}

/**
 * Renders the Search Page with a search input and a grid for results.
 */
function renderSearchPage() {
    updateBackdrop(null);
    app.innerHTML = `
        <div class="search-container fade-in">
            <h2>Find any movie or TV show</h2>
            <input type="text" id="search-input" class="search-input" placeholder="e.g., Blade Runner, The Office..." autocomplete="off">
            <div id="search-results" class="movie-grid"></div>
        </div>
    `;

    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        // Debouncing prevents API calls on every keystroke
        debounceTimer = setTimeout(async () => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                searchResultsContainer.innerHTML = '<p class="loading">Searching...</p>';
                const data = await searchMedia(query);
                renderMediaGrid(searchResultsContainer, data.results);
            } else {
                searchResultsContainer.innerHTML = '';
            }
        }, 500);
    });
}

/**
 * Renders the Watchlist Page by fetching details for each saved item.
 */
async function renderWatchlistPage() {
    updateBackdrop(null);
    app.innerHTML = '<div class="loading">Loading your watchlist...</div>';
    const watchlistIds = getWatchlist();

    if (watchlistIds.length === 0) {
        app.innerHTML = '<h2>Your watchlist is empty.</h2><p>Use the search to find movies and add them!</p>';
        return;
    }

    // Fetch full details for all items in the watchlist concurrently
    const watchlistItems = await Promise.all(
        watchlistIds.map(item => getMediaDetails(item.type, item.id))
    );

    const watchlistContent = `
        <div class="fade-in">
            <h2>My Watchlist</h2>
            <div id="watchlist-grid" class="movie-grid"></div>
        </div>
    `;
    app.innerHTML = watchlistContent;
    renderMediaGrid(document.getElementById('watchlist-grid'), watchlistItems.filter(Boolean)); // Filter out any null results
}

/**
 * Renders the Detail Page for a specific movie or TV show.
 * @param {string} type - The media type ('movie' or 'tv').
 * @param {string} id - The ID of the media.
 */
async function renderDetailPage(type, id) {
    app.innerHTML = '<div class="loading">Loading details...</div>';
    const details = await getMediaDetails(type, id);

    if (!details) {
        app.innerHTML = '<h2>Content not found.</h2><p>The requested movie or show could not be found.</p>';
        return;
    }

    updateBackdrop(details.backdrop_path); // Set backdrop for detail page

    const title = details.title || details.name;
    const releaseDate = details.release_date || details.first_air_date;
    const inWatchlist = isMovieInWatchlist(type, id);
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

    const detailContent = `
        <div class="detail-view fade-in">
            <div class="detail-content">
                <img src="https://image.tmdb.org/t/p/w500${details.poster_path}" alt="${title}" class="detail-poster">
                <div class="detail-info">
                    <h1>${title} <span>(${releaseYear})</span></h1>
                    <p class="tagline">${details.tagline || ''}</p>
                    <p class="overview">${details.overview}</p>
                    <button class="btn" id="watchlist-toggle-btn" data-id="${id}" data-type="${type}">
                        ${inWatchlist ? '✓ Remove from Watchlist' : '+ Add to Watchlist'}
                    </button>
                </div>
            </div>
        </div>
    `;
    app.innerHTML = detailContent;
}

/**
 * A helper function to render a grid of movie cards into a container.
 * @param {HTMLElement} container - The element to render the grid into.
 * @param {Array<object>} items - An array of movie/TV show objects from the API.
 */
function renderMediaGrid(container, items) {
    container.innerHTML = ''; // Clear previous content or loading indicator
    if (!items || items.length === 0) {
        container.innerHTML = '<p>No results found.</p>';
        return;
    }

    items.forEach(item => {
        // Only create a card if the item has a poster image
        if (item.poster_path) {
            const card = createMovieCard(item);
            container.appendChild(card);
        }
    });
}


// --- SIMPLE HASH-BASED ROUTER ---
const routes = {
    '/home': renderHomePage,
    '/search': renderSearchPage,
    '/watchlist': renderWatchlistPage,
};

/**
 * Parses the URL hash and calls the corresponding render function.
 */
function router() {
    const hash = window.location.hash || '#/home';
    const [path, type, id] = hash.split('/'); // e.g., #/movie/123 -> ["", "movie", "123"]

    if (type && id && (type === 'movie' || type === 'tv')) {
        renderDetailPage(type, id);
    } else {
        const routeHandler = routes[path.replace('#', '')] || renderHomePage;
        routeHandler();
    }
}


// --- GLOBAL EVENT LISTENERS ---

// Listen for hash changes to navigate between pages
window.addEventListener('hashchange', router);

// Handle initial page load
window.addEventListener('load', () => {
    // Register Service Worker for PWA offline capabilities
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully'))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
    router(); // Call the router to render the initial page
});

// Use event delegation for clicks on dynamically added elements
document.addEventListener('click', (e) => {
    // Handle watchlist button clicks on the detail page
    if (e.target.id === 'watchlist-toggle-btn') {
        const button = e.target;
        const id = button.dataset.id;
        const type = button.dataset.type;

        if (isMovieInWatchlist(type, id)) {
            removeFromWatchlist(type, id);
            button.textContent = '+ Add to Watchlist';
        } else {
            addToWatchlist(type, id);
            button.textContent = '✓ Remove from Watchlist';
        }
    }

    // Handle clicks on movie cards to navigate to the detail page
    const card = e.target.closest('.movie-card');
    if (card) {
        const { id, type } = card.dataset;
        window.location.hash = `#/${type}/${id}`;
    }
});

// Use event delegation for mouseover to trigger the backdrop effect
app.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.movie-card');
    if (card) {
        updateBackdrop(card.dataset.backdrop);
    }
});
