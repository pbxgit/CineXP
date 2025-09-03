// src/js/ui.js

// --- MODULE IMPORTS ---
// We import all necessary functions from our other modules.
import { getTrending, getNowPlaying, searchMedia, getMediaDetails, askGemini } from './api.js';
import { getWatchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } from './storage.js';
import { TMDB_IMAGE_BASE_URL } from './config.js';

// --- DOM ELEMENT REFERENCES ---
// Storing references to frequently used elements for performance.
const appRoot = document.getElementById('app-root');
const header = document.getElementById('main-header');
const footer = document.getElementById('main-footer');
const backdrop = document.getElementById('app-backdrop');

// --- REUSABLE HTML COMPONENT GENERATORS ---
// These functions generate HTML strings, keeping our render functions clean.

/**
 * Creates the HTML for a single movie card.
 * @param {object} media - The movie or TV show object from the API.
 * @returns {string} The HTML string for the movie card.
 */
function createMovieCardHTML(media) {
    if (!media || !media.poster_path) return ''; // Return empty string if media or poster is missing
    const type = media.media_type || (media.title ? 'movie' : 'tv');
    return `
        <div class="movie-card" data-id="${media.id}" data-type="${type}" data-backdrop="${media.backdrop_path}">
            <img src="${TMDB_IMAGE_BASE_URL}w500${media.poster_path}" alt="${media.title || media.name}" loading="lazy">
        </div>
    `;
}

/**
 * Creates the HTML for an entire carousel section.
 * @param {string} id - A unique ID for the section.
 * @param {string} title - The title to display for the carousel.
 * @param {Array<object>} items - An array of media objects.
 * @returns {string} The complete HTML string for the carousel.
 */
function createCarouselHTML(id, title, items) {
    if (!items || items.length === 0) return '';
    const cardsHTML = items.map(createMovieCardHTML).join('');
    return `
        <section id="${id}" class="carousel-container">
            <h2>${title}</h2>
            <div class="movie-grid">${cardsHTML}</div>
        </section>
    `;
}

// --- PAGE RENDERERS ---
// Each function is responsible for rendering a specific view in the app.

/**
 * Renders the Home Page, fetching and displaying trending and now-playing carousels.
 */
export async function renderHomePage() {
    updateBackdrop(null);
    appRoot.innerHTML = `<div class="loading-indicator">Fetching masterpieces...</div>`;

    const [trending, nowPlaying] = await Promise.all([getTrending(), getNowPlaying()]);

    if (!trending || !nowPlaying) {
        appRoot.innerHTML = `<div class="error-message">Could not fetch data. Please check your API key and network connection.</div>`;
        return;
    }

    const homeContent = `
        <div class="fade-in">
            ${createCarouselHTML('trending', 'Trending This Week', trending.results)}
            ${createCarouselHTML('now-playing', 'Now Playing', nowPlaying.results)}
        </div>
    `;
    appRoot.innerHTML = homeContent;
}

/**
 * Renders the Search Page with both a standard keyword search and an AI-powered vibe search.
 */
export function renderSearchPage() {
    updateBackdrop(null);
    appRoot.innerHTML = `
        <div class="search-container fade-in">
            <h2>Search by Title</h2>
            <input type="text" id="search-input" class="search-input" placeholder="e.g., Blade Runner, The Office..." autocomplete="off">
            
            <h2>Or Describe a Vibe (AI Search)</h2>
            <input type="text" id="ai-search-input" class="search-input" placeholder="e.g., a sci-fi like Arrival but uplifting..." autocomplete="off">
            
            <div id="search-results" class="movie-grid"></div>
        </div>
    `;

    const searchInput = document.getElementById('search-input');
    const aiSearchInput = document.getElementById('ai-search-input');
    const searchResultsContainer = document.getElementById('search-results');
    let debounceTimer;

    // Standard keyword search with debouncing to prevent excessive API calls
    searchInput.addEventListener('input', e => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                searchResultsContainer.innerHTML = '<div class="loading-indicator">Searching...</div>';
                const data = await searchMedia(query);
                const resultsHTML = data.results.map(createMovieCardHTML).join('');
                searchResultsContainer.innerHTML = resultsHTML;
            } else {
                searchResultsContainer.innerHTML = '';
            }
        }, 500);
    });

    // AI-powered search, triggers on "Enter" key press
    aiSearchInput.addEventListener('keypress', async e => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (!query) return;

            searchResultsContainer.innerHTML = '<div class="loading-indicator">Asking the AI... this may take a moment.</div>';
            
            // 1. Get a comma-separated string of movie titles from Gemini
            const movieTitlesString = await askGemini(query);

            if (!movieTitlesString) {
                searchResultsContainer.innerHTML = '<div class="error-message">The AI could not respond. Please try again.</div>';
                return;
            }

            // 2. Search for each movie title individually using the TMDB API
            const movieTitles = movieTitlesString.split(',').map(t => t.trim());
            const searchPromises = movieTitles.map(title => searchMedia(title));
            const searchResults = await Promise.all(searchPromises);

            // 3. Extract the single best result from each search and display it
            const topResults = searchResults.map(res => res?.results[0]).filter(Boolean);
            const resultsHTML = topResults.map(createMovieCardHTML).join('');
            searchResultsContainer.innerHTML = resultsHTML;
        }
    });
}

