// =================================================================
//                 MEDIA EXPLORER - MAIN JAVASCRIPT (V8 - PREMIERE)
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
        return null; // Return null for robust error handling
    }
}

// =================================================================
//                         HOMEPAGE LOGIC (PREMIERE)
// =================================================================

async function initHomepage() {
    initStickyHeader();
    initHeroAnimation();

    const [topRatedMovies, trendingMovies, popularTv] = await Promise.all([
        fetchData('top_rated_movies'),
        fetchData('trending_movies'),
        fetchData('popular_tv')
    ]);

    if (!topRatedMovies || !trendingMovies) {
        document.getElementById('content-skeleton').innerHTML = "<p class='container' style='padding: 2rem 0;'>Could not load content. Please try again later.</p>";
        return;
    }

    const heroMediaIds = trendingMovies.results.slice(0, 5).map(m => ({ id: m.id, type: 'movie' }));
    const heroDetailedData = (await Promise.all(heroMediaIds.map(item => fetchData('details', `&type=${item.type}&id=${item.id}`)))).filter(Boolean);

    populateHero(heroDetailedData);
    populatePremiere(topRatedMovies.results.slice(0, 10));
    if (popularTv) populateShelf('trending-shelf', popularTv.results, 'Popular TV Shows');
    populateShelf('popular-shelf', trendingMovies.results, 'Trending Movies');
    
    // Animate in the content
    document.getElementById('content-skeleton').style.display = 'none';
    document.body.classList.add('loaded');
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

function initHeroAnimation() {
    const hero = document.getElementById('hero-section');
    if (!hero) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const heroHeight = hero.offsetHeight;
        if (scrollY < heroHeight) {
            const scale = 1 - (scrollY / (heroHeight * 4)); // Subtle scale
            const blur = (scrollY / heroHeight) * 10; // Blur up to 10px
            hero.style.transform = `scale(${scale})`;
            hero.style.filter = `blur(${blur}px)`;
            hero.style.opacity = 1 - (scrollY / (heroHeight * 0.9));
        }
    }, { passive: true });
}

function initScrollFadeIn() {
    const shelves = document.querySelectorAll('.media-shelf');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });
    shelves.forEach(shelf => observer.observe(shelf));
}

// =================================================================
//                         CONTENT POPULATION
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

async function populatePremiere(top10List) {
    const section = document.getElementById('premiere-section');
    if (!section || top10List.length === 0) return;

    const headlinerData = await fetchData('details', `&type=movie&id=${top10List[0].id}`);
    if (!headlinerData) return;

    section.innerHTML = createPremiereComponent(headlinerData, top10List.slice(1));
}

function populateShelf(shelfId, mediaList, title) {
    const shelf = document.getElementById(shelfId);
    if (!shelf || !mediaList) return;
    const cardsHtml = mediaList.map(createMediaCard).join('');
    shelf.innerHTML = `<h2 class="shelf-title container">${title}</h2><div class="media-scroller"><div class="media-scroller-inner">${cardsHtml}</div></div>`;
}

// =================================================================
//                      HTML COMPONENT BUILDERS
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

    return `
        <a href="/details.html?type=movie&id=${details.id}" class="premiere-headliner">
            <img src="https://image.tmdb.org/t/p/w1280${details.backdrop_path}" class="headliner-backdrop" loading="lazy">
            <div class="headliner-content">
                ${headlinerTitle}
                <p class="headliner-overview">${details.overview}</p>
            </div>
        </a>
        <div class="premiere-shortlist">
            <h3 class="shortlist-title">Top 10 This Week</h3>
            ${shortlistHtml}
        </div>`;
};

const createMediaCard = (media) => {
    return `<a href="/details.html?type=${media.title ? 'movie' : 'tv'}&id=${media.id}" class="media-card"><img src="https://image.tmdb.org/t/p/w500${media.poster_path}" loading="lazy"></a>`;
};
