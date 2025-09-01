/*
=====================================================
    Personal Media Explorer - Main JavaScript Engine
=====================================================
*/

let watchlist = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Setup universal UI enhancements first
    setupTransparentHeader();

    watchlist = await getWatchlistFromServer();
    const path = window.location.pathname;

    if (path === '/' || path.endsWith('index.html')) {
        initHomePage();
    } else if (path.endsWith('details.html')) {
        initDetailsPage();
    } else if (path.endsWith('watchlist.html')) {
        initWatchlistPage();
    }
});

function setupTransparentHeader() {
    const header = document.getElementById('main-header');
    if (!header) return;

    const scrollThreshold = 50; // Pixels to scroll before header becomes solid

    const handleScroll = () => {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    // Only apply this logic on the details page for the immersive effect
    if (window.location.pathname.endsWith('details.html')) {
         window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
        // For other pages, make the header solid from the start
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
//  MODERNIZED DETAILS PAGE LOGIC
// =================================================================

async function fetchAndDisplayDetails(type, id) {
    const mainContent = document.querySelector('#details-main-content');
    const backdropContainer = document.querySelector('#details-backdrop-container');
    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=details&type=${type}&id=${id}`);
        const { details: media, logoUrl, recommendations, credits } = await response.json();

        // 1. Create and apply the dynamic backdrop AND accent color
        const backdropElement = document.createElement('div');
        backdropElement.className = 'details-backdrop';
        backdropContainer.innerHTML = '';
        backdropContainer.appendChild(backdropElement);
        applyDynamicStyles(media.poster_path, media.backdrop_path, backdropElement);

        // 2. Prepare Meta Pills
        const ICONS = { /* ... (Icons remain the same) ... */ };
        const releaseDate = media.release_date || media.first_air_date;
        let metaPillsHTML = `<div class="meta-pill">${releaseDate ? releaseDate.substring(0, 4) : 'N/A'}</div>`;
        if (media.genres) {
            media.genres.slice(0, 2).forEach(genre => metaPillsHTML += `<div class="meta-pill">${genre.name}</div>`);
        }
        if (media.vote_average > 0) {
            metaPillsHTML += `<div class="meta-pill rating">⭐ ${media.vote_average.toFixed(1)}</div>`;
        }

        // 3. Prepare other dynamic content
        const titleElement = logoUrl
            ? `<img src="${logoUrl}" alt="${media.name || media.title}" class="media-logo">`
            : `<h1 class="fallback-title">${media.name || media.title}</h1>`;

        const watchUrl = type === 'movie' ? `https://www.cineby.app/movie/${media.id}?play=true` : `https://www.cineby.app/tv/${media.id}/1/1?play=true`;

        // 4. Build the full page HTML
        mainContent.innerHTML = `
            <div class="details-content-overlay content-reveal">
                ${titleElement}
                <div class="details-meta-pills">${metaPillsHTML}</div>
                <div class="details-overview-container">
                    <p class="details-overview">${media.overview}</p>
                    <button class="overview-toggle-btn">More</button>
                </div>
                <div class="action-buttons">
                    <button id="watchlist-btn"></button>
                    <a href="${watchUrl}" target="_blank" class="btn-secondary" rel="noopener noreferrer">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;"><path d="M8 5v14l11-7z"/></svg>
                        Watch
                    </a>
                </div>
            </div>
            
            <div class="details-body-content">
                ${(type === 'tv' && media.seasons_details) ? '<div id="season-browser-container" class="content-reveal"></div>' : ''}
                ${(credits && credits.cast.length > 0) ? '<div id="cast-container" class="content-reveal"></div>' : ''}
                ${(recommendations && recommendations.results.length > 0) ? '<div id="recommendations-container" class="content-reveal"></div>' : ''}
            </div>
        `;

        // 5. Render dynamic components and setup interactivity
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
            mainContent.querySelector('.content-reveal').classList.add('loaded');
            setupScrollAnimations('.details-body-content .content-reveal');
        }, 100);

    } catch (error) {
        mainContent.innerHTML = '<h1>Could not load details.</h1>';
        console.error('Error fetching details:', error);
    }
}

