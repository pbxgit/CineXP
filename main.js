// =================================================================
//                 MEDIA EXPLORER - MAIN JAVASCRIPT (V7 - DEFINITIVE)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('home-page')) {
        initHomepage();
    }
});

async function fetchData(endpoint, params = '') { /* (No changes needed) */ }

// =================================================================
//                         HOMEPAGE LOGIC (DEFINITIVE)
// =================================================================

async function initHomepage() {
    // Setup global UI elements and animations
    const mainHeader = document.getElementById('main-header');
    if (mainHeader) initStickyHeader(mainHeader);
    initHeroScrollAnimation();

    // Fetch all data concurrently for performance
    const [trendingMovies, topRatedMovies, popularTv] = await Promise.all([
        fetchData('trending_movies'),
        fetchData('top_rated_movies'),
        fetchData('popular_tv')
    ]);

    // Gracefully handle API failures
    if (!trendingMovies || !topRatedMovies) {
        document.getElementById('content-skeleton').innerHTML = "<p style='padding-top: 100vh; text-align: center;'>Could not load content. Please try again later.</p>";
        return;
    }

    // Fetch detailed data for hero slides
    const heroMediaIds = trendingMovies.results.slice(0, 5).map(m => ({ id: m.id, type: 'movie' }));
    const heroDetailedData = (await Promise.all(heroMediaIds.map(item => fetchData('details', `&type=${item.type}&id=${item.id}`)))).filter(Boolean);

    // Populate the UI
    populateHero(heroDetailedData);
    populateMarquee(topRatedMovies.results.slice(0, 10)); // Use top rated for the Marquee
    if (popularTv) populateShelf('trending-shelf', popularTv.results, 'standard', 'Popular TV Shows');
    populateShelf('popular-shelf', trendingMovies.results, 'standard', 'Trending Movies');

    // Reveal content
    document.getElementById('content-skeleton').style.display = 'none';
    document.body.classList.add('loaded');
    
    initHorizontalScrollAnimations();
}

function initStickyHeader(headerElement) { /* (No changes needed) */ }

function initHeroScrollAnimation() {
    const heroContainer = document.getElementById('hero-container');
    const heroContent = document.getElementById('hero-content-container');
    if (!heroContainer || !heroContent) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                const heroHeight = heroContainer.clientHeight;
                const scrollFraction = scrollY / (heroHeight * 0.75); // Animate over 75% of hero height

                if (scrollY < heroHeight) {
                    const scale = Math.max(0.9, 1 - scrollFraction * 0.1);
                    const opacity = Math.max(0, 1 - scrollFraction * 1.5);
                    
                    heroContainer.style.transform = `scale(${scale})`;
                    heroContainer.style.opacity = opacity;
                    heroContent.style.opacity = Math.max(0, 1 - scrollFraction * 3);
                }
                ticking = false;
            });
            ticking = true;
        }
    });
}

function populateHero(mediaList) { /* (Same logic as V6, but simplified) */ }
function populateMarquee(top10List) {
    const marqueeSection = document.getElementById('marquee-section');
    if (!marqueeSection || top10List.length === 0) return;

    const featureItem = top10List[0];
    const otherItems = top10List.slice(1);

    // Fetch detailed data for the feature item to get its logo
    fetchData('details', `&type=movie&id=${featureItem.id}`).then(details => {
        marqueeSection.innerHTML = createMarquee(details, otherItems);
    });
}
function populateShelf(shelfId, mediaList, cardType, title) { /* (Simplified) */ }
function initHorizontalScrollAnimations() { /* (No changes needed) */ }


// =================================================================
//                      COMPONENT FUNCTIONS (DEFINITIVE)
// =================================================================
const createMarquee = (featureDetails, otherItems) => {
    const { details, logoUrl } = featureDetails;
    const featureBackdrop = `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`;
    const logoEl = logoUrl ? `<img src="${logoUrl}" alt="${details.title}">` : `<h2>${details.title}</h2>`;

    const otherItemsHtml = otherItems.map((item, index) => `
        <a href="/details.html?type=movie&id=${item.id}" class="marquee-card">
            <span class="marquee-card-rank">${index + 2}</span>
            <img src="https://image.tmdb.org/t/p/w92${item.poster_path}" alt="${item.title}" class="marquee-card-poster">
            <span class="marquee-card-title">${item.title}</span>
        </a>
    `).join('');

    return `
        <a href="/details.html?type=movie&id=${details.id}" class="marquee-feature">
            <img src="${featureBackdrop}" class="marquee-backdrop" loading="lazy">
            <div class="marquee-feature-content">
                ${logoEl}
                <p>${details.overview}</p>
            </div>
        </a>
        <div class="marquee-list">
            <h3>Top 10 This Week</h3>
            ${otherItemsHtml}
        </div>
    `;
};

