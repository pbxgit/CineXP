/*
=====================================================
    Personal Media Explorer - Main JavaScript Engine
    Architecture: Final Definitive & Declarative Render
=====================================================
*/

let watchlist = [];

// --- 1. APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    setupHeaderScrollBehavior();
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

// --- 2. GLOBAL UI & PAGE INITIALIZERS ---
function setupHeaderScrollBehavior() { /* Unchanged */ }
function initHomePage() { /* Unchanged */ }
function initWatchlistPage() { /* Unchanged */ }

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

// --- 3. CORE DETAILS PAGE LOGIC (DEFINITIVE VERSION) ---

async function fetchAndDisplayDetails(type, id) {
    const mainContent = document.querySelector('#details-main-content');
    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=details&type=${type}&id=${id}`);
        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
        
        const data = await response.json();
        if (!data || !data.details) {
            throw new Error("API returned invalid data.");
        }

        const { details: media, logoUrl, recommendations, credits } = data;

        setDynamicBackdrop(media.poster_path, media.backdrop_path);
        applyDynamicAccentColor(media.poster_path);

        let heroContentHTML = '';
        if (media.title || media.name) {
            const releaseDate = media.release_date || media.first_air_date;
            let metaPillsHTML = `<div class="meta-pill">${releaseDate ? releaseDate.substring(0, 4) : 'N/A'}</div>`;
            if (media.genres) media.genres.slice(0, 2).forEach(genre => metaPillsHTML += `<div class="meta-pill">${genre.name}</div>`);
            if (media.vote_average > 0) metaPillsHTML += `<div class="meta-pill rating">⭐ ${media.vote_average.toFixed(1)}</div>`;
            const titleElement = logoUrl ? `<img src="${logoUrl}" alt="${media.name || media.title}" class="media-logo">` : `<h1 class="fallback-title">${media.name || media.title}</h1>`;
            const watchUrl = type === 'movie' ? `https://www.cineby.app/movie/${media.id}?play=true` : `https://www.cineby.app/tv/${media.id}/1/1?play=true`;
            heroContentHTML = `<div class="details-content-overlay content-reveal">${titleElement}<div class="details-meta-pills">${metaPillsHTML}</div><div class="details-overview-container"><p class="details-overview">${media.overview || ''}</p><button class="overview-toggle-btn">More</button></div><div class="action-buttons"><button id="watchlist-btn"></button><a href="${watchUrl}" target="_blank" class="btn-secondary" rel="noopener noreferrer"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;"><path d="M8 5v14l11-7z"/></svg>Watch</a></div></div>`;
        }

        // --- THE DEFINITIVE FIX: Build HTML strings first, then render ---
        const castCarouselHTML = createCastCarouselHTML(credits);
        const recommendationsCarouselHTML = createRecommendationsCarouselHTML(recommendations);
        const seasonBrowserHTML = (type === 'tv' && media.seasons_details) ? createSeasonBrowserHTML(media) : '';

        mainContent.innerHTML = `
            ${heroContentHTML}
            
            ${/* If either carousel has content, wrap them in the body container */''}
            ${(castCarouselHTML || recommendationsCarouselHTML) ? `
                <div class="details-body-content">
                    ${castCarouselHTML}
                    ${recommendationsCarouselHTML}
                </div>
            ` : ''}

            ${seasonBrowserHTML}
        `;

        // Setup interactivity on the now-existing elements
        if (heroContentHTML) {
            updateWatchlistButton(media, type);
            setupInteractiveOverview();
        }
        if (seasonBrowserHTML) {
            setupSeasonBrowserInteractivity();
        }

        setTimeout(() => {
            document.querySelectorAll('#details-main-content .content-reveal').forEach(el => el.classList.add('loaded'));
        }, 100);

    } catch (error) {
        console.error('CRITICAL: Failed to fetch and display details:', error);
        mainContent.innerHTML = '<div class="empty-state" style="margin-top: 20vh;"><h2>Could Not Load Details</h2><p>This title may have incomplete data. Please try another.</p><a href="/">Go Home</a></div>';
    }
}

// --- 4. NEW HTML STRING GENERATORS ---

