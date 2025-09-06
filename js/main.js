/* --- 1. GLOBAL & DOM VARIABLES --- */
// DOM Elements
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
    loadingOverlay: document.getElementById('loading-overlay'),
    // New Search DOM Elements
    searchLink: document.getElementById('search-link'),
    searchOverlay: document.getElementById('search-overlay'),
    searchInput: document.getElementById('search-input'),
    searchResultsHeader: document.getElementById('search-results-header'),
    searchResultsList: document.getElementById('search-results-list'),
};

// State Variables
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval;
let isBg1Active = true;
let touchStartX = 0,
    touchEndX = 0;
let searchDebounceTimer;


/* --- 2. INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [trendingMovies, trendingShows] = await Promise.all([
            fetchMedia('movie', 'trending'),
            fetchMedia('tv', 'trending')
        ]);

        heroSlides = [...trendingMovies, ...trendingShows].filter(Boolean).sort((a, b) => b.popularity - a.popularity).slice(0, 7);

        if (heroSlides.length > 0) setupHero();
        if (trendingMovies?.length > 0) DOM.carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
        if (trendingShows?.length > 0) DOM.carouselsContainer.appendChild(createCarousel('Trending TV Shows', trendingShows));

        loadAdditionalCarousels();
        setupEventListeners();
        setupScrollAnimations();

        DOM.loadingOverlay.classList.remove('active');
        DOM.body.classList.remove('loading-active');

    } catch (error) {
        console.error("Critical error during initialization:", error);
        DOM.body.innerHTML = `<div class="error-message"><h1>Something Went Wrong</h1><p>We couldn't load the necessary data. Please try refreshing the page.</p></div>`;
        DOM.loadingOverlay.classList.remove('active');
    }
});


/* --- 3. EVENT LISTENERS & GLOBAL EFFECTS --- */
function setupEventListeners() {
    window.addEventListener('scroll', () => DOM.mainHeader.classList.toggle('scrolled', window.scrollY > 50));
    DOM.modalOverlay.addEventListener('click', closeModal);
    DOM.modalCloseBtn.addEventListener('click', closeModal);
    DOM.modalScrollContainer.addEventListener('scroll', handleModalScroll);
    window.addEventListener('mousemove', handleGlobalMouseMove);

    // New Search Listeners
    DOM.searchLink.addEventListener('click', openSearch);
    DOM.searchOverlay.addEventListener('click', handleOverlayClick);
    DOM.searchInput.addEventListener('input', handleSearchInput);
    DOM.searchInput.addEventListener('keydown', handleSearchKeyDown);
}

function handleGlobalMouseMove(e) {
    if (DOM.body.classList.contains('search-open') || DOM.body.classList.contains('modal-open')) return;

    const { clientX, clientY } = e;
    const x = ((clientX / window.innerWidth) - 0.5) * 2;
    const y = ((clientY / window.innerHeight) - 0.5) * 2;
    DOM.body.style.setProperty('--mouse-x', `${x * 10}px`);
    DOM.body.style.setProperty('--mouse-y', `${y * 10}px`);
    document.querySelectorAll('.movie-carousel').forEach(carousel => {
        carousel.style.transform = `translateX(${x * -20}px)`;
    });
}

function handleModalScroll() {
    // This function can be filled in later if modal scroll effects are desired
}


/* --- 4. HERO SLIDER LOGIC --- */
function setupHero() {
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

    if (!slideData.details) {
        const mediaType = slideData.media_type || (slideData.title ? 'movie' : 'tv');
        slideData.details = await fetchMediaDetails(mediaType, slideData.id);
    }

    DOM.heroSection.classList.remove('active');
    await updateHeroBackground(slideData.backdrop_path, isFirstLoad);

    setTimeout(() => {
        updateHeroContent(slideData.details);
        DOM.heroSection.classList.add('active');
        updateHeroIndicators(index);
    }, isFirstLoad ? 100 : 600);
}

async function updateHeroBackground(backdropPath, isFirstLoad) {
    const nextBgUrl = backdropPath ? `https://image.tmdb.org/t/p/original${backdropPath}` : '';
    if (!nextBgUrl) return;

    if (!isFirstLoad) {
        try {
            await preloadImage(nextBgUrl);
        } catch (error) {
            console.error("Failed to preload hero image", error);
            return;
        }
    }

    const activeBg = isBg1Active ? DOM.bg1 : DOM.bg2;
    const nextBg = isBg1Active ? DOM.bg2 : DOM.bg1;

    if (isFirstLoad) {
        activeBg.style.backgroundImage = `url(${nextBgUrl})`;
        return;
    }

    nextBg.style.backgroundImage = `url(${nextBgUrl})`;
    activeBg.style.opacity = 0;
    nextBg.style.opacity = 1;
    isBg1Active = !isBg1Active;
}

