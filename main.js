// =================================================================
//                 MEDIA EXPLORER - MAIN JAVASCRIPT (V9 - FINAL)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('home-page')) {
        initHomepage();
    }
});

async function fetchData(endpoint, params = '') {
    const url = `/.netlify/functions/get-media?endpoint=${endpoint}${params}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    } catch (error) {
        console.error(`Failed to fetch data from "${url}":`, error);
        return null;
    }
}

// =================================================================
//                         HOMEPAGE LOGIC (FINAL)
// =================================================================

async function initHomepage() {
    // --- PHASE 1: IMMEDIATE HERO LOAD ---
    initStickyHeader();
    initHeroAnimation();

    const trendingMovies = await fetchData('trending_movies');
    if (trendingMovies && trendingMovies.results.length > 0) {
        const heroMediaIds = trendingMovies.results.slice(0, 5).map(m => ({ id: m.id, type: 'movie' }));
        const heroDetailedData = (await Promise.all(heroMediaIds.map(item => fetchData('details', `&type=${item.type}&id=${item.id}`)))).filter(Boolean);
        populateHero(heroDetailedData);
    } else {
        // Handle case where even the hero fails to load
        document.getElementById('hero-content-container').innerHTML = "<p class='container'>Could not load featured content.</p>";
    }

    // --- PHASE 2: LOAD AND INJECT MAIN CONTENT ---
    // This happens after the hero is already visible and loading
    loadMainContent(trendingMovies);
}

async function loadMainContent(trendingMovies) {
    const mainContentArea = document.getElementById('main-content-area');
    if (!mainContentArea) return;

    // Fetch remaining data
    const [topRatedMovies, popularTv] = await Promise.all([
        fetchData('top_rated_movies'),
        fetchData('popular_tv')
    ]);

    // Build HTML for all sections
    const premiereHtml = await buildPremiereSection(topRatedMovies);
    const trendingShelfHtml = buildShelf('trending-shelf', trendingMovies.results, 'Trending Movies');
    const popularShelfHtml = buildShelf('popular-shelf', popularTv.results, 'Popular TV Shows');
    
    // Inject all content into the main area at once
    mainContentArea.innerHTML = `
        ${premiereHtml}
        <div id="real-shelves-content">
            ${trendingShelfHtml}
            ${popularShelfHtml}
        </div>
    `;

    // Fade in the entire main content area
    mainContentArea.classList.add('loaded');
    
    // Initialize animations for the newly added content
    initScrollFadeIn();
}

// =================================================================
//                         UI INITIALIZATION & ANIMATIONS
// =================================================================

function initStickyHeader() { /* Unchanged */ }
function initHeroAnimation() { /* Unchanged */ }

function initScrollFadeIn() {
    const shelves = document.querySelectorAll('.media-shelf');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, { threshold: 0.1 });
    shelves.forEach(shelf => observer.observe(shelf));
}

// =================================================================
//                         CONTENT POPULATION & BUILDERS
// =================================================================

function populateHero(mediaList) { /* Unchanged */ }

async function buildPremiereSection(top10List) {
    if (!top10List || top10List.results.length === 0) return '';
    const headlinerData = await fetchData('details', `&type=movie&id=${top10List.results[0].id}`);
    if (!headlinerData) return '';
    return `<section id="premiere-section" class="premiere-section container">${createPremiereComponent(headlinerData, top10List.results.slice(1))}</section>`;
}

function buildShelf(shelfId, mediaList, title) {
    if (!mediaList || mediaList.length === 0) return '';
    const cardsHtml = mediaList.map(createMediaCard).join('');
    return `<section id="${shelfId}" class="media-shelf"><h2 class="shelf-title container">${title}</h2><div class="media-scroller"><div class="media-scroller-inner">${cardsHtml}</div></div></section>`;
}

const createHeroBackground = (data) => { /* Unchanged */ }
const createHeroContent = (data) => { /* Unchanged */ }
const createPremiereComponent = (headlinerData, shortlist) => { /* Unchanged */ }
const createMediaCard = (media) => { /* Unchanged */ }

// --- PASTE THE UNCHANGED HELPER FUNCTIONS HERE ---
function initStickyHeader() {
    const header = document.getElementById('main-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
}
function initHeroAnimation() {
    const hero = document.getElementById('hero-section');
    if (!hero) return;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const heroHeight = hero.offsetHeight;
        if (scrollY < heroHeight) {
            const scale = 1 - (scrollY / (heroHeight * 4));
            const blur = (scrollY / heroHeight) * 10;
            hero.style.transform = `scale(${scale})`;
            hero.style.filter = `blur(${blur}px)`;
            hero.style.opacity = 1 - (scrollY / (heroHeight * 0.9));
        }
    }, { passive: true });
}
function populateHero(mediaList) {
    const sliderWrapper = document.getElementById('hero-slider-wrapper');
    const contentContainer = document.getElementById('hero-content-container');
    if (!sliderWrapper || !contentContainer || mediaList.length === 0) return;
    sliderWrapper.innerHTML = mediaList.map(createHeroBackground).join('');
    contentContainer.innerHTML = mediaList.map(createHeroContent).join('');
    const contentSlides = contentContainer.querySelectorAll('.hero-content');
    new Swiper('#hero-slider', {
        loop: true, effect: 'fade', speed: 1000, autoplay: { delay: 7000 },
        on: { slideChange: function() { contentSlides.forEach((s, i) => s.classList.toggle('is-active', i === this.realIndex)); } }
    });
    contentSlides[0]?.classList.add('is-active');
}
const createHeroBackground = (data) => `<div class="swiper-slide"><div class="hero-slide-background" style="background-image: url('https://image.tmdb.org/t/p/original${data.details.backdrop_path}')"></div></div>`;
const createHeroContent = (data) => {
    const { details, logoUrl } = data;
    const title = logoUrl ? `<img src="${logoUrl}" alt="${details.title}" class="hero-logo">` : `<h2 class="hero-title-fallback">${details.title}</h2>`;
    return `<div class="hero-content">${title}<p class="hero-overview">${details.overview}</p><a href="/details.html?type=movie&id=${details.id}" class="hero-cta">View Details</a></div>`;
};
const createPremiereComponent = (headlinerData, shortlist) => {
    const { details, logoUrl } = headlinerData;
    const headlinerTitle = logoUrl ? `<img src="${logoUrl}" alt="${details.title}" class="headliner-logo">` : `<h2>${details.title}</h2>`;
    const shortlistHtml = shortlist.map((item, i) => `
        <a href="/details.html?type=movie&id=${item.id}" class="shortlist-item">
            <span class="shortlist-rank">${i + 2}</span>
            <span class="shortlist-title-text">${item.title}</span>
            <img src="https://image.tmdb.org/t/p/w92${item.poster_path}" class="shortlist-poster-peek" loading="lazy">
        </a>`).join('');
    return `<div class="premiere-headliner"><img src="https://image.tmdb.org/t/p/w1280${details.backdrop_path}" class="headliner-backdrop" loading="lazy"><div class="headliner-content">${headlinerTitle}<p class="headliner-overview">${details.overview}</p></div></div><div class="premiere-shortlist"><h3 class="shortlist-title">Top 10 This Week</h3>${shortlistHtml}</div>`;
};
const createMediaCard = (media) => {
    return `<a href="/details.html?type=${media.title ? 'movie' : 'tv'}&id=${media.id}" class="media-card"><img src="https://image.tmdb.org/t/p/w500${media.poster_path}" loading="lazy"></a>`;
};