function createCastCarouselHTML(credits) {
    if (!credits?.cast?.length) return ''; // Return empty string if no cast
    const castHTML = credits.cast.slice(0, 12).map(person => `
        <div class="cast-card">
            <img src="${person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : 'https://via.placeholder.com/120x120?text=No+Image'}" alt="${person.name}" loading="lazy">
            <p class="cast-name">${person.name}</p>
            <p class="cast-character">${person.character}</p>
        </div>`).join('');
    return `<div class="content-reveal"><section class="media-carousel"><h2 class="details-section-title">Cast</h2><div class="carousel-scroll-area">${castHTML}</div></section></div>`;
}

function createRecommendationsCarouselHTML(recommendations) {
    if (!recommendations?.results?.length) return ''; // Return empty string if no recommendations
    const recsHTML = recommendations.results.slice(0, 10).map(media => createMediaCard(media)).join('');
    return `<div class="content-reveal"><section class="media-carousel"><h2 class="details-section-title">More Like This</h2><div class="carousel-scroll-area">${recsHTML}</div></section></div>`;
}

function createSeasonBrowserHTML(media) {
    const displayableSeasons = media.seasons_details.filter(season => season.season_number !== 0 && season.episodes?.length > 0);
    if (displayableSeasons.length === 0) return ''; // Return empty string if no valid seasons

    let tabsHTML = '';
    let listsHTML = '';
    displayableSeasons.forEach((season, index) => {
        const isActive = index === 0;
        tabsHTML += `<button class="season-tab ${isActive ? 'active' : ''}" data-season="season-${season.id}">${season.name}</button>`;
        listsHTML += `<ul class="episode-list ${isActive ? 'active' : ''}" id="season-${season.id}">`;
        season.episodes.forEach(ep => {
            const stillPath = ep.thumbnail_url;
            const episodeWatchUrl = `https://www.cineby.app/tv/${media.id}/${ep.season_number}/${ep.episode_number}?play=true`;
            listsHTML += `<li class="episode-item"><img class="episode-thumbnail" src="${stillPath}" alt="${ep.name}" loading="lazy"><div class="episode-info"><h4>${ep.episode_number}. ${ep.name}</h4><p>${ep.overview ? ep.overview.substring(0, 120) + '...' : 'No description available.'}</p></div><a href="${episodeWatchUrl}" target="_blank" class="episode-watch-link btn-episode-watch" rel="noopener noreferrer">Watch</a></li>`;
        });
        listsHTML += `</ul>`;
    });
    return `<div id="season-browser-container" class="content-reveal"><h2 class="details-section-title">Seasons</h2><div class="season-tabs">${tabsHTML}</div>${listsHTML}</div>`;
}

// --- 5. NEW INTERACTIVITY SETUP ---

function setupSeasonBrowserInteractivity() {
    const container = document.getElementById('season-browser-container');
    if (!container) return;
    container.querySelectorAll('.season-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            container.querySelector('.season-tab.active')?.classList.remove('active');
            container.querySelector('.episode-list.active')?.classList.remove('active');
            const clickedTab = e.currentTarget;
            clickedTab.classList.add('active');
            document.getElementById(clickedTab.dataset.season)?.classList.add('active');
        });
    });
}

// --- 6. UNCHANGED HELPER FUNCTIONS ---

function setDynamicBackdrop(posterPath, backdropPath) { /* ... Unchanged ... */ }
function applyDynamicAccentColor(posterPath) { /* ... Unchanged ... */ }
function setupInteractiveOverview() { /* ... Unchanged ... */ }
function updateWatchlistButton(media, mediaType) { /* ... Unchanged ... */ }
async function handleWatchlistAction(action, media, mediaType) { /* ... Unchanged ... */ }
function isMediaInWatchlist(mediaId) { /* ... Unchanged ... */ }
async function getWatchlistFromServer() { /* ... Unchanged ... */ }
async function fetchMediaCarousel(endpoint, gridSelector) { /* ... Unchanged ... */ }
function createMediaCard(media) { /* ... Unchanged ... */ }
function setupScrollAnimations(selector) { /* ... Unchanged ... */ }


// --- PASTE ALL YOUR UNCHANGED HELPER FUNCTIONS BELOW ---

