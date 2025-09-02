/*
=====================================================
    Personal Media Explorer - Main JavaScript File
    (Final Version with Full UI Overhaul)
=====================================================

    TABLE OF CONTENTS
    -----------------
    1.  GLOBAL CONFIGURATION
    2.  ROUTER & PAGE INITIALIZATION
    3.  API UTILITIES
    4.  HOME PAGE LOGIC (OVERHAULED)
    5.  DETAILS PAGE LOGIC
    6.  DETAILS PAGE: UI & CONTENT RENDERERS
    7.  WATCHLIST LOGIC
    8.  GLOBAL UI COMPONENTS & HELPERS
*/

// =====================================================
// 1. GLOBAL CONFIGURATION
// =====================================================
const API_BASE_URL = '/.netlify/functions/get-media';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// =====================================================
// 2. ROUTER & PAGE INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') initHomePage();
    else if (path.includes('/details.html')) initDetailsPage();
    else if (path.includes('/watchlist.html')) initWatchlistPage();
    setupHeaderScroll();
});

// =====================================================
// 3. API UTILITIES
// =====================================================
async function fetchFromAPI(params) {
    try {
        const response = await fetch(`${API_BASE_URL}?${new URLSearchParams(params)}`);
        if (!response.ok) throw new Error(`API error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching from API function:", error);
        return null;
    }
}

/*
=====================================================
    4. HOMEPAGE: DYNAMIC HERO SLIDER (FINAL REFINEMENT)
=====================================================
*/
.hero-section {
    position: relative;
    height: 100vh;
    overflow: hidden;
}
.hero-slider.swiper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
.hero-slide {
    position: relative;
    background-size: cover;
    background-position: center 30%;
    display: flex;
    align-items: flex-end;
    /* Lowered the content by reducing bottom padding */
    padding: 20vh 5% 12vh;
}
.hero-slide::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to top, 
        var(--color-background) 20%, 
        rgba(0, 0, 0, 0.7) 45%, 
        transparent 70%
    );
    z-index: 1;
}
.hero-slide-content {
    position: relative;
    z-index: 2;
    max-width: 45%;
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease-out 0.5s, transform 0.8s ease-out 0.5s;
}
.swiper-slide-active .hero-slide-content {
    opacity: 1;
    transform: translateY(0);
}

.hero-slide-logo {
    max-width: 90%;
    max-height: 22vh;
    object-fit: contain;
    object-position: left bottom;
    /* Increased margin to create space for the button */
    margin-bottom: 2.5rem;
    filter: drop-shadow(0 6px 25px rgba(0,0,0,0.8));
}
.hero-slide-title-fallback {
    font-family: var(--font-display);
    font-size: 6rem;
    line-height: 1;
    text-shadow: 0 5px 30px rgba(0,0,0,0.9);
    /* Increased margin to create space for the button */
    margin-bottom: 2.5rem;
}

/* 
   --- The .hero-slide-overview and .hero-cta-button styles have been removed ---
   The button styling now comes from the global .btn-primary class 
*/

.swiper-button-next,
.swiper-button-prev {
    display: none;
}

// =====================================================
// 5. DETAILS PAGE LOGIC
// =====================================================
async function initDetailsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const type = urlParams.get('type');
    if (!id || !type) { /* Handle error gracefully */ return; }

    const data = await fetchFromAPI({ endpoint: 'details', type, id });
    if (data && data.details) {
        displayDetails(data, type);
    } else { /* Handle error gracefully */ }
}

function displayDetails(data, type) {
    const { details, logoUrl } = data;
    const mainContent = document.getElementById('details-main-content');
    
    if (details.poster_path) setDynamicAccentColor(`${IMAGE_BASE_URL}w200${details.poster_path}`);
    setBackdropImage(details.backdrop_path);

    const title = details.title || details.name;
    const releaseDate = details.release_date || details.first_air_date || '';
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
    const runtime = details.runtime ? `${details.runtime} min` : (details.number_of_seasons ? `${details.number_of_seasons} Seasons` : '');
    const watchUrl = type === 'movie' 
        ? `https://www.cineby.app/movie/${details.id}?play=true`
        : `https://www.cineby.app/tv/${details.id}/1/1?play=true`;

    const detailsHTML = `
        <div class="details-content-overlay">
            ${logoUrl ? `<img src="${logoUrl}" alt="${title} Logo" class="media-logo">` : `<h1 class="fallback-title">${title}</h1>`}
            <div class="details-meta-pills">
                <span>${year}</span>
                ${runtime ? `<span>${runtime}</span>` : ''}
                ${details.genres.map(g => `<span>${g.name}</span>`).join('')}
            </div>
            <p class="details-overview">${details.overview}</p>
            <div class="details-buttons">
                <a href="${watchUrl}" target="_blank" class="btn btn-primary" style="padding: 0.8rem 2rem; border-radius: 8px; font-weight: bold; cursor: pointer; text-decoration: none;">WATCH</a>
                <button id="watchlist-btn" class="btn btn-secondary" style="padding: 0.8rem 2rem; border: 1px solid var(--color-border); border-radius: 8px; background-color: rgba(30,30,30,0.5); color: white; font-weight: bold; cursor: pointer;">ADD TO LIST</button>
            </div>
        </div>
    `;
    mainContent.innerHTML = detailsHTML;
    
    setupTabs(data, type);
    setupWatchlistButton(details, type);
}

// =====================================================
// 6. DETAILS PAGE: UI & CONTENT RENDERERS
// =====================================================
function setupTabs(data, type) {
    const navContainer = document.getElementById('details-tabs-nav');
    const contentContainer = document.getElementById('details-tabs-content');
    if (!navContainer || !contentContainer) return;

    let tabs = [];
    if (type === 'tv' && data.details.seasons_details?.length > 0) tabs.push({ id: 'episodes', title: 'Episodes' });
    if (data.credits?.cast?.length > 0) tabs.push({ id: 'cast', title: 'Cast & Crew' });
    if (data.recommendations?.results?.length > 0) tabs.push({ id: 'more', title: 'More Like This' });

    navContainer.innerHTML = tabs.map(tab => `<button class="tab-nav-btn" data-tab="${tab.id}">${tab.title}</button>`).join('');
    contentContainer.innerHTML = tabs.map(tab => `<div id="${tab.id}-panel" class="tab-panel"></div>`).join('');

    if (type === 'tv' && data.details.seasons_details?.length > 0) renderSeasonsBrowser(data.details.seasons_details, data.details.id, 'episodes-panel');
    if (data.credits?.cast?.length > 0) renderCastSection(data.credits.cast.slice(0, 18), 'cast-panel');
    if (data.recommendations?.results?.length > 0) renderRecommendations(data.recommendations.results, 'more-panel');

    const navButtons = navContainer.querySelectorAll('.tab-nav-btn');
    const tabPanels = contentContainer.querySelectorAll('.tab-panel');
    navContainer.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') return;
        const targetPanelId = `${e.target.dataset.tab}-panel`;
        navButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        tabPanels.forEach(panel => panel.classList.toggle('active', panel.id === targetPanelId));
    });

    if (navButtons.length > 0) {
        navButtons[0].classList.add('active');
        tabPanels[0].classList.add('active');
    }
}

