/*
=====================================================
Personal Media Explorer - Main JavaScript File
(Final Version with Seamless Skeletons)
=====================================================
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

// =====================================================
// 4. HOME PAGE LOGIC (with Skeleton Handling)
// =====================================================
async function initHomePage() {
const [trendingMoviesResponse, popularTV, topRatedMovies] = await Promise.all([
fetchFromAPI({ endpoint: 'trending_movies' }),
fetchFromAPI({ endpoint: 'popular_tv' }),
fetchFromAPI({ endpoint: 'top_rated_movies' })
]);

// --- HERO SLIDER LOGIC ---
const heroSkeleton = document.getElementById('hero-skeleton');
if (trendingMoviesResponse && trendingMoviesResponse.results) {
const heroMoviesData = trendingMoviesResponse.results.slice(0, 5);
const heroMovieDetailsPromises = heroMoviesData.map(movie =>
fetchFromAPI({ endpoint: 'details', type: 'movie', id: movie.id })
);
const heroMovieDetails = await Promise.all(heroMovieDetailsPromises);

setupHeroSlider(heroMovieDetails);
if (heroSkeleton) heroSkeleton.style.display = 'none';

populateShelf('trending-shelf', trendingMoviesResponse.results, 'movie');
} else {
if (heroSkeleton) heroSkeleton.innerHTML = "<p style='text-align:center; padding: 20vh 0;'>Could not load featured content.</p>";
}

// --- SHELVES LOGIC ---
if (topRatedMovies) populateTop10Shelf(topRatedMovies.results.slice(0, 10));
if (popularTV) populateShelf('popular-shelf', popularTV.results, 'tv');

// --- SEAMLESS TRANSITION LOGIC ---
document.body.classList.add('loaded'); // Add 'loaded' class to trigger CSS transitions
const shelvesSkeleton = document.getElementById('shelves-skeleton');
if(shelvesSkeleton) {
// Remove skeleton from DOM after the fade-out transition is complete
setTimeout(() => {
shelvesSkeleton.remove();
}, 500); // Must match the CSS transition duration
}
}

function setupHeroSlider(slidesData) {
const wrapper = document.getElementById('hero-slider-wrapper');
if (!wrapper) return;
wrapper.innerHTML += slidesData.map(data => { // Note the '+=' to append after the skeleton
if (!data || !data.details) return '';
const { details, logoUrl } = data;
const detailsUrl = `/details.html?id=${details.id}&type=movie`;
const titleElement = logoUrl
? `<img src="${logoUrl}" alt="${details.title} Logo" class="hero-slide-logo">`
: `<h1 class="hero-slide-title-fallback">${details.title}</h1>`;
return `
<div class="swiper-slide hero-slide" style="background-image: url('${IMAGE_BASE_URL}original${details.backdrop_path}');">
<a href="${detailsUrl}" class="hero-link" style="text-decoration: none; display:block; width:100%; height:100%;">
<div class="hero-slide-content">
${titleElement}
<span class="hero-cta-button">View Details</span>
</div>
</a>
</div>`;
}).join('');
new Swiper('.hero-slider', {
loop: true,
autoplay: { delay: 6000, disableOnInteraction: false },
effect: 'fade',
fadeEffect: { crossFade: true },
});
}

function populateTop10Shelf(items) {
const shelf = document.getElementById('top-10-shelf');
if (!shelf) return;
shelf.innerHTML = `<h2 class="shelf-title">Top 10 Movies This Week</h2><div class="media-scroller"><div class="media-scroller-inner">${items.map((item, index) => `<a href="/details.html?id=${item.id}&type=movie" class="top-ten-card"><span class="top-ten-number">${index + 1}</span><img src="${IMAGE_BASE_URL}w300${item.poster_path}" alt="${item.title}" class="top-ten-poster"></a>`).join('')}</div></div>`;
}

function populateShelf(shelfId, items, type) {
const shelf = document.getElementById(shelfId);
if (!shelf) return;
let title = "Default Title";
if (shelfId === 'trending-shelf') title = "Trending Movies";
if (shelfId === 'popular-shelf') title = "Popular TV Shows";
shelf.innerHTML = `<h2 class="shelf-title">${title}</h2><div class="media-scroller"><div class="media-scroller-inner">${items.map(item => createMediaCard(item, type)).join('')}</div></div>`;
}

// =====================================================
// 5. DETAILS PAGE LOGIC
// =====================================================
async function initDetailsPage() {
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type');
if (!id || !type) { return; }
const data = await fetchFromAPI({ endpoint: 'details', type, id });
if (data && data.details) {
displayDetails(data, type);
}
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
const watchUrl = type === 'movie' ? `https://www.cineby.app/movie/${details.id}?play=true` : `https://www.cineby.app/tv/${details.id}/1/1?play=true`;
mainContent.innerHTML = `<div class="details-content-overlay">${logoUrl ? `<img src="${logoUrl}" alt="${title} Logo" class="media-logo">` : `<h1 class="fallback-title">${title}</h1>`}<div class="details-meta-pills"><span>${year}</span>${runtime ? `<span>${runtime}</span>` : ''}${details.genres.map(g => `<span>${g.name}</span>`).join('')}</div><p class="details-overview">${details.overview}</p><div class="details-buttons"><a href="${watchUrl}" target="_blank" class="btn-primary" style="padding: 0.8rem 2rem; border-radius: 8px; font-weight: bold; cursor: pointer; text-decoration: none;">WATCH</a><button id="watchlist-btn" class="btn-secondary" style="padding: 0.8rem 2rem; border: 1px solid var(--color-border); border-radius: 8px; background-color: rgba(30,30,30,0.5); color: white; font-weight: bold; cursor: pointer;">ADD TO LIST</button></div></div>`;
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
if (navButtons.length > 0) { navButtons[0].classList.add('active'); tabPanels[0].classList.add('active'); }
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
function renderCastSection(cast, panelId) { container = document.getElementById(panelId); if (container) container.innerHTML = `<div class="details-grid">${cast.map(person => `<div class="grid-card"><img src="${person.profile_path ? IMAGE_BASE_URL + 'w200' + person.profile_path : 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${person.name}" class="grid-card-img"><h4 class="grid-card-title">${person.name}</h4><p class="grid-card-subtitle">${person.character}</p></div>`).join('')}</div>`; }
function renderRecommendations(recs, panelId) { container = document.getElementById(panelId); if (container) container.innerHTML = `<div class="details-grid">${recs.map(item => `<a href="/details.html?id=${item.id}&type=${item.media_type}" class="grid-card" style="text-decoration: none;"><img src="${item.poster_path ? IMAGE_BASE_URL + 'w200' + item.poster_path : 'https://via.placeholder.com/200x300?text=No+Poster'}" alt="${item.title || item.name}" class="grid-card-img"><h4 class="grid-card-title">${item.title || item.name}</h4></a>`).join('')}</div>`; }

// =====================================================
// 7. WATCHLIST LOGIC
// =====================================================
function setupWatchlistButton(details, type) { const btn = document.getElementById('watchlist-btn'); if (!btn) return; let watchlist = getWatchlist(); const itemId = `${type}-${details.id}`; function updateButtonState() { const isInWatchlist = watchlist.find(item => item.id === itemId); btn.textContent = isInWatchlist ? 'ON MY LIST' : 'ADD TO LIST'; btn.style.background = isInWatchlist ? 'rgba(255,255,255,0.2)' : 'rgba(30,30,30,0.5)'; } btn.addEventListener('click', () => { const itemIndex = watchlist.findIndex(item => item.id === itemId); if (itemIndex > -1) watchlist.splice(itemIndex, 1); else watchlist.push({ id: itemId, tmdbId: details.id, type, title: details.title || details.name, poster_path: details.poster_path }); localStorage.setItem('watchlist', JSON.stringify(watchlist)); updateButtonState(); }); updateButtonState(); }
function getWatchlist() { return JSON.parse(localStorage.getItem('watchlist') || '[]'); }
function initWatchlistPage() { const watchlist = getWatchlist(); const grid = document.getElementById('watchlist-grid'); if (grid && watchlist.length > 0) { grid.innerHTML = watchlist.map(item => createMediaCard(item, item.type)).join(''); } }

// =====================================================
// 8. GLOBAL UI COMPONENTS & HELPERS
// =====================================================
function createMediaCard(item, type) { const title = item.title || item.name; const id = item.tmdbId || item.id; return `<a href="/details.html?id=${id}&type=${type}" class="media-card"><img src="${IMAGE_BASE_URL}w500${item.poster_path}" alt="${title}" loading="lazy"></a>`; }
function setupHeaderScroll() { const header = document.getElementById('main-header'); if (header) window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 50)); }
function setupIntersectionObserver() { const animatedElements = document.querySelectorAll('[data-animation="fade-in-up"]'); const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.1 }); animatedElements.forEach(el => observer.observe(el)); }
function setDynamicAccentColor(posterUrl) { const img = new Image(); img.crossOrigin = "Anonymous"; img.src = posterUrl; img.onload = () => { try { const colorThief = new ColorThief(); const dominantColor = colorThief.getColor(img); document.body.style.setProperty('--color-dynamic-accent', `rgb(${dominantColor.join(',')})`); } catch (e) { console.error("ColorThief error:", e); } }; }
function setBackdropImage(backdropPath) { if (!backdropPath) return; const backdropPlaceholder = document.getElementById('backdrop-placeholder'); const backdropImage = document.getElementById('backdrop-image'); backdropPlaceholder.style.backgroundImage = `url('${IMAGE_BASE_URL}w500${backdropPath}')`; const largeImg = new Image(); largeImg.src = `${IMAGE_BASE_URL}original${backdropPath}`; largeImg.onload = () => { backdropImage.style.backgroundImage = `url('${largeImg.src}')`; backdropImage.style.opacity = 1; }; }
