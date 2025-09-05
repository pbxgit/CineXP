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
        if (trendingMovies?.[0]?.backdrop_path) globalFallbackBackdrop = trendingMovies[0].backdrop_path;

        if (heroSlides.length > 0) setupHero();
        if (trendingMovies?.length > 0) DOM.carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
        if (trendingShows?.length > 0) DOM.carouselsContainer.appendChild(createCarousel('Trending TV Shows', trendingShows));

        setupScrollAnimations();
        setupEventListeners();
        setupCarouselScrollAnimations(); // [NEW] Initialize the horizontal scroll effect

        DOM.loadingOverlay.classList.remove('active');
        DOM.body.classList.remove('loading-active');
    } catch (error) {
        console.error("Critical error during initialization:", error);
    }
});

/* --- 3. EVENT LISTENERS --- */
function setupEventListeners() {
    if (DOM.mainHeader) window.addEventListener('scroll', () => DOM.mainHeader.classList.toggle('scrolled', window.scrollY > 50));
    if (DOM.modalOverlay) DOM.modalOverlay.addEventListener('click', closeModal);
    if (DOM.modalCloseBtn) DOM.modalCloseBtn.addEventListener('click', closeModal);
    if (DOM.searchLink) DOM.searchLink.addEventListener('click', openSearch);
    if (DOM.searchCloseBtn) DOM.searchCloseBtn.addEventListener('click', closeSearch);
    if (DOM.searchInput) DOM.searchInput.addEventListener('input', handleSearchInput);

    window.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        const x = ((clientX / innerWidth) - 0.5) * 2;
        const y = ((clientY / innerHeight) - 0.5) * 2;
        DOM.body.style.setProperty('--mouse-x', `${x * 10}px`);
        DOM.body.style.setProperty('--mouse-y', `${y * 10}px`);
    });
}

