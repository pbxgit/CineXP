/* --- 1. GLOBAL & DOM VARIABLES --- */
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval;
let isBg1Active = true;
let touchStartX = 0,
    touchEndX = 0;
let debounceTimer;
let globalFallbackBackdrop = '';

const DOM = {
    body: document.body,
    mainHeader: document.querySelector('.main-header'),
    bg1: document.querySelector('.hero-background'),
    bg2: document.querySelector('.hero-background-next'),
    heroSection: document.getElementById('hero-section'),
    heroLogoContainer: document.querySelector('.hero-logo-container'),
    heroLogoImg: document.querySelector('.hero-logo'),
    heroTitle: document.querySelector('.hero-title'),
    heroTagline: document.querySelector('.hero-tagline'),
    heroIndicatorsContainer: document.querySelector('.hero-indicators'),
    heroWatchBtn: document.querySelector('#hero-section .cta-button'),
    carouselsContainer: document.getElementById('content-carousels'),
    modalOverlay: document.getElementById('details-modal-overlay'),
    modal: document.getElementById('details-modal'),
    modalContent: document.querySelector('#details-modal .modal-content'),
    modalBanner: document.querySelector('#details-modal .modal-banner'),
    modalScrollContainer: document.getElementById('modal-scroll-container'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    searchLink: document.getElementById('search-link'),
    searchOverlay: document.getElementById('search-ui-overlay'),
    searchCloseBtn: document.getElementById('search-ui-close-btn'),
    searchInput: document.getElementById('search-ui-input'),
    searchResultsContainer: document.getElementById('search-ui-results-grid'),
    loadingOverlay: document.getElementById('loading-overlay'),
};

/* --- 2. INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [trendingMovies, trendingShows] = await Promise.all([
            fetchMedia('movie', 'trending'),
            fetchMedia('tv', 'trending')
        ]);
        heroSlides = [...trendingMovies, ...trendingShows].filter(Boolean).sort((a, b) => b.popularity - a.popularity).slice(0, 7);

        if (trendingMovies?.[0]?.backdrop_path) {
            globalFallbackBackdrop = trendingMovies[0].backdrop_path;
        }

        if (heroSlides.length > 0) setupHero();
        if (trendingMovies?.length > 0) DOM.carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
        if (trendingShows?.length > 0) DOM.carouselsContainer.appendChild(createCarousel('Trending TV Shows', trendingShows));

        setupScrollAnimations();
        setupEventListeners();

        DOM.loadingOverlay.classList.remove('active');
        DOM.body.classList.remove('loading-active');

    } catch (error) {
        console.error("Failed to initialize the application:", error);
        DOM.loadingOverlay.classList.remove('active');
        DOM.body.classList.remove('loading-active');
    }
});

/* --- 3. EVENT LISTENERS --- */
function setupEventListeners() {
    if (DOM.mainHeader) { window.addEventListener('scroll', () => DOM.mainHeader.classList.toggle('scrolled', window.scrollY > 50)); }
    if (DOM.modalOverlay) DOM.modalOverlay.addEventListener('click', closeModal);
    if (DOM.modalCloseBtn) DOM.modalCloseBtn.addEventListener('click', closeModal);
    if (DOM.searchLink) DOM.searchLink.addEventListener('click', openSearch);
    if (DOM.searchCloseBtn) DOM.searchCloseBtn.addEventListener('click', closeSearch);
    if (DOM.searchInput) DOM.searchInput.addEventListener('input', handleSearchInput);
    
    // [NEW] Parallax effect listener
    window.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        const x = (clientX / innerWidth) - 0.5;
        const y = (clientY / innerHeight) - 0.5;
        DOM.body.style.setProperty('--mouse-x', x * 20); // Multiply for a more visible effect
        DOM.body.style.setProperty('--mouse-y', y * 20);
    });
}

/* --- 4. HERO SLIDER LOGIC --- */
function setupHero() {
    if (!DOM.heroSection) return;
    setupHeroIndicators();
    setupSwipeHandlers();
    updateHeroSlide(currentHeroIndex, true);
    startHeroSlider();
}

function startHeroSlider() {
    clearInterval(heroInterval);
    const slideDuration = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hero-slide-duration')) * 1000 || 10000;
    heroInterval = setInterval(() => {
        currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
        updateHeroSlide(currentHeroIndex);
    }, slideDuration);
}

function resetHeroSlider() {
    clearInterval(heroInterval);
    startHeroSlider();
}

