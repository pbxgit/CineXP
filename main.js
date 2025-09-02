// =================================================================
//                 MEDIA EXPLORER - MAIN JAVASCRIPT (V12 - DEFINITIVE)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('home-page')) {
        initHomepage();
    }
});

/**
 * Robust async data fetcher. Returns null on any failure.
 */
async function fetchData(endpoint, params = '') {
    const url = `/.netlify/functions/get-media?endpoint=${endpoint}${params}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: Status ${response.status}`);
        return response.json();
    } catch (error) {
        console.error(`Fetch Error for "${url}":`, error);
        return null;
    }
}

// =================================================================
//                         HOMEPAGE INITIALIZATION
// =================================================================

async function initHomepage() {
    // Phase 1: Setup UI that doesn't depend on data
    populateHeader();
    initStickyHeader();
    initHeroScrollAnimation();

    // Phase 2: Fetch all data concurrently
    const [trendingMovies, topRatedMovies, popularTv] = await Promise.all([
        fetchData('trending_movies'),
        fetchData('top_rated_movies'),
        fetchData('popular_tv')
    ]);

    // Phase 3: Populate the page with the data we received
    populateHero(trendingMovies);
    await populateMainContent(topRatedMovies, trendingMovies, popularTv);

    // Phase 4: Trigger animations for the newly added content
    document.getElementById('main-content-area')?.classList.add('loaded');
    initScrollFadeIn();
}

async function populateMainContent(topRated, trending, popular) {
    const mainContentArea = document.getElementById('main-content-area');
    if (!mainContentArea) return;

    const marqueeHtml = await buildMarqueeSection(topRated);
    const trendingShelfHtml = buildShelf('trending-shelf', trending, 'Trending Movies');
    const popularShelfHtml = buildShelf('popular-shelf', popular, 'Popular TV Shows');

    mainContentArea.innerHTML = `
        <div class="container">
            ${marqueeHtml}
            ${trendingShelfHtml}
            ${popularShelfHtml}
        </div>
    `;
}

// =================================================================
//                 UI & ANIMATION CONTROLLERS
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
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
}

function initHeroScrollAnimation() {
    const hero = document.getElementById('hero-section');
    if (!hero) return;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const scale = 1 + scrollY / 2000; // Gently zoom in as you scroll
        const opacity = Math.max(0, 1 - scrollY / 500); // Fade out faster
        hero.style.transform = `scale(${scale})`;
        hero.style.opacity = opacity;
    }, { passive: true });
}

function initScrollFadeIn() {
    const shelves = document.querySelectorAll('.media-shelf');
    if (shelves.length === 0) return;
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
//               CONTENT POPULATION & HTML BUILDERS
// =================================================================

async function populateHero(trendingMovies) {
    const sliderWrapper = document.getElementById('hero-slider-wrapper');
    const contentContainer = document.getElementById('hero-content-container');
    if (!sliderWrapper || !contentContainer || !trendingMovies?.results) return;

    const heroMediaIds = trendingMovies.results.slice(0, 5).map(m => ({ id: m.id, type: 'movie' }));
    const heroDetailedData = (await Promise.all(heroMediaIds.map(item => fetchData('details', `&type=${item.type}&id=${item.id}`)))).filter(Boolean);

    if (heroDetailedData.length === 0) return;

    sliderWrapper.innerHTML = heroDetailedData.map(createHeroBackground).join('');
    contentContainer.innerHTML = heroDetailedData.map(createHeroContent).join('');
    
    const contentSlides = contentContainer.querySelectorAll('.hero-content');
    new Swiper('#hero-slider', {
        loop: true, effect: 'fade', speed: 1000, autoplay: { delay: 7000 },
        on: { slideChange: function() { contentSlides.forEach((s, i) => s.classList.toggle('is-active', i === this.realIndex)); } }
    });
    contentSlides[0]?.classList.add('is-active');
}

async function buildMarqueeSection(top10List) {
    if (!top10List?.results?.length) return '';
    const headlinerData = await fetchData('details', `&type=movie&id=${top10List.results[0].id}`);
    if (!headlinerData) return '';
    return `<section class="marquee-section">${createMarqueeComponent(headlinerData, top10List.results.slice(1))}</section>`;
}

function buildShelf(shelfId, mediaList, title) {
    if (!mediaList?.results?.length) return '';
    const cardsHtml = mediaList.results.map(createMediaCard).join('');
    return `<section id="${shelfId}" class="media-shelf"><h2 class="shelf-title">${title}</h2><div class="media-scroller"><div class="media-scroller-inner">${cardsHtml}</div></div></section>`;
}

const createHeroBackground = (data) => `<div class="swiper-slide"><div class="hero-slide-background" style="background-image: url('https://image.tmdb.org/t/p/original${data.details.backdrop_path}')"></div></div>`;

const createHeroContent = (data) => {
    const { details, logoUrl } = data;
    const title = logoUrl ? `<img src="${logoUrl}" alt="${details.title}" class="hero-logo">` : `<h2 class="hero-title-fallback">${details.title}</h2>`;
    return `<div class="hero-content">${title}<p class="hero-overview">${details.overview}</p><a href="/details.html?type=movie&id=${details.id}" class="hero-cta">View Details</a></div>`;
};

const createMarqueeComponent = (headlinerData, shortlist) => {
    const { details, logoUrl } = headlinerData;
    const headlinerTitle = logoUrl ? `<img src="${logoUrl}" alt="${details.title}" class="headliner-logo">` : `<h2>${details.title}</h2>`;
    const shortlistHtml = shortlist.map((item, i) => `
        <a href="/details.html?type=movie&id=${item.id}" class="shortlist-item">
            <span class="shortlist-rank">${i + 2}</span>
            <span class="shortlist-title-text">${item.title}</span>
            <img src="https://image.tmdb.org/t/p/w92${item.poster_path}" class="shortlist-poster-peek" loading="lazy">
        </a>`).join('');
    return `<a href="/details.html?type=movie&id=${details.id}" class="marquee-headliner"><img src="https://image.tmdb.org/t/p/w1280${details.backdrop_path}" class="headliner-backdrop" loading="lazy"><div class="headliner-content">${headlinerTitle}<p class="headliner-overview">${details.overview}</p></div></a><div class="marquee-shortlist"><h3 class="shortlist-title">Top 10 This Week</h3>${shortlistHtml}</div>`;
};

const createMediaCard = (media) => {
    const posterPath = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : '';
    return `<a href="/details.html?type=${media.title ? 'movie' : 'tv'}&id=${media.id}" class="media-card"><img src="${posterPath}" loading="lazy"></a>`;
};