/* --- 4. HERO SLIDER LOGIC --- */
// ... (This section remains unchanged from the previous working version)
function setupHero() { if (!DOM.heroSection) return; setupHeroIndicators(); setupSwipeHandlers(); updateHeroSlide(currentHeroIndex, true); startHeroSlider(); }
function startHeroSlider() { clearInterval(heroInterval); const slideDuration = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hero-slide-duration'))*1e3||1e4; heroInterval = setInterval(() => { currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length; updateHeroSlide(currentHeroIndex); }, slideDuration); }
function resetHeroSlider() { clearInterval(heroInterval); startHeroSlider(); }
async function updateHeroSlide(index, isFirstLoad = false) { if (!heroSlides[index]) return; currentHeroIndex = index; const slideData = heroSlides[index]; if (!slideData.details) { const mediaType = slideData.media_type || (slideData.title ? 'movie' : 'tv'); slideData.details = await fetchMediaDetails(mediaType, slideData.id); } DOM.heroSection.classList.remove('active'); updateHeroBackground(slideData.backdrop_path, isFirstLoad); setTimeout(() => { updateHeroContent(slideData.details, slideData); DOM.heroSection.classList.add('active'); updateHeroIndicators(index); }, 600); }
function updateHeroBackground(backdropPath, isFirstLoad) { const nextBgUrl = backdropPath ? `url(https://image.tmdb.org/t/p/original${backdropPath})` : ''; const activeBg = isBg1Active ? DOM.bg1 : DOM.bg2; const nextBg = isBg1Active ? DOM.bg2 : DOM.bg1; if (isFirstLoad) { activeBg.style.backgroundImage = nextBgUrl; return; } nextBg.style.backgroundImage = nextBgUrl; activeBg.style.opacity = 0; nextBg.style.opacity = 1; isBg1Active = !isBg1Active; }
function updateHeroContent(detailsData, slideData) { const bestLogo = detailsData?.logos?.find(l => l.iso_639_1 === 'en') || detailsData?.logos?.[0]; if (bestLogo?.file_path) { DOM.heroLogoImg.src = `https://image.tmdb.org/t/p/w500${bestLogo.file_path}`; DOM.heroLogoContainer.style.display = 'block'; DOM.heroTitle.style.display = 'none'; } else { const titleText = detailsData.title || detailsData.name || 'Untitled'; DOM.heroTitle.innerHTML = titleText.split('').map((char, i) => char.trim() === '' ? ' ' : `<span style="transition-delay: ${i * 25}ms">${char}</span>`).join(''); DOM.heroTitle.style.display = 'block'; DOM.heroLogoContainer.style.display = 'none'; } DOM.heroTagline.textContent = detailsData.tagline || ''; DOM.heroTagline.style.display = detailsData.tagline ? 'block' : 'none'; const mediaType = detailsData.seasons ? 'tv' : 'movie'; if (mediaType === 'movie') { DOM.heroWatchBtn.href = `https://www.cineby.app/movie/${detailsData.id}?play=true`; } else if (mediaType === 'tv') { const firstSeason = detailsData.seasons?.find(s => s.season_number > 0); DOM.heroWatchBtn.href = firstSeason ? `https://www.cineby.app/tv/${detailsData.id}/${firstSeason.season_number}/1?play=true` : '#'; } }


/* --- 5. UI & ANIMATION HELPERS --- */
// ... (setupHeroIndicators, updateHeroIndicators, createCarousel, setupScrollAnimations remain unchanged)
function setupHeroIndicators() { DOM.heroIndicatorsContainer.innerHTML = heroSlides.map(() => `<div class="indicator-bar"><div class="progress"></div></div>`).join(''); DOM.heroIndicatorsContainer.querySelectorAll('.indicator-bar').forEach((bar, index) => { bar.addEventListener('click', () => { if (index !== currentHeroIndex) { updateHeroSlide(index); resetHeroSlider(); } }); }); }
function updateHeroIndicators(activeIndex) { DOM.heroIndicatorsContainer.querySelectorAll('.indicator-bar').forEach((bar, index) => { bar.classList.toggle('active', index === activeIndex); const progress = bar.querySelector('.progress'); if (progress) { progress.style.transition = 'none'; progress.style.width = '0%'; if (index === activeIndex) { void progress.offsetWidth; progress.style.transition = `width var(--hero-slide-duration) linear`; progress.style.width = '100%'; } } }); }
function createCarousel(title, mediaItems) { if (!mediaItems || mediaItems.length === 0) return document.createDocumentFragment(); const section = document.createElement('section'); section.className = 'carousel-section'; section.innerHTML = `<div class="carousel-title-wrapper"><h2>${title}</h2></div>`; const carouselDiv = document.createElement('div'); carouselDiv.className = 'movie-carousel'; mediaItems.forEach(item => { if (!item?.poster_path) return; const posterLink = document.createElement('a'); posterLink.className = 'movie-poster'; posterLink.href = '#'; posterLink.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" loading="lazy">`; posterLink.addEventListener('click', (e) => { e.preventDefault(); openDetailsModal(item, posterLink.querySelector('img')); }); carouselDiv.appendChild(posterLink); }); section.appendChild(carouselDiv); return section; }
function setupScrollAnimations() { const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.1 }); document.querySelectorAll('.carousel-section').forEach(section => observer.observe(section)); }

/**
 * [NEW] Sets up the fade & scale effect on horizontal carousels.
 */
function setupCarouselScrollAnimations() {
    const carousels = document.querySelectorAll('.movie-carousel');
    carousels.forEach(carousel => {
        const updatePosterStyles = () => {
            const carouselRect = carousel.getBoundingClientRect();
            const carouselCenter = carouselRect.left + carouselRect.width / 2;
            const posters = carousel.querySelectorAll('.movie-poster');
            
            posters.forEach(poster => {
                const posterRect = poster.getBoundingClientRect();
                const posterCenter = posterRect.left + posterRect.width / 2;
                const distance = Math.abs(carouselCenter - posterCenter);
                
                // Calculate opacity: 1 when close to center, 0.3 when far away
                const opacity = Math.max(0.3, 1 - (distance / (carouselRect.width / 1.5)));
                // Calculate scale: 1 when close, 0.9 when far
                const scale = Math.max(0.9, 1 - (distance / (carouselRect.width * 2)));

                poster.style.opacity = opacity;
                poster.style.transform = `scale(${scale})`;
            });
        };

        // Run once on load
        updatePosterStyles();
        
        // Update on scroll, throttled with requestAnimationFrame for performance
        let ticking = false;
        carousel.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updatePosterStyles();
                    ticking = false;
                });
                ticking = true;
            }
        });
    });
}


