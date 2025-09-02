// =================================================================
//                 MEDIA EXPLORER - MAIN JAVASCRIPT (V10 - FINAL)
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
    // --- PHASE 1: IMMEDIATE SETUP ---
    initStickyHeader();
    initHeroScrollAnimation();
    populateHeader(); // New function to ensure header is always there

    // --- PHASE 2: LOAD HERO CONTENT ---
    const trendingMovies = await fetchData('trending_movies');
    if (trendingMovies && trendingMovies.results.length > 0) {
        const heroMediaIds = trendingMovies.results.slice(0, 5).map(m => ({ id: m.id, type: 'movie' }));
        const heroDetailedData = (await Promise.all(heroMediaIds.map(item => fetchData('details', `&type=${item.type}&id=${item.id}`)))).filter(Boolean);
        populateHero(heroDetailedData);
    } else {
        document.getElementById('hero-content-container').innerHTML = "<div class='container'><p>Could not load featured content.</p></div>";
    }

    // --- PHASE 3: LOAD AND INJECT MAIN CONTENT (AFTER HERO) ---
    loadAndInjectMainContent(trendingMovies);
}

async function loadAndInjectMainContent(trendingMovies) {
    const realContentContainer = document.getElementById('real-content');
    if (!realContentContainer) return;

    const [topRatedMovies, popularTv] = await Promise.all([
        fetchData('top_rated_movies'),
        fetchData('popular_tv')
    ]);

    const premiereHtml = await buildPremiereSection(topRatedMovies);
    const trendingShelfHtml = buildShelf('trending-shelf', trendingMovies.results, 'Trending Movies');
    const popularShelfHtml = buildShelf('popular-shelf', popularTv.results, 'Popular TV Shows');
    
    realContentContainer.innerHTML = `
        ${premiereHtml}
        <div id="real-shelves-content">
            ${trendingShelfHtml}
            ${popularShelfHtml}
        </div>
    `;

    // Fade in the content and initialize its animations
    realContentContainer.classList.add('loaded');
    initScrollFadeIn();
}

// =================================================================
//                         UI INITIALIZATION & ANIMATIONS
// =================================================================

function populateHeader() {
    const header = document.getElementById('main-header');
    if (header) {
        header.innerHTML = `
            <nav class="main-nav container">
                <a href="/" class="logo"><strong>EXPLORER</strong></a>
                <div class="nav-links">
                    <a href="/" aria-current="page">Home</a>
                    <a href="/watchlist.html">Watchlist</a>
                </div>
            </nav>
        `;
    }
}

function initStickyHeader() {
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
}

function initHeroScrollAnimation() {
    const hero = document.getElementById('hero-container');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        // Fade out the hero container as user scrolls down
        hero.style.opacity = Math.max(0, 1 - (scrollY / (window.innerHeight * 0.75)));
    }, { passive: true });
}

function initScrollFadeIn() {
    const shelves = document.querySelectorAll('.media-shelf');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    shelves.forEach(shelf => observer.observe(shelf));
}

// =================================================================
//                         CONTENT POPULATION & BUILDERS
// =================================================================

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

async function buildPremiereSection(top10List) {
    if (!top10List || !top10List.results || top10List.results.length === 0) return '';
    const headlinerData = await fetchData('details', `&type=movie&id=${top10List.results[0].id}`);
    if (!headlinerData) return '';
    return `<section class="premiere-section container">${createPremiereComponent(headlinerData, top10List.results.slice(1))}</section>`;
}

function buildShelf(shelfId, mediaList, title) {
    if (!mediaList || mediaList.length === 0) return '';
    const cardsHtml = mediaList.map(createMediaCard).join('');
    return `<section id="${shelfId}" class="media-shelf"><h2 class="shelf-title container">${title}</h2><div class="media-scroller"><div class="media-scroller-inner">${cardsHtml}</div></div></section>`;
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
