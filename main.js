/*
=====================================================
    Personal Media Explorer - Main JavaScript Engine
=====================================================
*/

// Global state for the watchlist, populated on load
let watchlist = [];

// --- 1. APP INITIALIZATION ---

document.addEventListener('DOMContentLoaded', async () => {
    // Setup universal UI enhancements first
    setupHeaderScrollBehavior();

    // Fetch the user's watchlist from the server once
    watchlist = await getWatchlistFromServer();

    // Basic router to initialize the correct page logic
    const path = window.location.pathname;
    if (path === '/' || path.endsWith('index.html')) {
        initHomePage();
    } else if (path.endsWith('details.html')) {
        initDetailsPage();
    } else if (path.endsWith('watchlist.html')) {
        initWatchlistPage();
    }
});


// --- 2. GLOBAL UI SETUP ---

// This function is now much simpler and only targets the details page
function setupHeaderScrollBehavior() {
    const header = document.getElementById('main-header');
    // Only proceed if we are on the details page and the header exists
    if (!document.body.classList.contains('details-page') || !header) {
        return;
    }

    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
}

// --- 3. PAGE INITIALIZERS ---

function initHomePage() {
    fetchMediaCarousel('trending_movies', '#trending-movies-grid');
    fetchMediaCarousel('popular_tv', '#popular-tv-grid');
    setupScrollAnimations('.media-carousel');
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

function initWatchlistPage() {
    const watchlistGrid = document.querySelector('#watchlist-grid');
    if (!watchlistGrid) return;

    watchlistGrid.innerHTML = '';
    if (watchlist.length === 0) {
        watchlistGrid.innerHTML = `<div class="empty-state"><h2>Your Watchlist is Empty</h2><p>Add movies and shows to see them here.</p><a href="/">Discover Something New</a></div>`;
        return;
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'watchlist-grid-container';
    watchlist.forEach(media => gridContainer.appendChild(createMediaCard(media)));
    watchlistGrid.appendChild(gridContainer);
}


// --- 4. CORE DETAILS PAGE LOGIC ---

async function fetchAndDisplayDetails(type, id) {
    const mainContent = document.querySelector('#details-main-content');
    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=details&type=${type}&id=${id}`);
        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
        const { details: media, logoUrl, recommendations, credits } = await response.json();

        // =================================================================
        // ** THE FIX IS HERE **
        // We must call the functions to set the backdrop and accent color.
        // =================================================================
        setDynamicBackdrop(media.poster_path, media.backdrop_path);
        applyDynamicAccentColor(media.poster_path);
        // =================================================================


        // 2. Prepare Meta Pills for display
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
                        <svg width="24" height="24" viewBox="0 M8 5v14l11-7z"/></svg>
                        Watch
                    </a>
                </div>
            </div>
            
            ${(credits?.cast?.length > 0 || recommendations?.results?.length > 0) ? `
                <div class="details-body-content">
                    ${(credits?.cast?.length > 0) ? '<div id="cast-container" class="content-reveal"></div>' : ''}
                    ${(recommendations?.results?.length > 0) ? '<div id="recommendations-container" class="content-reveal"></div>' : ''}
                </div>
            ` : ''}

            ${(type === 'tv' && media.seasons_details) ? '<div id="season-browser-container" class="content-reveal"></div>' : ''}
        `;

        // 5. Render dynamic components into their containers
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

        // 6. Trigger entrance animations
        setTimeout(() => {
            mainContent.querySelector('.details-content-overlay').classList.add('loaded');
            setupScrollAnimations('#details-main-content .content-reveal');
        }, 100);

    } catch (error) {
        mainContent.innerHTML = '<h1>Could not load details. Please try again later.</h1>';
        console.error('Error fetching details:', error);
    }
}


// --- 5. DYNAMIC STYLE & UI FUNCTIONS ---

/**
 * Handles the creative "blur-up" loading of the backdrop image.
 * This version is resilient and uses a fallback system to find the best available image.
 */
function setDynamicBackdrop(posterPath, backdropPath) {
    const placeholder = document.getElementById('backdrop-placeholder');
    const image = document.getElementById('backdrop-image');

    // Early exit if elements are missing
    if (!placeholder || !image) {
        console.error("Backdrop elements not found in details.html!");
        return;
    }

    // --- 1. Determine the best available high-quality image URL ---
    let highQualityImageUrl = '';
    if (backdropPath) {
        // BEST CASE: Use the original backdrop image.
        highQualityImageUrl = `https://image.tmdb.org/t/p/original${backdropPath}`;
        console.log("Using backdrop image (best quality):", highQualityImageUrl);
    } else if (posterPath) {
        // FALLBACK: If no backdrop, use the original poster image.
        highQualityImageUrl = `https://image.tmdb.org/t/p/original${posterPath}`;
        console.log("No backdrop found. Falling back to poster image:", highQualityImageUrl);
    } else {
        // FINAL FALLBACK: If no images are available, do nothing.
        console.log("No backdrop or poster available.");
        return;
    }

    // --- 2. Set the low-quality placeholder ---
    // We always use the poster for the placeholder as it's guaranteed to be more "face-forward"
    if (posterPath) {
        const lowQualityImageUrl = `https://image.tmdb.org/t/p/w92${posterPath}`;
        placeholder.style.backgroundImage = `url('${lowQualityImageUrl}')`;
    }

    // --- 3. Load the chosen high-quality image ---
    const highResImage = new Image();
    highResImage.onload = () => {
        image.style.backgroundImage = `url('${highQualityImageUrl}')`;
        image.style.opacity = 1;
        image.style.animation = 'kenburns 40s ease-out infinite alternate';
        placeholder.style.animation = 'none';
    };
    highResImage.onerror = () => {
        console.error("Failed to load high-resolution image:", highQualityImageUrl);
    };

    // Start the download
    highResImage.src = highQualityImageUrl;
}

function applyDynamicAccentColor(posterPath) {
    if (!posterPath) return;
    const posterUrl = `https://image.tmdb.org/t/p/w92${posterPath}`;
    const posterImage = new Image();
    posterImage.crossOrigin = "Anonymous";
    posterImage.src = posterUrl;

    posterImage.onload = () => {
        try {
            const colorThief = new ColorThief();
            const palette = colorThief.getPalette(posterImage, 3);
            const vibrantColor = palette.find(color => {
                const [r, g, b] = color;
                return (r > 100 || g > 100 || b > 100) && (r + g + b > 250);
            }) || palette[0];
            const accentColor = `rgb(${vibrantColor.join(',')})`;
            document.documentElement.style.setProperty('--color-dynamic-accent', accentColor);
        } catch (e) {
            console.error("ColorThief error:", e);
        }
    };
}

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


// --- 6. WATCHLIST MANAGEMENT ---

function updateWatchlistButton(media, mediaType) {
    const button = document.getElementById('watchlist-btn');
    if (!button) return;

    if (isMediaInWatchlist(media.id)) {
        button.innerHTML = '✓ Added to Watchlist';
        button.className = 'btn-watchlist-added';
        button.onclick = () => handleWatchlistAction('DELETE', media, mediaType);
    } else {
        button.innerHTML = '＋ Add to Watchlist';
        button.className = 'btn-watchlist';
        button.onclick = () => handleWatchlistAction('POST', media, mediaType);
    }
}

async function handleWatchlistAction(action, media, mediaType) {
    const button = document.getElementById('watchlist-btn');
    button.disabled = true;
    const itemData = { id: media.id, title: media.title || media.name, poster_path: media.poster_path, mediaType: mediaType };

    try {
        await fetch('/.netlify/functions/update-watchlist', {
            method: action,
            body: JSON.stringify(itemData)
        });
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

function isMediaInWatchlist(mediaId) {
    return watchlist.some(item => item.id === mediaId);
}

async function getWatchlistFromServer() {
    try {
        const response = await fetch('/.netlify/functions/update-watchlist', { method: 'GET' });
        if (!response.ok) return [];
        const data = await response.json();
        return data.map(item => JSON.parse(item));
    } catch (error) {
        console.error("Could not fetch watchlist:", error);
        return [];
    }
}


// --- 7. RENDERING & UTILITIES ---

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
            const stillPath = ep.thumbnail_url;
            // ...
const episodeWatchUrl = `https://www.cineby.app/tv/${media.id}/${ep.season_number}/${ep.episode_number}?play=true`;
listsHTML += `<li class="episode-item"><img class="episode-thumbnail" src="${stillPath}" alt="${ep.name}" loading="lazy"><div class="episode-info"><h4>${ep.episode_number}. ${ep.name}</h4><p>${ep.overview ? ep.overview.substring(0, 120) + '...' : 'No description available.'}</p></div><a href="${episodeWatchUrl}" target="_blank" class="episode-watch-link btn-episode-watch" rel="noopener noreferrer">Watch</a></li>`;
// ...
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

function createMediaCard(media) {
    const card = document.createElement('a');
    card.className = 'media-card';
    const mediaType = media.mediaType || media.media_type || (media.first_air_date ? 'tv' : 'movie');
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