/* --- 6. MODAL LOGIC (JANK FIXED) --- */
async function openDetailsModal(mediaItem, clickedImgElement) {
    if (!mediaItem) return;

    const useTransition = document.startViewTransition && clickedImgElement;
    
    // Show a minimal loading state immediately
    DOM.body.classList.add('loading-active');
    DOM.loadingOverlay.classList.add('active');

    // 1. Fetch details first to get the banner path
    const mediaType = mediaItem.media_type || (mediaItem.title ? 'movie' : 'tv');
    const details = await fetchMediaDetails(mediaType, mediaItem.id);

    if (!details || Object.keys(details).length === 0) {
        DOM.loadingOverlay.classList.remove('active');
        DOM.body.classList.remove('loading-active');
        // Handle error...
        return;
    }

    // 2. [CRITICAL JANK FIX] Preload the banner image before starting the animation
    const bannerUrl = details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '';
    if (bannerUrl) {
        try {
            const img = new Image();
            img.src = bannerUrl;
            await img.decode(); // This promise resolves when the image is ready
        } catch (error) {
            console.error("Banner image failed to load:", error);
        }
    }
    
    // Now that the image is loaded, hide the spinner
    DOM.loadingOverlay.classList.remove('active');
    DOM.body.classList.remove('loading-active');

    // Build the final HTML string (logic is the same as your working version)
    const finalHtml = buildModalHtml(details, mediaType);

    const domUpdate = () => {
        DOM.modalBanner.style.backgroundImage = `url(${bannerUrl})`;
        DOM.modalContent.innerHTML = finalHtml;
        DOM.body.classList.add('modal-open');
        DOM.modalOverlay.classList.add('active');
        DOM.modal.classList.add('active');
        setupModalInteractivity(details);
    };

    if (useTransition) {
        clickedImgElement.style.viewTransitionName = 'poster-transition';
        const transition = document.startViewTransition(domUpdate);
        transition.finished.finally(() => {
            clickedImgElement.style.viewTransitionName = '';
        });
    } else {
        domUpdate(); // Fallback for other browsers
    }
}