function renderSeasonsBrowser(seasons, showId, panelId) {
    const container = document.getElementById(panelId);
    if (!container) return;
    const validSeasons = seasons.filter(s => s.season_number > 0 && s.episodes.length > 0);
    container.innerHTML = `<div class="seasons-section"><div class="season-pills-nav">${validSeasons.map((s, i) => `<button class="season-pill" data-season-index="${i}">${s.name}</button>`).join('')}</div><div id="episodes-grid"></div></div>`;
    const pillsNav = container.querySelector('.season-pills-nav');
    const grid = container.querySelector('#episodes-grid');
    const displayEpisodes = (seasonIndex) => {
        pillsNav.querySelectorAll('.season-pill').forEach(pill => pill.classList.toggle('active', pill.dataset.seasonIndex == seasonIndex));
        grid.innerHTML = validSeasons[seasonIndex].episodes.map(ep => `<div class="episode-card"><span class="episode-number">${ep.episode_number}</span><img src="${ep.thumbnail_url}" alt="${ep.name}" class="episode-thumbnail"><div class="episode-info"><h3 class="episode-title">${ep.name}</h3><p class="episode-overview">${ep.overview || 'No description available.'}</p></div><a href="https://www.cineby.app/tv/${showId}/${ep.season_number}/${ep.episode_number}?play=true" target="_blank" class="episode-watch-button" aria-label="Watch Episode">▶</a></div>`).join('');
    };
    pillsNav.addEventListener('click', (e) => { if (e.target.classList.contains('season-pill')) displayEpisodes(e.target.dataset.seasonIndex); });
    if (validSeasons.length > 0) displayEpisodes(0);
}

