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

        // ### THE FIX: Hide the loader now that content is ready ###
        DOM.loadingOverlay.classList.remove('active');
        DOM.body.classList.remove('loading-active');

    } catch (error) {
        console.error("Failed to initialize the application:", error);
        
        // ### ROBUSTNESS: Also hide loader on error so user isn't stuck ###
        DOM.loadingOverlay.classList.remove('active');
        DOM.body.classList.remove('loading-active');
        // Optionally, you could display an error message here
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
        DOM.heroTitle.textContent = detailsData.title || detailsData.name || slideData.title || slideData.name || 'Untitled';
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
    section.innerHTML = `<h2>${title}</h2>`;
    const carouselDiv = document.createElement('div');
    carouselDiv.className = 'movie-carousel';
    mediaItems.forEach((item, index) => {
        if (!item?.poster_path) return;
        const posterLink = document.createElement('a');
        posterLink.className = 'movie-poster';
        // Add a staggered delay for the new jump-in animation
        posterLink.style.transitionDelay = `${index * 50}ms`;
        posterLink.href = '#';
        posterLink.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" loading="lazy">`;
        posterLink.addEventListener('click', (e) => {
            e.preventDefault();
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

/* --- 6. MODAL LOGIC (REBUILT FROM SCRATCH FOR AWARDS-LEVEL PERFORMANCE) --- */

/**
 * Opens the details modal with an instant, skeleton-based transition.
 * This provides immediate visual feedback and loads content in the background for a jank-free experience.
 */
async function openDetailsModal(mediaItem, clickedImgElement) {
    if (!mediaItem) return;

    const useTransition = document.startViewTransition && clickedImgElement;

    // 1. Renders a placeholder "skeleton" UI instantly
    const renderSkeleton = () => {
        DOM.modalBanner.style.backgroundImage = '';
        DOM.modalContent.innerHTML = `
            <div class="modal-main-details">
                <img src="${clickedImgElement.src}" alt="${mediaItem.title || mediaItem.name}" class="modal-poster">
                <div class="modal-title-group">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-meta"></div>
                    <div class="skeleton skeleton-meta-short"></div>
                </div>
            </div>
            <div class="modal-info-column">
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text-short"></div>
            </div>`;
        DOM.body.classList.add('modal-open');
        DOM.modalOverlay.classList.add('active');
        DOM.modal.classList.add('active');
    };

    // 2. Start the animation immediately with the skeleton UI
    if (useTransition) {
        clickedImgElement.style.viewTransitionName = 'poster-transition';
        const transition = document.startViewTransition(renderSkeleton);
        transition.finished.finally(() => {
            clickedImgElement.style.viewTransitionName = '';
        });
    } else {
        renderSkeleton(); // Fallback for other browsers
    }

    // 3. Fetch all data in the background while the animation runs
    const mediaType = mediaItem.media_type || (mediaItem.title ? 'movie' : 'tv');
    const [details, aiInsights] = await Promise.all([
        fetchMediaDetails(mediaType, mediaItem.id),
        fetchAiVibe(mediaItem.title || mediaItem.name, mediaItem.overview) // Fetch AI data concurrently
    ]);

    if (!details || Object.keys(details).length === 0) {
        DOM.modalContent.innerHTML = '<p>Sorry, details could not be loaded.</p>';
        return;
    }

    // 4. Once data arrives, populate the real content
    populateModalContent(details, mediaType, aiInsights);
}

/**
 * Builds the final HTML for the modal and replaces the skeleton.
 */
function populateModalContent(details, mediaType, aiInsights) {
    const bannerUrl = details.backdrop_path ? `url(https://image.tmdb.org/t/p/original${details.backdrop_path})` : '';
    const finalHtml = buildModalHtml(details, mediaType, aiInsights);

    DOM.modalBanner.style.backgroundImage = bannerUrl;
    DOM.modalContent.innerHTML = finalHtml;
    
    // Fade in the new content for a smooth reveal
    DOM.modalContent.querySelectorAll('.modal-title-group > *, .modal-info-column > *').forEach(el => {
        el.classList.add('fade-in-content');
    });

    // Setup interactivity (seasons browser)
    setupModalInteractivity(details);
}

/**
 * A safe helper function to construct the modal's inner HTML.
 */
function buildModalHtml(details, mediaType, aiInsights) {
    const year = (details.release_date || details.first_air_date || '').split('-')[0];
    const runtime = details.runtime ? `${details.runtime} min` : (details.episode_run_time?.[0] ? `${details.episode_run_time[0]} min` : '');
    const rating = details.certification || 'N/A';
    const bestLogo = details.logos?.find(l => l.iso_639_1 === 'en') || details.logos?.[0];

    const titleHtml = bestLogo?.file_path ? `<img src="https://image.tmdb.org/t/p/w500${bestLogo.file_path}" class="modal-title-logo" alt="${details.title || details.name}">` : `<h1 class="modal-title-text">${details.title || details.name}</h1>`;
    const filteredCast = details.cast?.filter(c => c.profile_path);
    const filteredSeasons = details.seasons?.filter(s => s.poster_path && s.episodes?.length > 0);
    
    let watchBtnHtml = '';
    if (mediaType === 'movie') {
        watchBtnHtml = `<a href="https://www.cineby.app/movie/${details.id}?play=true" class="modal-watch-btn" target="_blank">Watch Now</a>`;
    } else if (mediaType === 'tv' && filteredSeasons?.length > 0) {
        const firstSeasonNum = filteredSeasons[0].season_number;
        const firstEpisodeNum = filteredSeasons[0].episodes[0]?.episode_number;
        if (firstEpisodeNum) { watchBtnHtml = `<a href="https://www.cineby.app/tv/${details.id}/${firstSeasonNum}/${firstEpisodeNum}?play=true" class="modal-watch-btn" target="_blank">Watch Now</a>`; }
    }
    
    const playIconSvg = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>`;
    const seasonsHtml = (mediaType === 'tv' && filteredSeasons?.length > 0) ? `
        <div class="modal-seasons"><h3 class="section-title">Seasons</h3><div class="seasons-browser">
            <div class="seasons-tabs">${filteredSeasons.map(s => `<button class="season-tab" data-season="${s.season_number}">${s.name}</button>`).join('')}</div>
            <div class="episodes-display">${filteredSeasons.map(s => `<div class="episodes-list" id="season-${s.season_number}-episodes">${s.episodes.map(ep => `<div class="episode-item"><div class="episode-thumbnail-container"><img src="${ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}" alt="${ep.name}" class="episode-thumbnail"><a href="https://www.cineby.app/tv/${details.id}/${s.season_number}/${ep.episode_number}?play=true" class="episode-play-btn" target="_blank">${playIconSvg}</a></div><div class="episode-info"><h5>${ep.episode_number}. ${ep.name}</h5><p>${ep.overview || 'No description available.'}</p></div></div>`).join('')}</div>`).join('')}</div>
        </div></div>` : '';
    
    const aiInsightsHtml = (aiInsights && aiInsights.vibe_check && aiInsights.smart_tags) ? `
        <div class="ai-insights-section">
            <div class="vibe-check">
                <h3 class="section-title">AI Vibe Check</h3>
                <p>${aiInsights.vibe_check}</p>
            </div>
            <div class="smart-tags">
                <h3 class="section-title">Smart Tags</h3>
                <div class="tags-container">
                    ${aiInsights.smart_tags.map(tag => `<span>${tag}</span>`).join('')}
                </div>
            </div>
        </div>` : '';

    return `
        <div class="modal-main-details">
            <img src="https://image.tmdb.org/t/p/w500${details.poster_path}" alt="${details.title || details.name}" class="modal-poster">
            <div class="modal-title-group">${titleHtml}<div class="modal-meta">${year ? `<span>${year}</span>` : ''}<span class="rating">${rating}</span>${runtime ? `<span>${runtime}</span>` : ''}</div><div class="modal-genres">${details.genres?.map(g => `<span>${g.name}</span>`).join('') || ''}</div>${watchBtnHtml}</div>
        </div>
        <div class="modal-info-column">
            <div class="modal-overview"><p>${details.overview || ''}</p></div>
            ${aiInsightsHtml}
            ${(filteredCast && filteredCast.length > 0) ? `<div class="modal-cast"><h3 class="section-title">Cast</h3><div class="cast-list">${filteredCast.map(member => `<div class="cast-member"><img src="https://image.tmdb.org/t/p/w200${member.profile_path}" alt="${member.name}"><p>${member.name}</p></div>`).join('')}</div></div>` : ''}
            ${seasonsHtml}
        </div>`;
}

/**
 * Sets up event listeners for interactive elements within the modal.
 */
function setupModalInteractivity(details) {
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
}

function closeModal() {
    DOM.body.classList.remove('modal-open');
    DOM.modalOverlay.classList.remove('active');
    DOM.modal.classList.remove('active');
    setTimeout(() => {
        DOM.modalScrollContainer.scrollTop = 0;
        DOM.modalContent.innerHTML = '';
    }, 600);
}




/* --- 7. REVAMPED SEARCH LOGIC --- */
function openSearch(e) { e.preventDefault(); DOM.body.classList.add('search-open'); DOM.searchOverlay.classList.add('active'); setTimeout(() => DOM.searchInput.focus(), 500); }
function closeSearch() { DOM.body.classList.remove('search-open'); DOM.searchOverlay.classList.remove('active'); setTimeout(() => { DOM.searchInput.value = ''; DOM.searchResultsContainer.innerHTML = ''; }, 500); }

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
        const noResultsEl = document.createElement('p');
        noResultsEl.className = 'no-results';
        noResultsEl.textContent = 'No results found.';
        DOM.searchResultsContainer.appendChild(noResultsEl);
        setTimeout(() => noResultsEl.classList.add('is-visible'), 50);
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
                openDetailsModal(item);
            }, 500);
        });
        DOM.searchResultsContainer.appendChild(posterElement);
        setTimeout(() => { posterElement.classList.add('is-visible'); }, index * 50);
    });
}

/* --- 8. SWIPE LOGIC --- */
function setupSwipeHandlers() { if (!DOM.heroSection) return; DOM.heroSection.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; clearInterval(heroInterval); }, { passive: true }); DOM.heroSection.addEventListener('touchmove', e => { touchEndX = e.touches[0].clientX; }, { passive: true }); DOM.heroSection.addEventListener('touchend', () => { if (touchEndX !== 0 && Math.abs(touchStartX - touchEndX) > 50) { if (touchStartX > touchEndX) { currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length; } else { currentHeroIndex = (currentHeroIndex - 1 + heroSlides.length) % heroSlides.length; } updateHeroSlide(currentHeroIndex); } startHeroSlider(); touchStartX = 0; touchEndX = 0; }); }
