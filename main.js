// =================================================================
//                 MEDIA EXPLORER - MAIN JAVASCRIPT (V4 - FLUIDITY)
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
        return { results: [] };
    }
}

// =================================================================
//                         HOMEPAGE LOGIC (FLUIDITY)
// =================================================================

async function initHomepage() {
    const trendingMovies = await fetchData('trending_movies');
    if (!trendingMovies.results || trendingMovies.results.length === 0) {
        document.getElementById('content-skeleton').innerHTML = "<p>Could not load content. Please try again later.</p>";
        return;
    }

    const heroMediaIds = trendingMovies.results.slice(0, 5).map(m => ({ id: m.id, type: 'movie' }));
    const heroDetailedDataPromises = heroMediaIds.map(item => fetchData('details', `&type=${item.type}&id=${item.id}`));
    const heroDetailedData = await Promise.all(heroDetailedDataPromises);

    populateHeroSlider(heroDetailedData);
    
    const spotlightItem = heroDetailedData[0];
    populateSpotlight(spotlightItem);

    const [top10Data, popularTvData] = await Promise.all([
        fetchData('top_rated_movies'),
        fetchData('popular_tv')
    ]);

    populateShelf('top-10-shelf', top10Data.results.slice(0, 10), 'top-ten', 'Top 10 Movies This Week');
    populateShelf('trending-shelf', trendingMovies.results, 'standard', 'Trending Movies');
    populateShelf('popular-shelf', popularTvData.results, 'standard', 'Popular TV Shows');

    document.getElementById('content-skeleton').style.display = 'none';
    document.getElementById('real-content').style.opacity = 1;
    document.body.classList.add('loaded');
    
    initScrollAnimations();
    initHorizontalScrollAnimations(); // <-- Initialize the new 3D scroll!
}

function populateShelf(shelfId, mediaList, cardType, title) {
    const shelfElement = document.getElementById(shelfId);
    if (!shelfElement) return;
    
    // Add a class for styling standard shelves differently
    if (cardType === 'standard') {
        shelfElement.classList.add('standard-shelf');
    }

    let titleHTML = title ? `<h2 class="shelf-title container">${title}</h2>` : '';
    const scrollerContent = mediaList.map((media, index) => {
        const component = cardType === 'top-ten' ? createTopTenCard(media, index) : createMediaCard(media);
        return component.replace('class="', `style="--stagger-delay: ${index * 0.05}s;" class="`);
    }).join('');

    shelfElement.innerHTML = `
        ${titleHTML}
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
    // This handles the vertical reveal of shelves
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


// =================================================================
//              NEW: 3D "COVER FLOW" SCROLL ANIMATION
// =================================================================
function initHorizontalScrollAnimations() {
    const scrollers = document.querySelectorAll('.standard-shelf .media-scroller');

    scrollers.forEach(scroller => {
        const cards = scroller.querySelectorAll('.media-card');
        let ticking = false;

        const updateCardStyles = () => {
            const scrollerCenter = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;

            cards.forEach(card => {
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.left + cardRect.width / 2;
                const distance = scrollerCenter - cardCenter;
                const rotationFactor = -0.1; // How much the cards rotate
                const scaleFactor = 0.05;    // How much the cards shrink
                
                // Max rotation and distance to affect cards
                const maxDistance = scroller.clientWidth / 2;
                const normalizedDistance = Math.max(-maxDistance, Math.min(maxDistance, distance)) / maxDistance;

                const rotation = normalizedDistance * 25; // Max rotation of 25 degrees
                const scale = 1 - Math.abs(normalizedDistance) * 0.15;
                const opacity = 1 - Math.abs(normalizedDistance) * 0.4;

                // We use !important on hover, so this won't interfere with hover
                card.style.transform = `scale(${scale}) rotateY(${rotation}deg)`;
                card.style.opacity = opacity;
            });
            ticking = false;
        };

        scroller.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateCardStyles();
                    ticking = true;
                });
                ticking = true;
            }
        });

        // Run once on init to set initial state
        updateCardStyles();
    });
}


// Component functions (populateHeroSlider, populateSpotlight, create...) remain unchanged
// from the previous version. You can keep them as they are. Here they are for completeness.

function populateHeroSlider(mediaList) { /* ... same as V3 ... */ }
function populateSpotlight(mediaData) { /* ... same as V3 ... */ }
const createHeroSlide = (mediaData) => { /* ... same as V3 ... */ };
const createSpotlight = (mediaData) => { /* ... same as V3 ... */ };
const createMediaCard = (media) => { /* ... same as V3 ... */ };
const createTopTenCard = (media, rank) => { /* ... same as V3 ... */ };


// PASTE THE UNCHANGED JS FUNCTIONS FROM THE PREVIOUS STEP HERE
// (I am omitting them for brevity, but they are required for the code to work)
// These include: populateHeroSlider, populateSpotlight, createHeroSlide, createSpotlight, createMediaCard, createTopTenCard

// For your convenience, here are the functions again:
function populateHeroSlider(mediaList) {
    const sliderWrapper = document.getElementById('hero-slider-wrapper');
    sliderWrapper.innerHTML = mediaList.map(createHeroSlide).join('');

    new Swiper('.hero-slider', {
        loop: true,
        effect: 'fade',
        fadeEffect: { crossFade: true },
        autoplay: { delay: 8000, disableOnInteraction: false, pauseOnMouseEnter: true },
        speed: 1500,
    });
}

function populateSpotlight(mediaData) {
    const section = document.getElementById('spotlight-section');
    if (!section || !mediaData || !mediaData.details) return;
    section.innerHTML = createSpotlight(mediaData);
}

const createHeroSlide = (mediaData) => {
    const { details, logoUrl } = mediaData;
    if (!details) return '';
    const backdropUrl = `https://image.tmdb.org/t/p/original${details.backdrop_path}`;
    const mediaType = details.title ? 'movie' : 'tv';

    const titleElement = logoUrl 
        ? `<img src="${logoUrl}" alt="${details.title || details.name}" class="hero-slide-logo">`
        : `<h2 class="hero-slide-title-fallback">${details.title || details.name}</h2>`;

    return `
        <div class="swiper-slide hero-slide">
            <div class="hero-slide-background" style="background-image: url('${backdropUrl}');"></div>
            <div class="hero-slide-content">
                ${titleElement}
                <p class="hero-slide-overview">${details.overview}</p>
                <a href="/details.html?type=${mediaType}&id=${details.id}" class="hero-cta-button">
                    <span>&#9654;</span> View Details
                </a>
            </div>
        </div>
    `;
};

const createSpotlight = (mediaData) => {
    const { details } = mediaData;
    const backdropUrl = `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`;
    const posterUrl = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
    const mediaType = details.title ? 'movie' : 'tv';
    
    return `
        <img src="${backdropUrl}" alt="" class="spotlight-backdrop" loading="lazy">
        <div class="spotlight-content">
            <img src="${posterUrl}" alt="${details.title || details.name}" class="spotlight-poster" loading="lazy">
            <div class="spotlight-info">
                <h3>${details.title || details.name}</h3>
                <p>${details.overview.substring(0, 200)}...</p>
                <a href="/details.html?type=${mediaType}&id=${details.id}" class="spotlight-cta">Learn More</a>
            </div>
        </div>
    `;
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
