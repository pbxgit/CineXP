// =================================================================
//                 MEDIA EXPLORER - MAIN JAVASCRIPT (V6 - DEFINITIVE)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const mainHeader = document.getElementById('main-header');
    if (mainHeader) initStickyHeader(mainHeader);

    if (document.body.classList.contains('home-page')) {
        initHomepage();
    }
});

function initStickyHeader(headerElement) {
    window.addEventListener('scroll', () => {
        headerElement.classList.toggle('scrolled', window.scrollY > 10);
    });
}

async function fetchData(endpoint, params = '') {
    const url = `/.netlify/functions/get-media?endpoint=${endpoint}${params}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    } catch (error) {
        console.error(`Failed to fetch data from "${url}":`, error);
        return null;
    }
}

// =================================================================
//                         HOMEPAGE LOGIC (DEFINITIVE)
// =================================================================

async function initHomepage() {
    // 1. Fetch initial list of trending movies
    const trendingMovies = await fetchData('trending_movies');
    if (!trendingMovies || !trendingMovies.results || trendingMovies.results.length === 0) {
        document.getElementById('content-skeleton').innerHTML = "<p style='padding: 5rem; text-align: center;'>Could not load content. Please try again later.</p>";
        return;
    }

    // 2. Fetch DETAILED data for the top 5 hero items
    const heroMediaIds = trendingMovies.results.slice(0, 5).map(m => ({ id: m.id, type: 'movie' }));
    const heroDetailedDataPromises = heroMediaIds.map(item => fetchData('details', `&type=${item.type}&id=${item.id}`));
    let heroDetailedData = (await Promise.all(heroDetailedDataPromises)).filter(Boolean);

    // 3. Populate Hero and Spotlight
    populateHero(heroDetailedData);
    if (heroDetailedData.length > 0) {
        populateSpotlight(heroDetailedData[0]);
    }

    // 4. Fetch data for shelves
    const [top10Data, popularTvData] = await Promise.all([
        fetchData('top_rated_movies'),
        fetchData('popular_tv')
    ]);

    // 5. Populate shelves
    if (top10Data) populateShelf('top-10-shelf', top10Data.results.slice(0, 10), 'top-ten', 'Top 10 Movies This Week');
    populateShelf('trending-shelf', trendingMovies.results, 'standard', 'Trending Movies');
    if (popularTvData) populateShelf('popular-shelf', popularTvData.results, 'standard', 'Popular TV Shows');

    // 6. Reveal content and init animations
    document.getElementById('content-skeleton').style.display = 'none';
    document.body.classList.add('loaded');
    
    initScrollAnimations();
    initHorizontalScrollAnimations();
}

function populateHero(mediaList) {
    const sliderWrapper = document.getElementById('hero-slider-wrapper');
    const contentContainer = document.getElementById('hero-content-container');
    if (!sliderWrapper || !contentContainer) return;

    sliderWrapper.innerHTML = mediaList.map(createHeroBackgroundSlide).join('');
    contentContainer.innerHTML = mediaList.map(createHeroContent).join('');

    const contentSlides = contentContainer.querySelectorAll('.hero-content');
    
    const heroSwiper = new Swiper('#hero-background-slider', {
        loop: true,
        effect: 'fade',
        fadeEffect: { crossFade: true },
        autoplay: { delay: 8000, disableOnInteraction: false },
        speed: 1500,
        on: {
            slideChange: function () {
                contentSlides.forEach((slide, index) => {
                    slide.classList.toggle('is-active', index === this.realIndex);
                });
            }
        }
    });

    // Manually activate the first content slide
    if (contentSlides.length > 0) {
        contentSlides[0].classList.add('is-active');
    }
}

function populateSpotlight(mediaData) { /* (Same as previous version) */ }
function populateShelf(shelfId, mediaList, cardType, title) { /* (Same as previous version) */ }
function initScrollAnimations() { /* (Same as previous version) */ }
function initHorizontalScrollAnimations() { /* (Same as previous version) */ }

// =================================================================
//                      COMPONENT FUNCTIONS (DEFINITIVE)
// =================================================================

const createHeroBackgroundSlide = (mediaData) => {
    const { details } = mediaData;
    if (!details) return '';
    const backdropUrl = `https://image.tmdb.org/t/p/original${details.backdrop_path}`;
    return `<div class="swiper-slide"><div class="hero-slide-background" style="background-image: url('${backdropUrl}');"></div></div>`;
};

const createHeroContent = (mediaData) => {
    const { details, logoUrl } = mediaData;
    if (!details) return '';
    const mediaType = details.title ? 'movie' : 'tv';
    const titleElement = logoUrl ? `<img src="${logoUrl}" alt="${details.title || details.name}" class="hero-slide-logo">` : `<h2 class="hero-slide-title-fallback">${details.title || details.name}</h2>`;

    return `
        <div class="hero-content">
            ${titleElement}
            <p class="hero-slide-overview">${details.overview}</p>
            <a href="/details.html?type=${mediaType}&id=${details.id}" class="hero-cta-button">
                <span>&#9654;</span> View Details
            </a>
        </div>`;
};