/**
 * Renders the detail page for a specific movie or TV show.
 * @param {string} type - 'movie' or 'tv'.
 * @param {string} id - The ID of the media.
 */
export async function renderDetailPage(type, id) {
    appRoot.innerHTML = `<div class="loading-indicator">Loading details...</div>`;
    const details = await getMediaDetails(type, id);

    if (!details) {
        appRoot.innerHTML = `<div class="error-message">Content not found.</div>`;
        return;
    }

    updateBackdrop(details.backdrop_path);
    const inWatchlist = isInWatchlist(type, id);
    const title = details.title || details.name;
    const releaseYear = details.release_date || details.first_air_date ? new Date(details.release_date || details.first_air_date).getFullYear() : 'N/A';

    appRoot.innerHTML = `
        <div class="detail-view fade-in">
            <div class="detail-content">
                <img src="${TMDB_IMAGE_BASE_URL}w500${details.poster_path}" alt="${title}" class="detail-poster">
                <div class="detail-info">
                    <h1>${title} <span>(${releaseYear})</span></h1>
                    <p class="tagline">${details.tagline || ''}</p>
                    <p>${details.overview}</p>
                    <button class="btn" id="watchlist-btn" data-id="${id}" data-type="${type}">
                        ${inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listener for the newly created watchlist button
    document.getElementById('watchlist-btn').addEventListener('click', handleWatchlistToggle);
}

/**
 * Renders the user's personal watchlist.
 */
export async function renderWatchlistPage() {
    updateBackdrop(null);
    appRoot.innerHTML = `<div class="loading-indicator">Loading your watchlist...</div>`;
    const watchlist = getWatchlist();

    if (watchlist.length === 0) {
        appRoot.innerHTML = '<h2>Your watchlist is empty.</h2>';
        return;
    }

    const items = await Promise.all(watchlist.map(item => getMediaDetails(item.type, item.id)));
    const itemsHTML = items.map(item => item ? createMovieCardHTML(item) : '').join('');
    appRoot.innerHTML = `<div class="fade-in"><h2>My Watchlist</h2><div class="movie-grid">${itemsHTML}</div></div>`;
}


// --- UI HELPERS ---
// These functions manage static parts of the UI or handle specific UI events.

/**
 * Renders the main site header and navigation.
 */
export function renderHeader() {
    header.innerHTML = `
        <nav>
            <a href="#/home" class="logo">CineXP</a>
            <div class="nav-links">
                <a href="#/home" data-path="#/home">Home</a>
                <a href="#/search" data-path="#/search">Search</a>
                <a href="#/watchlist" data-path="#/watchlist">Watchlist</a>
            </div>
        </nav>
    `;
}

/**
 * Renders the main site footer.
 */
export function renderFooter() {
    footer.innerHTML = `<p>CineXP &copy; ${new Date().getFullYear()}. A premium personal project.</p>`;
}

/**
 * Updates the active state of navigation links based on the current URL hash.
 * @param {string} currentHash - The current window.location.hash.
 */
export function updateNavLinks(currentHash) {
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        // Use startsWith to correctly highlight detail pages under their parent, if desired,
        // but for now, an exact match is cleaner.
        link.classList.toggle('active', link.hash === currentHash);
    });
}

/**
 * Fades in the blurred backdrop with a specific image.
 * @param {string|null} backdropPath - The path for the background image, or null to hide it.
 */
export function updateBackdrop(backdropPath) {
    if (backdropPath && backdropPath !== 'null') {
        backdrop.style.backgroundImage = `url(${TMDB_IMAGE_BASE_URL}original${backdropPath})`;
        backdrop.style.opacity = 1;
    } else {
        backdrop.style.opacity = 0;
    }
}

/**
 * Handles clicks on the watchlist button, adding or removing items from storage.
 * @param {Event} e - The click event object.
 */
function handleWatchlistToggle(e) {
    const { type, id } = e.target.dataset;
    if (isInWatchlist(type, id)) {
        removeFromWatchlist(type, id);
        e.target.textContent = '+ Add to Watchlist';
    } else {
        addToWatchlist(type, id);
        e.target.textContent = '✓ In Watchlist';
    }
}
