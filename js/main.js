/* --- 1. GLOBAL & DOM VARIABLES --- */
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval;
let isBg1Active = true;
let touchStartX = 0,
    touchEndX = 0;
let debounceTimer;

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
    carouselsContainer: document.getElementById('content-carousels'),
    modalOverlay: document.getElementById('details-modal-overlay'),
    modal: document.getElementById('details-modal'),
    modalContent: document.querySelector('#details-modal .modal-content'),
    modalBanner: document.querySelector('#details-modal .modal-banner'),
    modalScrollContainer: document.getElementById('modal-scroll-container'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    searchLink: document.getElementById('search-link'),
    searchOverlay: document.getElementById('search-overlay'),
    searchCloseBtn: document.getElementById('search-close-btn'),
    searchInput: document.getElementById('search-input'),
    searchResultsContainer: document.getElementById('search-results-container'),
};

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
        setupScrollAnimations();
        setupEventListeners();
    } catch (error) {
        console.error("Failed to initialize the application:", error);
    }
});

/* --- 3. EVENT LISTENERS --- */
function setupEventListeners() {
    if (DOM.mainHeader) {
        window.addEventListener('scroll', () => {
            DOM.mainHeader.classList.toggle('scrolled', window.scrollY > 50);
        });
    }
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
    const mediaType = slideData.media_type || (slideData.title ? 'movie' : 'tv');
    // FIX: Replaced fetchMediaImages with the more powerful fetchMediaDetails which now includes logos
    const detailsData = await fetchMediaDetails(mediaType, slideData.id);
    updateHeroBackground(slideData.backdrop_path, isFirstLoad);
    setTimeout(() => {
        updateHeroContent(detailsData, slideData);
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
        DOM.heroTitle.textContent = slideData.title || slideData.name || 'Untitled';
        DOM.heroTitle.style.display = 'block';
        DOM.heroLogoContainer.style.display = 'none';
    }

    if (detailsData?.tagline) {
        DOM.heroTagline.textContent = detailsData.tagline;
        DOM.heroTagline.style.display = 'block';
    } else {
        DOM.heroTagline.style.display = 'none';
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
    mediaItems.forEach(item => {
        if (!item?.poster_path) return;
        const posterLink = document.createElement('a');
        posterLink.className = 'movie-poster';
        posterLink.href = '#';
        posterLink.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" loading="lazy">`;
        posterLink.addEventListener('click', (e) => {
            e.preventDefault();
            openDetailsModal(item);
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
async function openDetailsModal(mediaItem) {
    if (!DOM.modal || !mediaItem) return;

    DOM.modalContent.innerHTML = '';
    DOM.modalBanner.style.backgroundImage = '';
    DOM.modal.classList.remove('active');
    DOM.body.classList.add('modal-open');
    DOM.modalOverlay.classList.add('active');
    setTimeout(() => DOM.modal.classList.add('active'), 50);

    const mediaType = mediaItem.media_type || (mediaItem.title ? 'movie' : 'tv');
    const details = await fetchMediaDetails(mediaType, mediaItem.id);

    if (!details || Object.keys(details).length === 0) {
        DOM.modalContent.innerHTML = '<p>Sorry, details could not be loaded.</p>';
        return;
    }

    DOM.modalBanner.style.backgroundImage = details.backdrop_path ? `url(https://image.tmdb.org/t/p/original${details.backdrop_path})` : '';

    const year = (details.release_date || details.first_air_date || '').split('-')[0];
    const runtime = details.runtime ? `${details.runtime} min` : (details.episode_run_time?.length > 0 ? `${details.episode_run_time[0]} min` : '');
    const rating = details.certification || 'N/A';
    const bestLogo = details.logos?.find(l => l.iso_639_1 === 'en') || details.logos?.[0];

    const titleHtml = bestLogo?.file_path ?
        `<img src="https://image.tmdb.org/t/p/w500${bestLogo.file_path}" class="modal-title-logo" alt="${details.title || details.name}">` :
        `<h1 class="modal-title-text">${details.title || details.name}</h1>`;

    // FIX: Filter cast members without profile pictures before mapping
    const castHtml = details.cast?.filter(c => c.profile_path).map(member => `
        <div class="cast-member">
            <img src="https://image.tmdb.org/t/p/w200${member.profile_path}" alt="${member.name}">
            <p>${member.name}</p>
        </div>`).join('') || '';

    // FIX: Filter seasons without posters or episodes before mapping
    const seasonsHtml = (mediaType === 'tv' && details.seasons?.length > 0) ? `
        <div class="modal-seasons">
            <h3 class="section-title">Seasons</h3>
            <div class="seasons-list">
                ${details.seasons.filter(s => s.poster_path && s.episodes?.length > 0).map(season => `
                    <div class="season-item">
                        <div class="season-header">
                            <img src="https://image.tmdb.org/t/p/w200${season.poster_path}" alt="${season.name}" class="season-poster">
                            <div class="season-info">
                                <h4>${season.name}</h4>
                                <p>${season.episode_count} Episodes</p>
                            </div>
                        </div>
                        <div class="episodes-container">
                            ${season.episodes.map(ep => `
                                <div class="episode-item">
                                    <span class="episode-number">${ep.episode_number}.</span>
                                    <p class="episode-title">${ep.name}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    DOM.modalContent.innerHTML = `
        <div class="modal-main-details">
            <img src="${details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : ''}" alt="${details.title || details.name}" class="modal-poster">
            <div class="modal-title-group">
                ${titleHtml}
                <div class="modal-meta">
                    ${year ? `<span>${year}</span>` : ''}
                    <span class="rating">${rating}</span>
                    ${runtime ? `<span>${runtime}</span>` : ''}
                </div>
                <div class="modal-genres">
                    ${details.genres?.map(g => `<span>${g.name}</span>`).join('') || ''}
                </div>
            </div>
        </div>
        <div class="modal-overview">
            <p>${details.overview || ''}</p>
        </div>
        ${castHtml ? `<div class="modal-cast"><h3 class="section-title">Cast</h3><div class="cast-list">${castHtml}</div></div>` : ''}
        ${seasonsHtml ? seasonsHtml : ''}
    `;

    document.querySelectorAll('.season-item').forEach(item => {
        item.addEventListener('click', () => {
            // FIX: Allow only one season to be open at a time for a cleaner UI
            if (item.classList.contains('active')) {
                item.classList.remove('active');
            } else {
                document.querySelectorAll('.season-item.active').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            }
        });
    });
}

function closeModal() {
    DOM.body.classList.remove('modal-open');
    DOM.modalOverlay.classList.remove('active');
    DOM.modal.classList.remove('active');
    setTimeout(() => {
        if (DOM.modalScrollContainer) DOM.modalScrollContainer.scrollTop = 0;
    }, 600);
}

/* --- 7. AWWWARDS-LEVEL SEARCH LOGIC --- */
function openSearch(e) {
    e.preventDefault();
    DOM.body.classList.add('search-open');
    DOM.searchOverlay.classList.add('active');
    setTimeout(() => DOM.searchInput.focus(), 400);
}

function closeSearch() {
    DOM.body.classList.remove('search-open');
    DOM.searchOverlay.classList.remove('active');
    setTimeout(() => {
        DOM.searchInput.value = '';
        DOM.searchResultsContainer.innerHTML = '';
    }, 400);
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
    if (results.length === 0) {
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
        posterElement.className = 'movie-poster';
        posterElement.href = '#';
        posterElement.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" loading="lazy">`;
        posterElement.addEventListener('click', (e) => {
            e.preventDefault();
            closeSearch();
            setTimeout(() => openDetailsModal(item), 400);
        });
        DOM.searchResultsContainer.appendChild(posterElement);
        setTimeout(() => {
            posterElement.classList.add('is-visible');
        }, index * 50);
    });
}

/* --- 8. SWIPE LOGIC --- */
function setupSwipeHandlers() {
    if (!DOM.heroSection) return;
    DOM.heroSection.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        clearInterval(heroInterval);
    }, {
        passive: true
    });
    DOM.heroSection.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
    }, {
        passive: true
    });
    DOM.heroSection.addEventListener('touchend', () => {
        if (touchEndX !== 0 && Math.abs(touchStartX - touchEndX) > 50) {
            if (touchStartX > touchEndX) {
                currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
            } else {
                currentHeroIndex = (currentHeroIndex - 1 + heroSlides.length) % heroSlides.length;
            }
            updateHeroSlide(currentHeroIndex);
        }
        startHeroSlider();
        touchStartX = 0;
        touchEndX = 0;
    });
}