function updateHeroContent(detailsData) {
    if (!detailsData) return;
    const bestLogo = detailsData?.logos?.find(l => l.iso_639_1 === 'en') || detailsData?.logos?.[0];

    if (bestLogo?.file_path) {
        DOM.heroLogoImg.src = `https://image.tmdb.org/t/p/w500${bestLogo.file_path}`;
        DOM.heroLogoContainer.style.display = 'block';
        DOM.heroTitle.style.display = 'none';
    } else {
        const titleText = detailsData.title || detailsData.name || 'Untitled';
        DOM.heroTitle.innerHTML = titleText.split('').map((char, i) => char.trim() === '' ? ' ' : `<span style="transition-delay: ${i * 25}ms">${char}</span>`).join('');
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
        DOM.heroWatchBtn.href = firstSeason ? `https://www.cineby.app/tv/${detailsData.id}/${firstSeason.season_number}/1?play=true` : '#';
    }
}

function setupSwipeHandlers() {
    DOM.heroSection.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
        touchEndX = touchStartX;
        clearInterval(heroInterval);
    }, { passive: true });

    DOM.heroSection.addEventListener('touchmove', e => {
        touchEndX = e.touches[0].clientX;
    }, { passive: true });

    DOM.heroSection.addEventListener('touchend', () => {
        if (Math.abs(touchStartX - touchEndX) > 50) {
            if (touchStartX > touchEndX) {
                currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
            } else {
                currentHeroIndex = (currentHeroIndex - 1 + heroSlides.length) % heroSlides.length;
            }
            updateHeroSlide(currentHeroIndex);
        }
        startHeroSlider();
    });
}


/* --- 5. UI RENDERING & ANIMATIONS --- */
function setupHeroIndicators() {
    DOM.heroIndicatorsContainer.innerHTML = heroSlides.map(() => `<div class="indicator-bar"><div class="progress"></div></div>`).join('');
    DOM.heroIndicatorsContainer.querySelectorAll('.indicator-bar').forEach((bar, index) => {
        bar.addEventListener('click', () => {
            if (index !== currentHeroIndex) {
                updateHeroSlide(index);
                resetHeroSlider();
            }
        });
    });
}

function updateHeroIndicators(activeIndex) {
    DOM.heroIndicatorsContainer.querySelectorAll('.indicator-bar').forEach((bar, index) => {
        bar.classList.toggle('active', index === activeIndex);
        const progress = bar.querySelector('.progress');
        if (progress) {
            progress.style.transition = 'none';
            progress.style.width = '0%';
            if (index === activeIndex) {
                void progress.offsetWidth;
                progress.style.transition = `width var(--hero-slide-duration) linear`;
                progress.style.width = '100%';
            }
        }
    });
}

function createCarousel(title, mediaItems) {
    if (!mediaItems || mediaItems.length === 0) return document.createDocumentFragment();
    const section = document.createElement('section');
    section.className = 'carousel-section';
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
            openDetailsModal(item, posterLink);
        });
        carouselDiv.appendChild(posterLink);
    });
    section.appendChild(carouselDiv);
    return section;
}

async function loadAdditionalCarousels() {
    const carouselData = [
        { title: 'Popular Movies', type: 'movie', category: 'popular' },
        { title: 'Top Rated Movies', type: 'movie', category: 'top_rated' },
        { title: 'Popular TV Shows', type: 'tv', category: 'popular' },
        { title: 'Top Rated TV Shows', type: 'tv', category: 'top_rated' },
    ];
    for (const data of carouselData) {
        const media = await fetchMedia(data.type, data.category);
        if (media.length > 0) {
            const carousel = createCarousel(data.title, media);
            DOM.carouselsContainer.appendChild(carousel);
        }
    }
    setupScrollAnimations();
}

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
    document.querySelectorAll('.carousel-section').forEach(section => observer.observe(section));
}


