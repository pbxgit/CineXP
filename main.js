// =================================================================
//                 MEDIA EXPLORER - MAIN JAVASCRIPT (V3 - OVERHAUL)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const mainHeader = document.getElementById('main-header');
    if (mainHeader) initStickyHeader(mainHeader);

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
//                         HOMEPAGE LOGIC (OVERHAULED)
// =================================================================

async function initHomepage() {
    // 1. Fetch initial list of trending movies for hero and spotlight
    const trendingMovies = await fetchData('trending_movies');
    if (!trendingMovies.results || trendingMovies.results.length === 0) {
        // Handle API failure gracefully
        document.getElementById('content-skeleton').innerHTML = "<p>Could not load content. Please try again later.</p>";
        return;
    }

    // 2. Fetch DETAILED data for the top 5 hero slides concurrently
    const heroMediaIds = trendingMovies.results.slice(0, 5).map(m => ({ id: m.id, type: 'movie' }));
    const heroDetailedDataPromises = heroMediaIds.map(item => fetchData('details', `&type=${item.type}&id=${item.id}`));
    const heroDetailedData = await Promise.all(heroDetailedDataPromises);

    // 3. Populate the Hero Slider with rich data (logos, etc.)
    populateHeroSlider(heroDetailedData);

    // 4. Populate the new Spotlight Section with the #1 trending item
    const spotlightItem = heroDetailedData[0]; // Use the already fetched detailed data
    populateSpotlight(spotlightItem);

    // 5. Fetch data for the shelves
    const [top10Data, popularTvData] = await Promise.all([
        fetchData('top_rated_movies'),
        fetchData('popular_tv')
    ]);

    // 6. Populate the shelves
    populateShelf('top-10-shelf', top10Data.results.slice(0, 10), 'top-ten', 'Top 10 Movies This Week');
    // Use the initial trending list for this shelf to save an API call
    populateShelf('trending-shelf', trendingMovies.results, 'standard', 'Trending Movies'); 
    populateShelf('popular-shelf', popularTvData.results, 'standard', 'Popular TV Shows');

    // 7. Reveal the content and initialize scroll animations
    document.getElementById('content-skeleton').style.display = 'none';
    document.getElementById('real-content').style.opacity = 1;
    document.body.classList.add('loaded'); // This can be used for other animations
    initScrollAnimations();
}

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

function populateShelf(shelfId, mediaList, cardType, title) {
    const shelfElement = document.getElementById(shelfId);
    if (!shelfElement) return;

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
//                      COMPONENT FUNCTIONS (V3)
// =================================================================

const createHeroSlide = (mediaData) => {
    const { details, logoUrl } = mediaData;
    if (!details) return ''; // Don't render a slide if data is missing
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

// Standard card components remain unchanged from before
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
