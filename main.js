// =================================================================
//                 MEDIA EXPLORER - MAIN JAVASCRIPT (V13 - DEFINITIVE)
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
    populateHeader();
    initStickyHeader();
    initHeroParallax();

    const [topRatedMovies, trendingMovies, popularTv] = await Promise.all([
        fetchData('top_rated_movies'),
        fetchData('trending_movies'),
        fetchData('popular_tv')
    ]);

    await populateHero(trendingMovies);
    await populateMainContent(topRatedMovies, trendingMovies, popularTv);

    document.getElementById('main-content-area')?.classList.add('loaded');
    initScrollFadeIn();
    initMarqueeInteraction(topRatedMovies?.results || []);
    initActiveCardScrollers();
}

async function populateMainContent(topRated, trending, popular) {
    const mainContentArea = document.getElementById('main-content-area');
    if (!mainContentArea) return;

    const marqueeHtml = await buildMarqueeSection(topRated);
    const trendingShelfHtml = buildShelf('trending-shelf', trending, 'Trending Movies');
    const popularShelfHtml = buildShelf('popular-shelf', popular, 'Popular TV Shows');

    mainContentArea.innerHTML = `<div class="container">${marqueeHtml}</div>${trendingShelfHtml}${popularShelfHtml}`;
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

function initHeroParallax() {
    const heroBg = document.getElementById('hero-background-container');
    if (!heroBg) return;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        heroBg.style.transform = `translateY(${scrollY * 0.4}px)`; // Parallax effect
        heroBg.style.opacity = Math.max(0, 1 - scrollY / 600);
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

function initMarqueeInteraction(top10List) {
    const marqueeSection = document.querySelector('.marquee-section');
    if (!marqueeSection || top10List.length === 0) return;

    const headlinerContainer = marqueeSection.querySelector('.marquee-headliner');
    const shortlistItems = marqueeSection.querySelectorAll('.shortlist-item');

    shortlistItems.forEach((item) => {
        item.addEventListener('click', async () => {
            if (item.classList.contains('active')) return; // Don't re-fetch if already active

            const mediaId = item.dataset.id;
            const headlinerData = await fetchData('details', `&type=movie&id=${mediaId}`);
            if (!headlinerData) return;

            // Update active state visuals
            marqueeSection.querySelector('.shortlist-item.active')?.classList.remove('active');
            item.classList.add('active');

            // Animate out the old content
            const oldContent = headlinerContainer.querySelector('.headliner-content');
            oldContent.classList.remove('is-visible');

            // Build and inject new content
            const newHeadlinerHtml = createMarqueeHeadliner(headlinerData);
            
            setTimeout(() => {
                headlinerContainer.innerHTML = newHeadlinerHtml;
                // Animate in the new content after a short delay
                setTimeout(() => headlinerContainer.querySelector('.headliner-content').classList.add('is-visible'), 50);
            }, 500); // Wait for the old content to fade out
        });
    });
}

function initActiveCardScrollers() {
    const scrollers = document.querySelectorAll('.media-scroller');
    scrollers.forEach(scroller => {
        let ticking = false;
        const updateActiveCard = () => {
            const scrollerRect = scroller.getBoundingClientRect();
            const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
            let closestCard = null;
            let smallestDistance = Infinity;

            scroller.querySelectorAll('.media-card').forEach(card => {
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.left + cardRect.width / 2;
                const distance = Math.abs(scrollerCenter - cardCenter);

                if (distance < smallestDistance) {
                    smallestDistance = distance;
                    closestCard = card;
                }
                card.classList.remove('is-active');
            });

            if (closestCard) {
                closestCard.classList.add('is-active');
            }
            ticking = false;
        };

        scroller.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateActiveCard);
                ticking = true;
            }
        }, { passive: true });
        updateActiveCard(); // Set initial active card
    });
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

    sliderWrapper.innerHTML = heroDetailedData.map(d => `<div class="swiper-slide"><div class="hero-slide-background" style="background-image: url('https://image.tmdb.org/t/p/original${d.details.backdrop_path}')"></div></div>`).join('');
    contentContainer.innerHTML = heroDetailedData.map(createHeroContent).join('');
    const contentSlides = contentContainer.querySelectorAll('.hero-content');
    new Swiper('#hero-slider', {
        loop: true, effect: 'fade', speed: 1500, autoplay: { delay: 7000 }, allowTouchMove: false,
        on: { slideChange: function() { contentSlides.forEach((s, i) => s.classList.toggle('is-active', i === this.realIndex)); } }
    });
    if(contentSlides[0]) contentSlides[0].classList.add('is-active');
}

async function buildMarqueeSection(top10List) {
    if (!top10List?.results?.length) return '';
    const headlinerData = await fetchData('details', `&type=movie&id=${top10List.results[0].id}`);
    if (!headlinerData) return '';
    return `<section class="marquee-section">${createMarqueeComponent(headlinerData, top10List.results)}</section>`;
}

function buildShelf(shelfId, mediaList, title) {
    if (!mediaList?.results?.length) return '';
    const cardsHtml = mediaList.results.map(createMediaCard).join('');
    return `<section id="${shelfId}" class="media-shelf"><h2 class="shelf-title container">${title}</h2><div class="media-scroller">${cardsHtml}</div></section>`;
}

const createHeroContent = (data) => {
    const { details, logoUrl } = data;
    const title = logoUrl ? `<img src="${logoUrl}" alt="${details.title}" class="hero-logo">` : `<h2 class="hero-title-fallback">${details.title}</h2>`;
    return `<div class="hero-content">${title}<p class="hero-overview">${details.overview}</p><a href="/details.html?type=movie&id=${details.id}" class="hero-cta">View Details</a></div>`;
};

const createMarqueeHeadliner = (headlinerData) => {
    const { details, logoUrl } = headlinerData;
    const headlinerTitle = logoUrl ? `<img src="${logoUrl}" alt="${details.title}" class="headliner-logo">` : `<h2>${details.title}</h2>`;
    return `
        <a href="/details.html?type=movie&id=${details.id}">
            <img src="https://image.tmdb.org/t/p/w1280${details.backdrop_path}" class="headliner-backdrop" loading="lazy">
        </a>
        <div class="headliner-content">
            ${headlinerTitle}
            <p class="headliner-overview">${details.overview}</p>
        </div>`;
};

const createMarqueeComponent = (headlinerData, top10List) => {
    const shortlistHtml = top10List.map((item, i) => `
        <div class="shortlist-item ${i === 0 ? 'active' : ''}" data-id="${item.id}">
            <span class="shortlist-rank">${i + 1}</span>
            <span class="shortlist-title-text">${item.title}</span>
        </div>`).join('');
    return `<div class="marquee-headliner">${createMarqueeHeadliner(headlinerData)}</div><div class="marquee-shortlist"><h3 class="shortlist-title">Top 10 This Week</h3>${shortlistHtml}</div>`;
};

const createMediaCard = (media) => {
    const posterPath = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : '';
    return `<a href="/details.html?type=${media.title ? 'movie' : 'tv'}&id=${media.id}" class="media-card"><img src="${posterPath}" loading="lazy"></a>`;
};