/* --- 6. MODAL LOGIC --- */
async function openDetailsModal(mediaItem, clickedElement) {
    if (!mediaItem) return;
    DOM.body.classList.add('loading-active');
    DOM.loadingOverlay.classList.add('active');
    DOM.modalContent.innerHTML = '';
    const mediaType = mediaItem.media_type || (mediaItem.title ? 'movie' : 'tv');
    const details = await fetchMediaDetails(mediaType, mediaItem.id);
    DOM.loadingOverlay.classList.remove('active');
    DOM.body.classList.remove('loading-active');
    if (!details || Object.keys(details).length === 0) {
        DOM.modalContent.innerHTML = '<p>Sorry, details could not be loaded.</p>';
        return;
    }
    const finalHtml = buildModalHtml(details);
    const domUpdate = () => {
        DOM.modalBanner.style.backgroundImage = details.backdrop_path ? `url(https://image.tmdb.org/t/p/original${details.backdrop_path})` : '';
        DOM.modalContent.innerHTML = finalHtml;
        DOM.body.classList.add('modal-open');
        DOM.modalOverlay.classList.add('active');
        DOM.modal.classList.add('active');
        setupModalInteractivity();
        displayAiInsights(details.title || details.name, details.overview);
    };
    if (document.startViewTransition && clickedElement) {
        clickedElement.style.viewTransitionName = 'poster-transition';
        const transition = document.startViewTransition(domUpdate);
        transition.finished.finally(() => {
            clickedElement.style.viewTransitionName = '';
        });
    } else {
        domUpdate();
    }
}

function buildModalHtml(details) {
    const mediaType = details.seasons ? 'tv' : 'movie';
    const year = (details.release_date || details.first_air_date || '').split('-')[0];
    const runtime = details.runtime ? `${details.runtime} min` : (details.episode_run_time?.[0] ? `${details.episode_run_time[0]} min` : '');
    const rating = details.certification || 'N/A';
    const bestLogo = details.logos?.find(l => l.iso_639_1 === 'en') || details.logos?.[0];
    const titleHtml = bestLogo?.file_path ? `<img src="https://image.tmdb.org/t/p/w500${bestLogo.file_path}" class="modal-title-logo" alt="${details.title || details.name}">` : `<h1 class="modal-title-text">${details.title || details.name}</h1>`;
    const filteredCast = details.cast?.filter(c => c.profile_path).slice(0, 15);
    const filteredSeasons = details.seasons?.filter(s => s.poster_path && s.episodes?.length > 0);
    let watchBtnHtml = '';
    if (mediaType === 'movie') {
        watchBtnHtml = `<a href="https://www.cineby.app/movie/${details.id}?play=true" class="modal-watch-btn" target="_blank">Watch Movie</a>`;
    } else if (mediaType === 'tv' && filteredSeasons?.length > 0) {
        const firstSeason = filteredSeasons.find(s => s.season_number > 0) || filteredSeasons[0];
        watchBtnHtml = `<a href="https://www.cineby.app/tv/${details.id}/${firstSeason.season_number}/1?play=true" class="modal-watch-btn" target="_blank">Watch S${firstSeason.season_number} E01</a>`;
    }
    const seasonsHtml = (mediaType === 'tv' && filteredSeasons?.length > 0) ? `
        <div class="modal-seasons">
            <h3 class="section-title">Seasons</h3>
            <div class="seasons-browser">
                <div class="seasons-tabs">${filteredSeasons.map(s => `<button class="season-tab" data-season="${s.season_number}">${s.name}</button>`).join('')}</div>
                <div class="episodes-display">${filteredSeasons.map(s => `<div class="episodes-list" id="season-${s.season_number}-episodes">${s.episodes.map(ep => buildEpisodeHtml(ep, details.id, s.season_number)).join('')}</div>`).join('')}</div>
            </div>
        </div>` : '';
    return `
        <div class="modal-main-details">
            <img src="https://image.tmdb.org/t/p/w500${details.poster_path}" alt="${details.title || details.name}" class="modal-poster">
            <div class="modal-title-group">${titleHtml}<div class="modal-meta">${year ? `<span>${year}</span>` : ''}<span class="rating">${rating}</span>${runtime ? `<span>${runtime}</span>` : ''}</div><div class="modal-genres">${details.genres?.map(g => `<span>${g.name}</span>`).join('') || ''}</div>${watchBtnHtml}</div>
        </div>
        <div class="modal-info-column">
            <div class="modal-overview"><h3 class="section-title">Overview</h3><p>${details.overview || 'No overview available.'}</p></div>
            <div id="ai-insights"></div>
            ${(filteredCast && filteredCast.length > 0) ? `<div class="modal-cast"><h3 class="section-title">Cast</h3><div class="cast-list">${filteredCast.map(member => `<div class="cast-member"><img src="https://image.tmdb.org/t/p/w200${member.profile_path}" alt="${member.name}" loading="lazy"><p>${member.name}</p></div>`).join('')}</div></div>` : ''}
            ${seasonsHtml}
        </div>
    `;
}