function renderCastSection(cast, panelId) {
    const container = document.getElementById(panelId);
    if (!container) return;
    container.innerHTML = `<div class="details-grid">${cast.map(person => `<div class="grid-card"><img src="${person.profile_path ? IMAGE_BASE_URL + 'w200' + person.profile_path : 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${person.name}" class="grid-card-img"><h4 class="grid-card-title">${person.name}</h4><p class="grid-card-subtitle">${person.character}</p></div>`).join('')}</div>`;
}

function renderRecommendations(recs, panelId) {
    const container = document.getElementById(panelId);
    if (!container) return;
    container.innerHTML = `<div class="details-grid">${recs.map(item => `<a href="/details.html?id=${item.id}&type=${item.media_type}" class="grid-card" style="text-decoration: none;"><img src="${item.poster_path ? IMAGE_BASE_URL + 'w200' + item.poster_path : 'https://via.placeholder.com/200x300?text=No+Poster'}" alt="${item.title || item.name}" class="grid-card-img"><h4 class="grid-card-title">${item.title || item.name}</h4></a>`).join('')}</div>`;
}

// =====================================================
// 7. WATCHLIST LOGIC
// =====================================================
function setupWatchlistButton(details, type) {
    const btn = document.getElementById('watchlist-btn');
    if (!btn) return;
    let watchlist = getWatchlist();
    const itemId = `${type}-${details.id}`;
    function updateButtonState() {
        const isInWatchlist = watchlist.find(item => item.id === itemId);
        btn.textContent = isInWatchlist ? 'ON MY LIST' : 'ADD TO LIST';
        btn.style.background = isInWatchlist ? 'rgba(255,255,255,0.2)' : 'rgba(30,30,30,0.5)';
    }
    btn.addEventListener('click', () => {
        const itemIndex = watchlist.findIndex(item => item.id === itemId);
        if (itemIndex > -1) watchlist.splice(itemIndex, 1);
        else watchlist.push({ id: itemId, tmdbId: details.id, type, title: details.title || details.name, poster_path: details.poster_path });
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        updateButtonState();
    });
    updateButtonState();
}
function getWatchlist() { return JSON.parse(localStorage.getItem('watchlist') || '[]'); }
function initWatchlistPage() {
    const watchlist = getWatchlist();
    const grid = document.getElementById('watchlist-grid');
    if (grid && watchlist.length > 0) {
        grid.innerHTML = watchlist.map(item => createMediaCard(item, item.type)).join('');
    }
}

// =====================================================
// 8. GLOBAL UI COMPONENTS & HELPERS
// =====================================================
function createMediaCard(item, type) {
    const title = item.title || item.name;
    const id = item.tmdbId || item.id;
    return `<a href="/details.html?id=${id}&type=${type}" class="media-card"><img src="${IMAGE_BASE_URL}w500${item.poster_path}" alt="${title}" loading="lazy"></a>`;
}
function setupHeaderScroll() {
    const header = document.getElementById('main-header');
    if (header) window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 50));
}
function setupIntersectionObserver() {
    const animatedElements = document.querySelectorAll('[data-animation="fade-in-up"]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    animatedElements.forEach(el => observer.observe(el));
}
function setDynamicAccentColor(posterUrl) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = posterUrl;
    img.onload = () => {
        const colorThief = new ColorThief();
        const dominantColor = colorThief.getColor(img);
        document.body.style.setProperty('--color-dynamic-accent', `rgb(${dominantColor.join(',')})`);
    };
}
function setBackdropImage(backdropPath) {
    if (!backdropPath) return;
    const backdropPlaceholder = document.getElementById('backdrop-placeholder');
    const backdropImage = document.getElementById('backdrop-image');
    backdropPlaceholder.style.backgroundImage = `url('${IMAGE_BASE_URL}w500${backdropPath}')`;
    const largeImg = new Image();
    largeImg.src = `${IMAGE_BASE_URL}original${backdropPath}`;
    largeImg.onload = () => {
        backdropImage.style.backgroundImage = `url('${largeImg.src}')`;
        backdropImage.style.opacity = 1;
    };
}