function applyDynamicStyles(posterPath, backdropPath, backdropElement) {
    if (!backdropPath) return;
    const posterUrl = `https://image.tmdb.org/t/p/w92${posterPath}`;
    const backdropUrl = `https://image.tmdb.org/t/p/original${backdropPath}`;

    const posterImage = new Image();
    posterImage.crossOrigin = "Anonymous";
    posterImage.src = posterUrl;

    posterImage.onload = () => {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(posterImage, 3); // Get 3 colors
        
        // Find the most vibrant, non-dark color for the accent
        const vibrantColor = palette.find(color => {
            const [r, g, b] = color;
            return (r > 100 || g > 100 || b > 100) && (r+g+b > 250); // Avoid dark/muted colors
        }) || palette[0]; // Fallback to the first color

        const accentColor = `rgb(${vibrantColor.join(',')})`;

        // Set the CSS variable for the dynamic accent
        document.documentElement.style.setProperty('--color-dynamic-accent', accentColor);
        
        // Apply the backdrop image
        backdropElement.style.backgroundImage = `url(${backdropUrl})`;
        backdropElement.style.opacity = '1';
    };
    posterImage.onerror = () => { // Fallback if poster fails
        document.documentElement.style.setProperty('--color-dynamic-accent', '#28a745'); // Reset to default
        backdropElement.style.backgroundImage = `url(${backdropUrl})`;
        backdropElement.style.opacity = '1';
    }
}

// ... The rest of your main.js file remains the same ...
// (setupInteractiveOverview, renderCastCarousel, renderRecommendationsCarousel,
// renderSeasonBrowser, initWatchlistPage, getWatchlistFromServer, etc.)

// PASTE THE REST OF YOUR ORIGINAL main.js FILE FROM THIS POINT ONWARD...
function setupInteractiveOverview() {
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

function renderCastCarousel(cast, container) {
    const castHTML = cast.slice(0, 12).map(person => `
        <div class="cast-card">
            <img src="${person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : 'https://via.placeholder.com/120x120?text=No+Image'}" alt="${person.name}" loading="lazy">
            <p class="cast-name">${person.name}</p>
            <p class="cast-character">${person.character}</p>
        </div>
    `).join('');
    container.innerHTML = `<section class="media-carousel"><h2 class="details-section-title">Cast</h2><div class="carousel-scroll-area">${castHTML}</div></section>`;
}

function renderRecommendationsCarousel(recommendations, container) {
    const recsHTML = recommendations.slice(0, 10).map(media => createMediaCard(media).outerHTML).join('');
    container.innerHTML = `<section class="media-carousel"><h2 class="details-section-title">More Like This</h2><div class="carousel-scroll-area">${recsHTML}</div></section>`;
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
            listsHTML += `<li class="episode-item"><img class="episode-thumbnail" src="${stillPath}" alt="${ep.name}" loading="lazy"><div class="episode-info"><h4>${ep.episode_number}. ${ep.name}</h4><p>${ep.overview ? ep.overview.substring(0, 120) + '...' : 'No description available.'}</p></div><a href="${episodeWatchUrl}" target="_blank" class="episode-watch-link btn-secondary" rel="noopener noreferrer">Watch</a></li>`;
        });
        listsHTML += `</ul>`;
    });
    container.innerHTML = `<h2 class="details-section-title">Seasons</h2><div class="season-tabs">${tabsHTML}</div>${listsHTML}`;
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
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
    gridContainer.style.gap = '1rem';
    watchlist.forEach(media => gridContainer.appendChild(createMediaCard(media)));
    watchlistGrid.appendChild(gridContainer);
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
        button.textContent = '✓ In Watchlist';
        button.className = 'btn-watchlist-added'; // Use a specific class for the "added" state
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

function setupScrollAnimations(selector) {
    const elements = document.querySelectorAll(selector);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible', 'loaded');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    elements.forEach(el => observer.observe(el));
}