async function updateHeroSlide(index, isFirstLoad = false) {
    if (!heroSlides[index]) return;
    currentHeroIndex = index;
    const slideData = heroSlides[index];
    const nextIndex = (index + 1) % heroSlides.length;
    if (heroSlides[nextIndex]?.backdrop_path) {
        new Image().src = `https://image.tmdb.org/t/p/original${heroSlides[nextIndex].backdrop_path}`;
    }
    DOM.heroSection.classList.remove('active');

    if (!slideData.details) {
        const mediaType = slideData.media_type || (slideData.title ? 'movie' : 'tv');
        slideData.details = await fetchMediaDetails(mediaType, slideData.id);
    }

    updateHeroBackground(slideData.backdrop_path, isFirstLoad);
    setTimeout(() => {
        updateHeroContent(slideData.details, slideData);
        DOM.heroSection.classList.add('active');
        updateHeroIndicators(index);
    }, 600);
}

function updateHeroBackground(backdropPath, isFirstLoad) {
    const nextBgUrl = backdropPath ? `url(https://image.tmdb.org/t/p/original${backdropPath})` : '';
    const activeBg = isBg1Active ? DOM.bg1 : DOM.bg2;
    const nextBg = isBg1Active ? DOM.bg2 : DOM.bg1;
    if (isFirstLoad) {
        activeBg.style.backgroundImage = nextBgUrl;
        return;
    }
    nextBg.style.backgroundImage = nextBgUrl;
    activeBg.style.opacity = 0;
    nextBg.style.opacity = 1;
    isBg1Active = !isBg1Active;
}

function updateHeroContent(detailsData, slideData) {
    const logos = detailsData?.logos || [];
    const bestLogo = logos.find(l => l.iso_639_1 === 'en') || logos[0];

    if (bestLogo?.file_path) {
        DOM.heroLogoImg.src = `https://image.tmdb.org/t/p/w500${bestLogo.file_path}`;
        DOM.heroLogoContainer.style.display = 'block';
        DOM.heroTitle.style.display = 'none';
    } else {
        // [MODIFIED] Granular text reveal animation
        const titleText = detailsData.title || detailsData.name || slideData.title || slideData.name || 'Untitled';
        DOM.heroTitle.innerHTML = titleText.split('').map((char, i) =>
            char.trim() === '' ? ' ' : `<span style="transition-delay: ${i * 25}ms">${char}</span>`
        ).join('');
        DOM.heroTitle.style.display = 'block';
        DOM.heroLogoContainer.style.display = 'none';
    }

    DOM.heroTagline.textContent = detailsData.tagline || '';
    DOM.heroTagline.style.display = detailsData.tagline ? 'block' : 'none';

    const mediaType = detailsData.seasons ? 'tv' : 'movie';
    if (mediaType === 'movie') {
        DOM.heroWatchBtn.href = `https://www.cineby.app/movie/${detailsData.id}?play=true`;
    } else if (mediaType === 'tv') {
        const firstSeason = detailsData.seasons?.find(s => s.season_number > 0);
        if (firstSeason) {
            DOM.heroWatchBtn.href = `https://www.cineby.app/tv/${detailsData.id}/${firstSeason.season_number}/1?play=true`;
        } else {
            DOM.heroWatchBtn.href = '#';
        }
    }
}


/* --- 5. UI & ANIMATION HELPERS --- */
function setupHeroIndicators() {
    if (!DOM.heroIndicatorsContainer) return;
    DOM.heroIndicatorsContainer.innerHTML = '';
    heroSlides.forEach((_, index) => {
        const bar = document.createElement('div');
        bar.className = 'indicator-bar';
        bar.innerHTML = `<div class="progress"></div>`;
        bar.addEventListener('click', () => {
            if (index !== currentHeroIndex) {
                updateHeroSlide(index);
                resetHeroSlider();
            }
        });
        DOM.heroIndicatorsContainer.appendChild(bar);
    });
}

function updateHeroIndicators(activeIndex) {
    if (!DOM.heroIndicatorsContainer) return;
    const allBars = DOM.heroIndicatorsContainer.querySelectorAll('.indicator-bar');
    allBars.forEach((bar, index) => {
        bar.classList.remove('active');
        const progress = bar.querySelector('.progress');
        if (progress) {
            progress.style.transition = 'none';
            progress.style.width = '0%';
            void progress.offsetWidth;
            if (index === activeIndex) {
                bar.classList.add('active');
                progress.style.transition = `width var(--hero-slide-duration) linear`;
                progress.style.width = '100%';
            }
        }
    });
}