function buildEpisodeHtml(episode, showId, seasonNumber) {
    const playIconSvg = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>`;
    const stillPath = episode.still_path ? `https://image.tmdb.org/t/p/w300${episode.still_path}` : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    return `
        <div class="episode-item">
            <div class="episode-thumbnail-container">
                <img src="${stillPath}" alt="${episode.name}" class="episode-thumbnail" loading="lazy">
                <a href="https://www.cineby.app/tv/${showId}/${seasonNumber}/${episode.episode_number}?play=true" class="episode-play-btn" target="_blank" aria-label="Play episode">${playIconSvg}</a>
            </div>
            <div class="episode-info">
                <h5>${episode.episode_number}. ${episode.name}</h5>
                <p>${episode.overview || 'No description available.'}</p>
            </div>
        </div>`;
}

function setupModalInteractivity() {
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
        DOM.modalBanner.style.backgroundImage = '';
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


/* --- 7. SEARCH LOGIC (COMMAND PALETTE REVAMP) --- */
function openSearch(e) {
    if (e) e.preventDefault();
    DOM.body.classList.add('search-open');
    DOM.searchOverlay.classList.add('active');
    setTimeout(() => DOM.searchInput.focus(), 400);
}

function closeSearch() {
    DOM.body.classList.remove('search-open');
    DOM.searchOverlay.classList.remove('active');
    setTimeout(() => {
        DOM.searchInput.value = '';
        DOM.searchResultsList.innerHTML = '';
        DOM.searchResultsHeader.textContent = '';
    }, 400);
}

function handleOverlayClick(e) {
    if (e.target === DOM.searchOverlay) {
        closeSearch();
    }
}

function handleSearchKeyDown(e) {
    if (e.key === 'Escape') {
        closeSearch();
    }
    if (e.key === 'Enter') {
        e.preventDefault();
        const query = DOM.searchInput.value.trim();
        if (query.length > 3) {
            triggerAiSearch(query);
        }
    }
}

function handleSearchInput() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(async () => {
        const query = DOM.searchInput.value.trim();
        if (query.length > 2) {
            const results = await searchMedia(query);
            displaySearchResults(results, "Top Results");
        } else {
            DOM.searchResultsList.innerHTML = '';
            DOM.searchResultsHeader.textContent = '';
        }
    }, 350);
}

async function triggerAiSearch(query) {
    DOM.searchResultsList.innerHTML = '<p class="ai-loading" style="text-align:center; padding: 2rem;">Asking the AI...</p>';
    DOM.searchResultsHeader.textContent = 'AI Discovery';
    const results = await fetchAiSearchResults(query);
    displaySearchResults(results, `AI Discovery for "${query}"`);
}

function displaySearchResults(results, title) {
    DOM.searchResultsList.innerHTML = '';
    DOM.searchResultsHeader.textContent = title;

    if (!results || results.length === 0) {
        DOM.searchResultsList.innerHTML = `<div class="search-result-item is-visible"><div class="search-item-info"><h3>No results found.</h3></div></div>`;
        return;
    }

    const validResults = results.filter(item => item.poster_path);

    validResults.forEach((item, index) => {
        const listItem = document.createElement('div');
        listItem.className = 'search-result-item';
        const year = (item.release_date || item.first_air_date || '').split('-')[0] || 'N/A';
        const mediaType = item.media_type === 'tv' ? 'TV Show' : 'Movie';
        listItem.innerHTML = `
            <div class="search-item-poster">
                <img src="https://image.tmdb.org/t/p/w200${item.poster_path}" alt="${item.title || item.name}" loading="lazy">
            </div>
            <div class="search-item-info">
                <h3>${item.title || item.name}</h3>
                <p>${year} &bull; ${mediaType}</p>
            </div>
        `;
        listItem.addEventListener('click', () => {
            openDetailsModal(item, null);
            closeSearch();
        });
        DOM.searchResultsList.appendChild(listItem);
        setTimeout(() => listItem.classList.add('is-visible'), index * 50);
    });
}


/* --- 8. UTILITIES --- */
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = img.onabort = () => reject(src);
        img.src = src;
    });
}
