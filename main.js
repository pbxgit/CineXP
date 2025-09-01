/*
=====================================================
    Personal Media Explorer - Main JavaScript Engine
=====================================================
*/

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
        const { details: media, logoUrl } = await response.json();

        const smallBackdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w300${media.backdrop_path}` : '';
        const largeBackdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/original${media.backdrop_path}` : '';
        
        mainContent.innerHTML = `
            <div class="details-backdrop" style="background-image: url('${smallBackdropUrl}')"></div>
            <div class="details-content content-reveal"></div>
            <div class="season-browser content-reveal"></div>
        `;
        
        const backdropElement = mainContent.querySelector('.details-backdrop');
        const contentOverlay = mainContent.querySelector('.details-content');
        const seasonBrowser = mainContent.querySelector('.season-browser');

        const highResImage = new Image();
        highResImage.src = largeBackdropUrl;
        highResImage.onload = () => {
            backdropElement.style.backgroundImage = `url('${largeBackdropUrl}')`;
        };

        const titleElement = logoUrl
            ? `<img src="${logoUrl}" alt="${media.name || media.title}" class="media-logo">`
            : `<h1 class="fallback-title">${media.name || media.title}</h1>`;

        const ICONS = {
            calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>`,
            star: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
            tag: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.22-1.05-.59-1.42zM13 20.01L4 11V4h7l9 9-7 7.01z"/><circle cx="6.5" cy="6.5" r="1.5"/></svg>`
        };
        const releaseDate = media.release_date || media.first_air_date;
        let metaPillsHTML = `<div class="meta-pill">${ICONS.calendar} ${releaseDate ? releaseDate.substring(0, 4) : 'N/A'}</div>`;
        if (media.genres) {
            media.genres.slice(0, 2).forEach(genre => metaPillsHTML += `<div class="meta-pill">${ICONS.tag} ${genre.name}</div>`);
        }
        if (media.vote_average > 0) {
            metaPillsHTML += `<div class="meta-pill rating">${ICONS.star} ${media.vote_average.toFixed(1)}</div>`;
        }

        const watchUrl = type === 'movie'
            ? `https://www.cineby.app/movie/${media.id}?play=true`
            : `https://www.cineby.app/tv/${media.id}/1/1?play=true`;

        contentOverlay.innerHTML = `
            <div class="details-content-overlay">
                ${titleElement}
                <div class="details-meta-pills">${metaPillsHTML}</div>
                <p class="details-overview">${media.overview}</p>
                <div class="action-buttons">
                    <button id="watchlist-btn" class="btn-primary"></button>
                    <a href="${watchUrl}" target="_blank" class="btn-secondary" rel="noopener noreferrer">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;"><path d="M8 5v14l11-7z"/></svg>
                        Watch
                    </a>
                </div>
            </div>
        `;
        
        updateWatchlistButton(media, type);

        if (type === 'tv' && media.seasons_details) {
            renderSeasonBrowser(media, seasonBrowser);
        }

        setTimeout(() => {
            mainContent.querySelectorAll('.content-reveal').forEach(el => el.classList.add('loaded'));
        }, 100);

    } catch (error) {
        mainContent.innerHTML = '<h1>Could not load details.</h1>';
        console.error('Error fetching details:', error);
    }
}

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
            listsHTML += `
                <li class="episode-item">
                    <img class="episode-thumbnail" src="${stillPath}" alt="${ep.name}" loading="lazy">
                    <div class="episode-info">
                        <h4>${ep.episode_number}. ${ep.name}</h4>
                        <p>${ep.overview ? ep.overview.substring(0, 120) + '...' : 'No description available.'}</p>
                    </div>
                    <a href="${episodeWatchUrl}" target="_blank" class="episode-watch-link btn-secondary" rel="noopener noreferrer">Watch</a>
                </li>
            `;
        });
        listsHTML += `</ul>`;
    });
    container.innerHTML = `<div class="season-tabs">${tabsHTML}</div>${listsHTML}`;
    container.querySelectorAll('.season-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelector('.season-tab.active').classList.remove('active');
            container.querySelector('.episode-list.active').classList.remove('active');
            tab.classList.add('active');
            document.getElementById(tab.dataset.season).classList.add('active');
        });
    });
}

function initWatchlistPage() {
    const watchlistGrid = document.querySelector('#watchlist-grid');
    watchlistGrid.innerHTML = '';
    if (watchlist.length === 0) {
        watchlistGrid.innerHTML = `<div class="empty-state"><h2>Your Watchlist is Empty</h2><p>Add movies and shows to see them here.</p><a href="/">Discover Something New</a></div>`;
        return;
    }
    const carousel = document.createElement('div');
    carousel.className = 'carousel-scroll-area';
    watchlist.forEach(media => carousel.appendChild(createMediaCard(media)));
    watchlistGrid.appendChild(carousel);
}

async function getWatchlistFromServer() {
    try {
        const response = await fetch('/.netlify/functions/update-watchlist', { method: 'GET' });
        const data = await response.json();
        return data.map(item => JSON.parse(item));
    } catch (error) { return []; }
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
