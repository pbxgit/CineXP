// src/js/ui.js
import { getTrending, getNowPlaying, searchMedia, getMediaDetails } from './api.js';
import { getWatchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } from './storage.js';
import { TMDB_IMAGE_BASE_URL } from './config.js';

const appRoot = document.getElementById('app-root');
const header = document.getElementById('main-header');
const footer = document.getElementById('main-footer');
const backdrop = document.getElementById('app-backdrop');

// --- Reusable HTML Component Generators ---

function createMovieCardHTML(media) {
    if (!media.poster_path) return '';
    const type = media.media_type || (media.title ? 'movie' : 'tv');
    return `
        <div class="movie-card" data-id="${media.id}" data-type="${type}" data-backdrop="${media.backdrop_path}">
            <img src="${TMDB_IMAGE_BASE_URL}w500${media.poster_path}" alt="${media.title || media.name}" loading="lazy">
        </div>
    `;
}

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

// --- Page Renderers ---

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

export function renderSearchPage() {
    updateBackdrop(null);
    appRoot.innerHTML = `
        <div class="search-container fade-in">
            <h2>Find a movie or TV show</h2>
            <input type="text" id="search-input" class="search-input" placeholder="e.g., Blade Runner, The Office..." autocomplete="off">
            <div id="search-results" class="movie-grid"></div>
        </div>
    `;

    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    let debounceTimer;

    searchInput.addEventListener('input', e => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                const data = await searchMedia(query);
                const resultsHTML = data.results.map(createMovieCardHTML).join('');
                searchResultsContainer.innerHTML = resultsHTML;
            } else {
                searchResultsContainer.innerHTML = '';
            }
        }, 500);
    });
}

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
    const releaseYear = new Date(details.release_date || details.first_air_date).getFullYear();

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
    
    // Add event listener for the new button
    document.getElementById('watchlist-btn').addEventListener('click', handleWatchlistToggle);
}

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


// --- UI Helpers ---

export function renderHeader() {
    header.innerHTML = `
        <nav>
            <a href="#/home" class="logo">CineXP</a>
            <div class="nav-links">
                <a href="#/home" data-path="/home">Home</a>
                <a href="#/search" data-path="/search">Search</a>
                <a href="#/watchlist" data-path="/watchlist">Watchlist</a>
            </div>
        </nav>
    `;
}

export function renderFooter() {
    footer.innerHTML = `<p>CineXP &copy; ${new Date().getFullYear()}. A premium personal project.</p>`;
}

export function updateNavLinks(currentHash) {
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        link.classList.toggle('active', link.hash === currentHash);
    });
}

export function updateBackdrop(backdropPath) {
    if (backdropPath && backdropPath !== 'null') {
        backdrop.style.backgroundImage = `url(${TMDB_IMAGE_BASE_URL}original${backdropPath})`;
        backdrop.style.opacity = 1;
    } else {
        backdrop.style.opacity = 0;
    }
}

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