// PASTE THE UNCHANGED JS FUNCTIONS FROM THE PREVIOUS STEP HERE
// (populateSpotlight, populateShelf, initScrollAnimations, initHorizontalScrollAnimations,
// createSpotlight, createMediaCard, createTopTenCard)

function populateSpotlight(mediaData) {
    const section = document.getElementById('spotlight-section');
    if (!section || !mediaData || !mediaData.details) return;
    section.innerHTML = createSpotlight(mediaData);
}

function populateShelf(shelfId, mediaList, cardType, title) {
    const shelfElement = document.getElementById(shelfId);
    if (!shelfElement || !mediaList) return;
    const scrollerContent = mediaList.map((media, index) => {
        const component = cardType === 'top-ten' ? createTopTenCard(media, index) : createMediaCard(media);
        return component.replace('class="', `style="--stagger-delay: ${index * 0.05}s;" class="`);
    }).join('');
    shelfElement.innerHTML = `
        <h2 class="shelf-title container">${title}</h2>
        <div class="media-scroller-container">
            <div class="media-scroller"><div class="media-scroller-inner">${scrollerContent}</div></div>
            <button class="scroll-arrow left" aria-label="Scroll left">&lt;</button>
            <button class="scroll-arrow right" aria-label="Scroll right">&gt;</button>
        </div>
    `;
    const scroller = shelfElement.querySelector('.media-scroller');
    shelfElement.querySelector('.scroll-arrow.left').addEventListener('click', () => scroller.scrollBy({ left: -scroller.clientWidth * 0.8, behavior: 'smooth' }));
    shelfElement.querySelector('.scroll-arrow.right').addEventListener('click', () => scroller.scrollBy({ left: scroller.clientWidth * 0.8, behavior: 'smooth' }));
}

function initScrollAnimations() {
    const shelves = document.querySelectorAll('.media-shelf');
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: "0px 0px -150px 0px" });
    shelves.forEach(shelf => observer.observe(shelf));
}

function initHorizontalScrollAnimations() {
    const scrollers = document.querySelectorAll('.standard-shelf .media-scroller');
    scrollers.forEach(scroller => {
        const cards = scroller.querySelectorAll('.media-card');
        if (cards.length === 0) return;
        let ticking = false;
        const updateCardStyles = () => {
            const scrollerCenter = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;
            cards.forEach(card => {
                const cardRect = card.getBoundingClientRect();
                if (cardRect.width === 0) return;
                const cardCenter = cardRect.left + cardRect.width / 2;
                const distance = scrollerCenter - cardCenter;
                const maxDistance = scroller.clientWidth / 2;
                const normalizedDistance = Math.max(-maxDistance, Math.min(maxDistance, distance)) / maxDistance;
                const rotation = normalizedDistance * 25;
                const scale = 1 - Math.abs(normalizedDistance) * 0.15;
                const opacity = 1 - Math.abs(normalizedDistance) * 0.4;
                card.style.transform = `scale(${scale}) rotateY(${rotation}deg)`;
                card.style.opacity = opacity;
            });
            ticking = false;
        };
        scroller.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateCardStyles();
                    ticking = false;
                });
                ticking = true;
            }
        });
        updateCardStyles();
    });
}

const createSpotlight = (mediaData) => {
    const { details } = mediaData;
    const backdropUrl = `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`;
    const posterUrl = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
    const mediaType = details.title ? 'movie' : 'tv';
    return `<img src="${backdropUrl}" alt="" class="spotlight-backdrop" loading="lazy"><div class="spotlight-content"><img src="${posterUrl}" alt="${details.title || details.name}" class="spotlight-poster" loading="lazy"><div class="spotlight-info"><h3>${details.title || details.name}</h3><p>${details.overview.substring(0, 200)}...</p><a href="/details.html?type=${mediaType}&id=${details.id}" class="spotlight-cta">Learn More</a></div></div>`;
};

const createMediaCard = (media) => {
    const posterUrl = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : 'placeholder.jpg';
    const title = media.title || media.name;
    const mediaType = media.title ? 'movie' : 'tv';
    return `<a href="/details.html?type=${mediaType}&id=${media.id}" class="media-card" title="${title}"><img src="${posterUrl}" alt="${title}" loading="lazy"></a>`;
};

const createTopTenCard = (media, rank) => {
    const posterUrl = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : 'placeholder.jpg';
    const title = media.title || media.name;
    const mediaType = media.title ? 'movie' : 'tv';
    return `<a href="/details.html?type=${mediaType}&id=${media.id}" class="top-ten-card" title="${title}"><span class="top-ten-number">${rank + 1}</span><img src="${posterUrl}" alt="${title}" class="top-ten-poster" loading="lazy"></a>`;
};