function buildModalHtml(details, mediaType) {
    // This helper function safely constructs the HTML, same logic as before
    const year = (details.release_date || details.first_air_date || '').split('-')[0];
    const runtime = details.runtime ? `${details.runtime} min` : (details.episode_run_time?.[0] ? `${details.episode_run_time[0]} min` : '');
    const rating = details.certification || 'N/A';
    const bestLogo = details.logos?.find(l => l.iso_639_1 === 'en') || details.logos?.[0];
    const titleHtml = bestLogo?.file_path ? `<img src="https://image.tmdb.org/t/p/w500${bestLogo.file_path}" class="modal-title-logo" alt="${details.title || details.name}">` : `<h1 class="modal-title-text">${details.title || details.name}</h1>`;
    const filteredCast = details.cast?.filter(c => c.profile_path);
    const filteredSeasons = details.seasons?.filter(s => s.poster_path && s.episodes?.length > 0);
    let watchBtnHtml = '';
    if (mediaType === 'movie') watchBtnHtml = `<a href="https://www.cineby.app/movie/${details.id}?play=true" class="modal-watch-btn" target="_blank">Watch Now</a>`;
    else if (mediaType === 'tv' && filteredSeasons?.length > 0) { const firstSeason = filteredSeasons.find(s => s.season_number > 0) || filteredSeasons[0]; watchBtnHtml = `<a href="https://www.cineby.app/tv/${details.id}/${firstSeason.season_number}/1?play=true" class="modal-watch-btn" target="_blank">Watch Now</a>`; }
    const playIconSvg = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>`;
    const seasonsHtml = (mediaType === 'tv' && filteredSeasons?.length > 0) ? `<div class="modal-seasons"><h3 class="section-title">Seasons</h3><div class="seasons-browser"><div class="seasons-tabs">${filteredSeasons.map(s => `<button class="season-tab" data-season="${s.season_number}">${s.name}</button>`).join('')}</div><div class="episodes-display">${filteredSeasons.map(s => `<div class="episodes-list" id="season-${s.season_number}-episodes">${s.episodes.map(ep => `<div class="episode-item"><div class="episode-thumbnail-container"><img src="${ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}" alt="${ep.name}" class="episode-thumbnail"><a href="https://www.cineby.app/tv/${details.id}/${s.season_number}/${ep.episode_number}?play=true" class="episode-play-btn" target="_blank">${playIconSvg}</a></div><div class="episode-info"><h5>${ep.episode_number}. ${ep.name}</h5><p>${ep.overview || 'No description available.'}</p></div></div>`).join('')}</div>`).join('')}</div></div></div>` : '';
    return `<div class="modal-main-details"><img src="https://image.tmdb.org/t/p/w500${details.poster_path}" alt="${details.title || details.name}" class="modal-poster"><div class="modal-title-group">${titleHtml}<div class="modal-meta">${year ? `<span>${year}</span>` : ''}<span class="rating">${rating}</span>${runtime ? `<span>${runtime}</span>` : ''}</div><div class="modal-genres">${details.genres?.map(g => `<span>${g.name}</span>`).join('') || ''}</div>${watchBtnHtml}</div></div><div class="modal-info-column"><div class="modal-overview"><p>${details.overview || ''}</p></div><div id="ai-insights"></div>${(filteredCast && filteredCast.length > 0) ? `<div class="modal-cast"><h3 class="section-title">Cast</h3><div class="cast-list">${filteredCast.map(member => `<div class="cast-member"><img src="https://image.tmdb.org/t/p/w200${member.profile_path}" alt="${member.name}"><p>${member.name}</p></div>`).join('')}</div></div>` : ''}${seasonsHtml}</div>`;
}

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
    displayAiInsights(details.title || details.name, details.overview);
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

async function displayAiInsights(title, overview) {
    const container = document.getElementById('ai-insights');
    if (!container) return;
    container.innerHTML = `<p class="ai-loading">Asking the AI for a vibe check...</p>`;
    const insights = await fetchAiVibe(title, overview);
    if (insights && insights.vibe_check && insights.smart_tags) {
        container.innerHTML = `<div class="vibe-check"><h3 class="section-title">AI Vibe Check</h3><p>"${insights.vibe_check}"</p></div><div class="smart-tags"><h3 class="section-title">Smart Tags</h3><div class="tags-container">${insights.smart_tags.map(tag => `<span>${tag}</span>`).join('')}</div></div>`;
    } else {
        container.innerHTML = '';
    }
}

/* --- 7. SEARCH LOGIC --- */
// ... (This section remains unchanged)
function openSearch(e) { e.preventDefault(); DOM.body.classList.add('search-open'); DOM.searchOverlay.classList.add('active'); setTimeout(() => DOM.searchInput.focus(), 500); }
function closeSearch() { DOM.body.classList.remove('search-open'); DOM.searchOverlay.classList.remove('active'); setTimeout(() => { DOM.searchInput.value = ''; DOM.searchResultsContainer.innerHTML = ''; }, 500); }
function handleSearchInput() { clearTimeout(debounceTimer); debounceTimer = setTimeout(async () => { const query = DOM.searchInput.value.trim(); if (query.length > 2) { const results = await searchMedia(query); displaySearchResults(results); } else { DOM.searchResultsContainer.innerHTML = ''; } }, 500); }
function displaySearchResults(results) { DOM.searchResultsContainer.innerHTML = ''; if (!results || results.length === 0) { DOM.searchResultsContainer.innerHTML = `<p class="no-results is-visible">No results found.</p>`; return; } results.forEach((item, index) => { if (!item.poster_path) return; const posterElement = document.createElement('a'); posterElement.className = 'search-ui-card'; posterElement.href = '#'; posterElement.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" loading="lazy">`; posterElement.addEventListener('click', (e) => { e.preventDefault(); closeSearch(); setTimeout(() => openDetailsModal(item, posterElement.querySelector('img')), 500); }); DOM.searchResultsContainer.appendChild(posterElement); setTimeout(() => posterElement.classList.add('is-visible'), index * 50); }); }

/* --- 8. SWIPE LOGIC --- */
function setupSwipeHandlers() { if (!DOM.heroSection) return; DOM.heroSection.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; clearInterval(heroInterval); }, { passive: true }); DOM.heroSection.addEventListener('touchmove', e => { touchEndX = e.touches[0].clientX; }, { passive: true }); DOM.heroSection.addEventListener('touchend', () => { if (touchEndX !== 0 && Math.abs(touchStartX - touchEndX) > 50) { if (touchStartX > touchEndX) { currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length; } else { currentHeroIndex = (currentHeroIndex - 1 + heroSlides.length) % heroSlides.length; } updateHeroSlide(currentHeroIndex); } startHeroSlider(); touchStartX = 0; touchEndX = 0; }); }