function setDynamicBackdrop(posterPath, backdropPath) {
    const placeholder = document.getElementById('backdrop-placeholder');
    const image = document.getElementById('backdrop-image');
    if (!placeholder || !image) return;
    let highQualityImageUrl = '';
    if (backdropPath) highQualityImageUrl = `https://image.tmdb.org/t/p/original${backdropPath}`;
    else if (posterPath) highQualityImageUrl = `https://image.tmdb.org/t/p/original${posterPath}`;
    else return;
    if (posterPath) placeholder.style.backgroundImage = `url('https://image.tmdb.org/t/p/w92${posterPath}')`;
    const highResImage = new Image();
    highResImage.onload = () => {
        image.style.backgroundImage = `url('${highQualityImageUrl}')`;
        image.style.opacity = 1;
        image.style.animation = 'kenburns 40s ease-out infinite alternate';
        placeholder.style.animation = 'none';
    };
    highResImage.onerror = () => console.error("Failed to load high-res image:", highQualityImageUrl);
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
            const accentColor = `rgb(${colorThief.getColor(posterImage).join(',')})`;
            document.documentElement.style.setProperty('--color-dynamic-accent', accentColor);
        } catch (e) { console.error("ColorThief error:", e); }
    };
}

function setupInteractiveOverview() {
    const toggleBtn = document.querySelector('.overview-toggle-btn');
    const overviewText = document.querySelector('.details-overview');
    if (!toggleBtn || !overviewText) return;
    if (overviewText.scrollHeight <= overviewText.clientHeight) {
        toggleBtn.style.display = 'none';
        overviewText.style.webkitMaskImage = 'none';
        overviewText.style.maskImage = 'none';
    } else {
        toggleBtn.addEventListener('click', () => {
            overviewText.classList.toggle('expanded');
            toggleBtn.textContent = overviewText.classList.contains('expanded') ? 'Less' : 'More';
        });
    }
}

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
        await fetch('/.netlify/functions/update-watchlist', { method: action, body: JSON.stringify(itemData) });
        if (action === 'POST') watchlist.unshift(itemData);
        else watchlist = watchlist.filter(item => item.id !== media.id);
        updateWatchlistButton(media, mediaType);
    } catch (error) { console.error(`Error with watchlist ${action}:`, error); } finally {
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
    } catch (error) { console.error("Could not fetch watchlist:", error); return []; }
}

async function fetchMediaCarousel(endpoint, gridSelector) {
    const grid = document.querySelector(gridSelector);
    if (!grid) return;
    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=${endpoint}`);
        const data = await response.json();
        grid.innerHTML = data.results.map(createMediaCard).join('');
    } catch (error) { grid.innerHTML = '<p style="color: var(--color-text-secondary);">Could not load this section.</p>'; }
}

function createMediaCard(media) {
    const mediaType = media.media_type || (media.first_air_date ? 'tv' : 'movie');
    const posterPath = media.poster_path ? `https://image.tmdb.org/t/p/w342${media.poster_path}` : 'https://via.placeholder.com/342x513?text=No+Image';
    return `<a href="/details.html?type=${mediaType}&id=${media.id}" class="media-card"><img src="${posterPath}" alt="${media.title || media.name}" loading="lazy"></a>`;
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

document.addEventListener('DOMContentLoaded', () => {
    // --- SCROLLING ANIMATION LOGIC ---
    const animatedElements = document.querySelectorAll('[data-animation="scroll-reveal"]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                // Optional: stop observing once the animation is done
                observer.unobserve(entry.target); 
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    animatedElements.forEach(element => {
        observer.observe(element);
    });

    // --- EXISTING HOMEPAGE LOGIC ---
    // Make sure your existing code to load movies and TV shows is here
    // Example:
    // loadCarouselSection(TRENDING_MOVIES_URL, trendingMoviesGrid, trendingMoviesCarousel);
    // loadCarouselSection(POPULAR_TV_URL, popularTvGrid, popularTvCarousel);
});

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. HEADER SCROLL EFFECT ---
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- 2. SCROLL-TRIGGERED FADE-IN ANIMATION ---
    const animatedElements = document.querySelectorAll('[data-animation="fade-in-up"]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // When the element is in view, add the 'is-visible' class
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    // Observe each element that has the data-animation attribute
    animatedElements.forEach(element => {
        observer.observe(element);
    });

    // --- 3. YOUR EXISTING DATA FETCHING LOGIC GOES HERE ---
    // e.g., loadCarouselSection(TRENDING_MOVIES_URL, ...);
    // e.g., loadCarouselSection(POPULAR_TV_URL, ...);

});
