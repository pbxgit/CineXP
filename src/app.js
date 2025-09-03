// src/app.js
import { getTrending, getNowPlaying, searchMedia, getMediaDetails } from './services/api.js';
import { getWatchlist, isMovieInWatchlist, addToWatchlist, removeFromWatchlist } from './services/storage.js';
import { createMovieCard } from './components/MovieCard.js';
import { createCarousel } from './components/Carousel.js';

const app = document.getElementById('app-root');

// --- DYNAMIC BACKGROUND ---
function updateBackdrop(posterPath) {
    if (posterPath) {
        const imageUrl = `https://image.tmdb.org/t/p/original${posterPath}`;
        document.body.style.setProperty('--bg-image', `url(${imageUrl})`);
        document.body.classList.add('has-backdrop');
    } else {
        document.body.classList.remove('has-backdrop');
    }
}

// --- RENDER FUNCTIONS ---

async function renderHomePage() {
    app.innerHTML = '<div class="loading">Loading...</div>';

    const trending = await getTrending('movie');
    const nowPlaying = await getNowPlaying('movie');

    const homeContent = `
        <div class="fade-in">
            ${createCarousel('trending-movies', 'Trending Movies', trending.results)}
            ${createCarousel('now-playing-movies', 'Now Playing in Theaters', nowPlaying.results)}
        </div>
    `;
    app.innerHTML = homeContent;
}

function renderSearchPage() {
    app.innerHTML = `
        <div class="search-container fade-in">
            <h2>Find a movie or TV show</h2>
            <input type="text" id="search-input" class="search-input" placeholder="e.g., Blade Runner, The Office...">
            <div id="search-results" class="movie-grid"></div>
        </div>
    `;

    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const query = e.target.value;
            if (query.length > 2) {
                searchResultsContainer.innerHTML = '<div class="loading">Searching...</div>';
                const results = await searchMedia(query);
                renderMediaGrid(searchResultsContainer, results.results);
            } else {
                searchResultsContainer.innerHTML = '';
            }
        }, 500); // 500ms debounce delay
    });
}

async function renderWatchlistPage() {
    app.innerHTML = '<div class="loading">Loading your watchlist...</div>';
    const watchlistIds = getWatchlist();

    if (watchlistIds.length === 0) {
        app.innerHTML = '<h2>Your watchlist is empty.</h2><p>Add movies to your watchlist to see them here.</p>';
        return;
    }

    // Fetch details for each item in the watchlist
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
    renderMediaGrid(document.getElementById('watchlist-grid'), watchlistItems);
}

async function renderDetailPage(type, id) {
    app.innerHTML = '<div class="loading">Loading details...</div>';
    const details = await getMediaDetails(type, id);

    if (!details) {
        app.innerHTML = '<h2>Content not found.</h2>';
        return;
    }

    const title = details.title || details.name;
    const releaseDate = details.release_date || details.first_air_date;
    const inWatchlist = isMovieInWatchlist(type, id);

    const detailContent = `
        <div class="detail-view fade-in" style="background-image: linear-gradient(to top, rgba(13, 13, 15, 1) 10%, rgba(13, 13, 15, 0.7)), url(https://image.tmdb.org/t/p/original${details.backdrop_path})">
            <div class="detail-content">
                <img src="https://image.tmdb.org/t/p/w500${details.poster_path}" alt="${title}" class="detail-poster">
                <div class="detail-info">
                    <h1>${title} (${new Date(releaseDate).getFullYear()})</h1>
                    <p class="tagline">${details.tagline || ''}</p>
                    <p class="overview">${details.overview}</p>
                    <button class="btn" id="watchlist-toggle-btn" data-id="${id}" data-type="${type}">
                        ${inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    </button>
                </div>
            </div>
        </div>
    `;
    app.innerHTML = detailContent;
}

function renderMediaGrid(container, items) {
    container.innerHTML = ''; // Clear previous content
    if (!items || items.length === 0) {
        container.innerHTML = '<p>No results found.</p>';
        return;
    }
    items.forEach(item => {
        if (item.poster_path) { // Only show items with a poster
            const card = createMovieCard(item);
            container.appendChild(card);
        }
    });
}


// --- ROUTER ---
const routes = {
    '/home': renderHomePage,
    '/search': renderSearchPage,
    '/watchlist': renderWatchlistPage,
};

function router() {
    const hash = window.location.hash.substring(1) || '/home';
    const [path, id] = hash.split('/');
    
    if (path === 'movie' || path === 'tv') {
        renderDetailPage(path, id);
    } else {
        const route = routes[`/${path}`] || renderHomePage;
        route();
    }
}

// --- EVENT LISTENERS ---
window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered successfully'))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
    router(); // Initial route
});

// Event delegation for dynamically created elements
document.addEventListener('click', (e) => {
    // Watchlist button on detail page
    if (e.target.id === 'watchlist-toggle-btn') {
        const id = e.target.dataset.id;
        const type = e.target.dataset.type;
        if (isMovieInWatchlist(type, id)) {
            removeFromWatchlist(type, id);
            e.target.textContent = 'Add to Watchlist';
        } else {
            addToWatchlist(type, id);
            e.target.textContent = 'Remove from Watchlist';
        }
    }

    // Movie card clicks
    const card = e.target.closest('.movie-card');
    if (card) {
        const { id, type } = card.dataset;
        window.location.hash = `/${type}/${id}`;
    }
});

// Listen for mouseover on cards to update the backdrop
app.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.movie-card');
    if (card) {
        updateBackdrop(card.dataset.backdrop);
    }
});