// Paste the other required functions below, many are simplified or unchanged
function populateHero(mediaList) {
    const sliderWrapper = document.getElementById('hero-slider-wrapper');
    const contentContainer = document.getElementById('hero-content-container');
    if (!sliderWrapper || !contentContainer) return;
    sliderWrapper.innerHTML = mediaList.map(d => `<div class="swiper-slide"><div class="hero-slide-background" style="background-image: url('https://image.tmdb.org/t/p/original${d.details.backdrop_path}');"></div></div>`).join('');
    contentContainer.innerHTML = mediaList.map(createHeroContent).join('');
    const contentSlides = contentContainer.querySelectorAll('.hero-content');
    const heroSwiper = new Swiper('#hero-background-slider', {
        loop: true, effect: 'fade', fadeEffect: { crossFade: true }, autoplay: { delay: 8000 }, speed: 1500,
        on: { slideChange: function () { contentSlides.forEach((s, i) => s.classList.toggle('is-active', i === this.realIndex)); } }
    });
    if (contentSlides.length > 0) contentSlides[0].classList.add('is-active');
}

const createHeroContent = (mediaData) => {
    const { details, logoUrl } = mediaData;
    const titleElement = logoUrl ? `<img src="${logoUrl}" alt="${details.title || details.name}" class="hero-slide-logo">` : `<h2 class="hero-slide-title-fallback">${details.title || details.name}</h2>`;
    return `<div class="hero-content">${titleElement}<p class="hero-slide-overview">${details.overview}</p><a href="/details.html?type=${details.title ? 'movie' : 'tv'}&id=${details.id}" class="hero-cta-button"><span>&#9654;</span> View Details</a></div>`;
};

function populateShelf(shelfId, mediaList, cardType, title) {
    const shelfElement = document.getElementById(shelfId);
    if (!shelfElement || !mediaList) return;
    const scrollerContent = mediaList.map(media => createMediaCard(media)).join('');
    shelfElement.innerHTML = `<h2 class="shelf-title container">${title}</h2><div class="media-scroller-container"><div class="media-scroller"><div class="media-scroller-inner">${scrollerContent}</div></div></div>`;
}

const createMediaCard = (media) => {
    const posterUrl = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : '';
    return `<a href="/details.html?type=${media.title ? 'movie' : 'tv'}&id=${media.id}" class="media-card" title="${media.title || media.name}"><img src="${posterUrl}" alt="${media.title || media.name}" loading="lazy"></a>`;
};

function initHorizontalScrollAnimations() {
    const scrollers = document.querySelectorAll('.standard-shelf .media-scroller');
    scrollers.forEach(scroller => {
        const cards = scroller.querySelectorAll('.media-card');
        if (cards.length === 0) return;
        let ticking = false;
        const update = () => {
            const center = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;
            cards.forEach(card => {
                const cardRect = card.getBoundingClientRect();
                if (cardRect.width === 0) return;
                const dist = center - (cardRect.left + cardRect.width / 2);
                const norm = dist / (scroller.clientWidth / 2);
                const rot = norm * 25;
                const scale = 1 - Math.abs(norm) * 0.15;
                const op = 1 - Math.abs(norm) * 0.5;
                card.style.transform = `scale(${scale}) rotateY(${rot}deg)`;
                card.style.opacity = op;
            });
            ticking = false;
        };
        scroller.addEventListener('scroll', () => { if (!ticking) { window.requestAnimationFrame(update); ticking = true; } });
        update();
    });
}
async function fetchData(endpoint, params = '') {
    const url = `/.netlify/functions/get-media?endpoint=${endpoint}${params}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    } catch (error) { console.error(`Failed to fetch data from "${url}":`, error); return null; }
}
function initStickyHeader(headerElement) { window.addEventListener('scroll', () => { headerElement.classList.toggle('scrolled', window.scrollY > 10); }); }