function createCarousel(title, mediaItems) {
    if (!Array.isArray(mediaItems) || mediaItems.length === 0) return document.createDocumentFragment();
    const section = document.createElement('section');
    section.className = 'carousel-section';
    // [MODIFIED] Added a wrapper for the title mask animation
    section.innerHTML = `<div class="carousel-title-wrapper"><h2>${title}</h2></div>`;
    const carouselDiv = document.createElement('div');
    carouselDiv.className = 'movie-carousel';
    mediaItems.forEach(item => {
        if (!item?.poster_path) return;
        const posterLink = document.createElement('a');
        posterLink.className = 'movie-poster';
        posterLink.href = '#';
        posterLink.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" loading="lazy">`;
        posterLink.addEventListener('click', (e) => {
            e.preventDefault();
            // [MODIFIED] Pass the clicked element itself for the transition
            openDetailsModal(item, posterLink.querySelector('img'));
        });
        carouselDiv.appendChild(posterLink);
    });
    section.appendChild(carouselDiv);
    return section;
}

function setupScrollAnimations() {
    const sectionsToAnimate = document.querySelectorAll('.carousel-section');
    if (sectionsToAnimate.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    sectionsToAnimate.forEach(section => observer.observe(section));
}

/* --- 6. MODAL LOGIC --- */

/**
 * [REFACTORED] Opens the details modal with a shared element transition.
 * @param {object} mediaItem - The movie/TV show data object.
 * @param {HTMLElement} clickedElement - The specific <img> element that was clicked.
 */
async function openDetailsModal(mediaItem, clickedElement) {
    if (!DOM.modal || !mediaItem) return;

    // --- Part 1: Fetch data and prepare the final HTML content ---
    const mediaType = mediaItem.media_type || (mediaItem.title ? 'movie' : 'tv');
    const details = await fetchMediaDetails(mediaType, mediaItem.id);

    if (!details || Object.keys(details).length === 0) { /* Error handling... */ return; }

    const bannerUrl = details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '';
    const year = (details.release_date || details.first_air_date || '').split('-')[0] || '';
    const runtime = details.runtime ? `${details.runtime} min` : (details.episode_run_time?.[0] ? `${details.episode_run_time[0]} min` : '');
    const rating = details.certification || 'N/A';
    const bestLogo = details.logos?.find(l => l.iso_639_1 === 'en') || details.logos?.[0];
    const titleHtml = bestLogo?.file_path ? `<img src="https://image.tmdb.org/t/p/w500${bestLogo.file_path}" class="modal-title-logo" alt="${details.title || details.name}">` : `<h1 class="modal-title-text">${details.title || details.name}</h1>`;
    // (Other variable preparations remain the same)
    const filteredCast = details.cast?.filter(c => c.profile_path);
    const watchBtnHtml = '...'; // (Your existing watch button logic)
    const seasonsHtml = '...'; // (Your existing seasons browser logic)

    const modalContentHtml = `
        <div class="modal-main-details">
             <img src="https://image.tmdb.org/t/p/w500${details.poster_path}" alt="${details.title || details.name}" class="modal-poster shared-poster-element">
             <div class="modal-title-group">${titleHtml} ... </div>
        </div>
        <div class="modal-info-column">
            <div class="modal-overview"><p>${details.overview || ''}</p></div>
            <div id="ai-insights"></div>
            ...
        </div>
    `;

    // --- Part 2: Perform the transition ---
    if (!document.startViewTransition) {
        // Fallback for browsers that don't support View Transitions
        DOM.modalBanner.style.backgroundImage = `url(${bannerUrl})`;
        DOM.modalContent.innerHTML = modalContentHtml;
        DOM.body.classList.add('modal-open');
        DOM.modalOverlay.classList.add('active');
        DOM.modal.classList.add('active');
        setupModalInteractivity(details);
        return;
    }

    // Modern browser path with View Transitions
    clickedElement.style.viewTransitionName = 'poster-img';

    const transition = document.startViewTransition(() => {
        DOM.modalBanner.style.backgroundImage = `url(${bannerUrl})`;
        DOM.modalContent.innerHTML = modalContentHtml;
        DOM.body.classList.add('modal-open');
        DOM.modalOverlay.classList.add('active');
        DOM.modal.classList.add('active');
    });

    transition.finished.finally(() => {
        // Clean up the transition name after the animation is complete
        clickedElement.style.viewTransitionName = '';
    });

    // Load AI content and set up listeners after the transition has started
    setupModalInteractivity(details);
}

/**
 * [NEW HELPER] Sets up dynamic content and listeners inside the modal.
 * This includes season tabs and fetching AI insights.
 * @param {object} details - The detailed media data.
 */
function setupModalInteractivity(details) {
    // Setup Season/Episode browser interactivity
    const seasonTabs = DOM.modalContent.querySelectorAll('.season-tab');
    if (seasonTabs.length > 0) {
        seasonTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const seasonNumber = tab.dataset.season;
                seasonTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                DOM.modalContent.querySelectorAll('.episodes-list').forEach(list => list.classList.remove('active'));
                DOM.modalContent.querySelector(`#season-${seasonNumber}-episodes`)?.classList.add('active');
            });
        });
        seasonTabs[0].click();
    }

    // Fetch and display AI insights asynchronously
    displayAiInsights(details.title || details.name, details.overview);
}

