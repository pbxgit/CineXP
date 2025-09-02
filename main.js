// =================================================================
//                 MEDIA EXPLORER - MAIN JAVASCRIPT (V2 - IMMERSIVE)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Global elements
    const mainHeader = document.getElementById('main-header');

    // Initialize Global Features
    if (mainHeader) initStickyHeader(mainHeader);

    // Page-specific initializations
    if (document.body.classList.contains('home-page')) {
        initHomepage();
    }
});

// =================================================================
//                 GLOBAL & UTILITY FUNCTIONS
// =================================================================

function initStickyHeader(headerElement) {
    window.addEventListener('scroll', () => {
        headerElement.classList.toggle('scrolled', window.scrollY > 10);
    });
}

async function fetchData(endpoint, params = '') {
    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=${endpoint}${params}`);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    } catch (error) {
        console.error(`Failed to fetch data for endpoint "${endpoint}":`, error);
        return { results: [] };
    }
}


// =================================================================
//                         HOMEPAGE LOGIC
// =================================================================

async function initHomepage() {
    const [heroData, top10Data, trendingData, popularData] = await Promise.all([
        fetchData('trending_movies'),
        fetchData('top_rated_movies'),
        fetchData('trending_movies'),
        fetchData('popular_tv')
    ]);

    populateHeroSlider(heroData.results.slice(0, 5));
    populateShelf('top-10-shelf', top10Data.results.slice(0, 10), 'top-ten', 'Top 10 Movies This Week');
    populateShelf('trending-shelf', trendingData.results, 'standard', 'Trending Movies');
    populateShelf('popular-shelf', popularData.results, 'standard', 'Popular TV Shows');
    
    // Smoothly reveal the page
    document.body.classList.add('loaded');

    // Set up scroll-based animations AFTER content is on the page
    initScrollAnimations();
    initHeroParallax();
}

function populateHeroSlider(mediaList) {
    const sliderWrapper = document.getElementById('hero-slider-wrapper');
    if (!sliderWrapper) return;
    
    sliderWrapper.innerHTML = mediaList.map(createHeroSlide).join('');

    new Swiper('.hero-slider', {
        loop: true,
        effect: 'fade',
        fadeEffect: { crossFade: true },
        autoplay: { delay: 8000, disableOnInteraction: false, pauseOnMouseEnter: true },
        speed: 1500,
    });
}

function populateShelf(shelfId, mediaList, cardType, title) {
    const shelfElement = document.getElementById(shelfId);
    if (!shelfElement) return;

    let titleHTML = title ? `<h2 class="shelf-title container">${title}</h2>` : '';
    
    const scrollerContent = mediaList.map((media, index) => {
        const component = cardType === 'top-ten' ? createTopTenCard(media, index) : createMediaCard(media);
        // Add stagger animation delay via CSS custom property
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

    // Add event listeners for the new scroll arrows
    const scroller = shelfElement.querySelector('.media-scroller');
    shelfElement.querySelector('.scroll-arrow.left').addEventListener('click', () => {
        scroller.scrollBy({ left: -scroller.clientWidth * 0.8, behavior: 'smooth' });
    });
    shelfElement.querySelector('.scroll-arrow.right').addEventListener('click', () => {
        scroller.scrollBy({ left: scroller.clientWidth * 0.8, behavior: 'smooth' });
    });
}

// =================================================================
//              ADVANCED ANIMATION & INTERACTION
// =================================================================

function initScrollAnimations() {
    const shelves = document.querySelectorAll('.media-shelf');
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, { rootMargin: "0px 0px -150px 0px" }); // Trigger when shelf is 150px from bottom

    shelves.forEach(shelf => observer.observe(shelf));
}

function initHeroParallax() {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        // Apply a subtle parallax effect. The '0.5' factor can be tweaked.
        heroSection.style.transform = `translateY(${scrollY * 0.5}px)`;
    }, { passive: true }); // Performance optimization
}

// =================================================================
//                      COMPONENT FUNCTIONS (V2)
// =================================================================

const createHeroSlide = (media) => {
    const backdropUrl = `https://image.tmdb.org/t/p/original${media.backdrop_path}`;
    const title = media.title || media.name;
    const mediaType = media.title ? 'movie' : 'tv';

    // We can add video fetching logic here in a future step if desired
    // For now, we focus on the Ken Burns effect on the image.

    return `
        <div class="swiper-slide hero-slide">
            <div class="hero-slide-background" style="background-image: url('${backdropUrl}');"></div>
            <div class="hero-slide-content">
                <h2 class="hero-slide-title-fallback">${title}</h2>
                <p class="hero-slide-overview">${media.overview.substring(0, 180)}...</p>
                <a href="/details.html?type=${mediaType}&id=${media.id}" class="hero-cta-button">
                    <span>&#9654;</span> <!-- Play Icon -->
                    <span>View Details</span>
                </a>
            </div>
        </div>
    `;
};

const createMediaCard = (media) => {
    const posterUrl = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : 'placeholder.jpg';
    const title = media.title || media.name;
    const mediaType = media.title ? 'movie' : 'tv';

    return `<a href="/details.html?type=${mediaType}&id=${media.id}" class="media-card" title="${title}">
                <img src="${posterUrl}" alt="${title}" loading="lazy" width="200" height="300">
            </a>`;
};

const createTopTenCard = (media, rank) => {
    const posterUrl = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : 'placeholder.jpg';
    const title = media.title || media.name;
    const mediaType = media.title ? 'movie' : 'tv';

    return `<a href="/details.html?type=${mediaType}&id=${media.id}" class="top-ten-card" title="${title}">
                <span class="top-ten-number">${rank + 1}</span>
                <img src="${posterUrl}" alt="${title}" class="top-ten-poster" loading="lazy" width="180" height="270">
            </a>`;
};
