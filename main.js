// =================================================================
//                 MEDIA EXPLORER - MAIN JAVASCRIPT (V11 - ROBUST)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // We only need to initialize the homepage logic.
    if (document.body.classList.contains('home-page')) {
        initHomepage();
    }
});

/**
 * A robust, async function to fetch data from a Netlify function.
 * Returns null if the fetch fails for any reason.
 */
async function fetchData(endpoint, params = '') {
    const url = `/.netlify/functions/get-media?endpoint=${endpoint}${params}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            // This will be caught by the catch block
            throw new Error(`API Error: Status ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`Failed to fetch data from "${url}":`, error);
        // Return null to allow the calling function to handle the error gracefully.
        return null;
    }
}

// =================================================================
//                         HOMEPAGE LOGIC (ROBUST)
// =================================================================

async function initHomepage() {
    // --- Phase 1: Setup UI animations immediately ---
    initStickyHeader();
    initHeroScrollAnimation();

    // --- Phase 2: Load hero content first for a fast initial impression ---
    const trendingMovies = await fetchData('trending_movies');
    
    // Graceful check: even if trending fails, we don't crash.
    if (trendingMovies && trendingMovies.results) {
        const heroMediaIds = trendingMovies.results.slice(0, 5).map(m => ({ id: m.id, type: 'movie' }));
        const heroDetailedDataPromises = heroMediaIds.map(item => fetchData('details', `&type=${item.type}&id=${item.id}`));
        const heroDetailedData = (await Promise.all(heroDetailedDataPromises)).filter(Boolean); // Filter out any nulls from failed fetches
        
        populateHero(heroDetailedData);
    } else {
        // If the primary hero data fails, show an error inside the hero. The rest of the page can still load.
        const heroContent = document.getElementById('hero-content-container');
        if (heroContent) heroContent.innerHTML = `<div class='container'><p>Could not load featured content.</p></div>`;
    }

    // --- Phase 3: Asynchronously load and inject the rest of the main content ---
    loadAndInjectMainContent(trendingMovies);
}

/**
 * Loads all data for the main content area, builds the HTML, and injects it into the DOM.
 */
async function loadAndInjectMainContent(trendingMovies) {
    const realContentContainer = document.getElementById('real-content');
    if (!realContentContainer) return;

    // Fetch remaining data concurrently
    const [topRatedMovies, popularTv] = await Promise.all([
        fetchData('top_rated_movies'),
        fetchData('popular_tv')
    ]);

    // Build the HTML for each section, with robust checks to ensure they handle failed data.
    const premiereHtml = await buildPremiereSection(topRatedMovies);
    const trendingShelfHtml = buildShelf('trending-shelf', trendingMovies, 'Trending Movies');
    const popularShelfHtml = buildShelf('popular-shelf', popularTv, 'Popular TV Shows');

    // Inject the fully constructed HTML into the DOM.
    realContentContainer.innerHTML = `
        ${premiereHtml}
        <div id="real-shelves-content">
            ${trendingShelfHtml}
            ${popularShelfHtml}
        </div>
    `;

    // Add the 'loaded' class to smoothly fade in the content.
    realContentContainer.classList.add('loaded');
    
    // Initialize animations for the newly injected elements.
    initScrollFadeIn();
}

// =================================================================
//                         UI INITIALIZATION & ANIMATIONS
// =================================================================

function initStickyHeader() {
    const header = document.getElementById('main-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
}

function initHeroScrollAnimation() {
    const hero = document.getElementById('hero-container');
    if (!hero) return;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        // This simpler, more robust animation just fades the hero out as you scroll down.
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
//                         CONTENT BUILDERS (ROBUST)
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
    if (contentSlides.length > 0) contentSlides[0].classList.add('is-active');
}

async function buildPremiereSection(top10List) {
    // ROBUSTNESS CHECK: If top10List is null or has no results, return an empty string.
    if (!top10List || !top10List.results || top10List.results.length === 0) {
        return '';
    }
    
    const headlinerData = await fetchData('details', `&type=movie&id=${top10List.results[0].id}`);
    
    // ROBUSTNESS CHECK: If the detailed fetch for the headliner fails, still return empty.
    if (!headlinerData) {
        return '';
    }
    
    return `<section class="premiere-section container">${createPremiereComponent(headlinerData, top10List.results.slice(1))}</section>`;
}

function buildShelf(shelfId, mediaList, title) {
    // ROBUSTNESS CHECK: If mediaList is null or has no results, return an empty string.
    if (!mediaList || !mediaList.results || mediaList.results.length === 0) {
        return '';
    }

    const cardsHtml = mediaList.results.map(createMediaCard).join('');
    return `<section id="${shelfId}" class="media-shelf"><h2 class="shelf-title container">${title}</h2><div class="media-scroller"><div class="media-scroller-inner">${cardsHtml}</div></div></section>`;
}

// =================================================================
//                      HTML COMPONENT STRINGS
// =================================================================

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
    return `<div class="premiere-headliner"><a href="/details.html?type=movie&id=${details.id}"><img src="https://image.tmdb.org/t/p/w1280${details.backdrop_path}" class="headliner-backdrop" loading="lazy"></a><div class="headliner-content">${headlinerTitle}<p class="headliner-overview">${details.overview}</p></div></div><div class="premiere-shortlist"><h3 class="shortlist-title">Top 10 This Week</h3>${shortlistHtml}</div>`;
};

const createMediaCard = (media) => {
    const posterPath = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : '';
    return `<a href="/details.html?type=${media.title ? 'movie' : 'tv'}&id=${media.id}" class="media-card"><img src="${posterPath}" loading="lazy"></a>`;
};