async function displayAiInsights(title, overview) {
    const container = document.getElementById('ai-insights');
    if (!container) return;
    container.innerHTML = `<p class="ai-loading">Asking the AI for a vibe check...</p>`;
    const insights = await fetchAiVibe(title, overview);
    if (insights && insights.vibe_check && insights.smart_tags) {
        container.innerHTML = `
            <div class="vibe-check"><h3 class="section-title">AI Vibe Check</h3><p>"${insights.vibe_check}"</p></div>
            <div class="smart-tags"><h3 class="section-title">Smart Tags</h3><div class="tags-container">${insights.smart_tags.map(tag => `<span>${tag}</span>`).join('')}</div></div>`;
    } else {
        container.innerHTML = '';
    }
}

function closeModal() {
    DOM.body.classList.remove('modal-open');
    DOM.modalOverlay.classList.remove('active');
    DOM.modal.classList.remove('active');
    setTimeout(() => {
        if (DOM.modalScrollContainer) DOM.modalScrollContainer.scrollTop = 0;
        // Clean content to ensure fresh state on next open
        DOM.modalContent.innerHTML = '';
    }, 600);
}

/* --- 7. REVAMPED SEARCH LOGIC --- */
function openSearch(e) {
    e.preventDefault();
    DOM.body.classList.add('search-open');
    DOM.searchOverlay.classList.add('active');
    setTimeout(() => DOM.searchInput.focus(), 500);
}

function closeSearch() {
    DOM.body.classList.remove('search-open');
    DOM.searchOverlay.classList.remove('active');
    setTimeout(() => {
        DOM.searchInput.value = '';
        DOM.searchResultsContainer.innerHTML = '';
    }, 500);
}

function handleSearchInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        const query = DOM.searchInput.value.trim();
        if (query.length > 1) {
            const results = await searchMedia(query);
            displaySearchResults(results);
        } else {
            DOM.searchResultsContainer.innerHTML = '';
        }
    }, 500);
}

function displaySearchResults(results) {
    DOM.searchResultsContainer.innerHTML = '';
    if (!results || results.length === 0) {
        DOM.searchResultsContainer.innerHTML = `<p class="no-results is-visible">No results found.</p>`;
        return;
    }

    results.forEach((item, index) => {
        if (!item.poster_path) return;
        const posterElement = document.createElement('a');
        posterElement.className = 'search-ui-card';
        posterElement.href = '#';
        posterElement.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" loading="lazy">`;
        posterElement.addEventListener('click', (e) => {
            e.preventDefault();
            closeSearch();
            setTimeout(() => {
                // [MODIFIED] Pass the clicked element itself for the transition
                openDetailsModal(item, posterElement.querySelector('img'));
            }, 500);
        });
        DOM.searchResultsContainer.appendChild(posterElement);
        setTimeout(() => posterElement.classList.add('is-visible'), index * 50);
    });
}

/* --- 8. SWIPE LOGIC --- */
function setupSwipeHandlers() { if (!DOM.heroSection) return; DOM.heroSection.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; clearInterval(heroInterval); }, { passive: true }); DOM.heroSection.addEventListener('touchmove', e => { touchEndX = e.touches[0].clientX; }, { passive: true }); DOM.heroSection.addEventListener('touchend', () => { if (touchEndX !== 0 && Math.abs(touchStartX - touchEndX) > 50) { if (touchStartX > touchEndX) { currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length; } else { currentHeroIndex = (currentHeroIndex - 1 + heroSlides.length) % heroSlides.length; } updateHeroSlide(currentHeroIndex); } startHeroSlider(); touchStartX = 0; touchEndX = 0; }); }
