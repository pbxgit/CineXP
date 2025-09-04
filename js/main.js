/* --- 1. GLOBAL & DOM VARIABLES --- */
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval;
let isBg1Active = true;
let touchStartX = 0, touchEndX = 0;

// Cache all DOM elements we will interact with for performance and easy access
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
    modalCloseBtn: document.getElementById('modal-close-btn')
};

/* --- 2. INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [trendingMovies, trendingShows] = await Promise.all([
            fetchMedia('movie', 'trending'),
            fetchMedia('tv', 'trending')
        ]);

        heroSlides = [...trendingMovies, ...trendingShows]
            .filter(Boolean) // Remove any null/undefined entries
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 7);

        if (heroSlides.length > 0) {
            setupHero();
        }

        if (trendingMovies?.length > 0) {
            DOM.carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
        }
        if (trendingShows?.length > 0) {
            DOM.carouselsContainer.appendChild(createCarousel('Trending TV Shows', trendingShows));
        }

        setupScrollAnimations();
        setupEventListeners();
    } catch (error) {
        console.error("Failed to initialize the application:", error);
        // ROBUSTNESS: You could display a user-friendly error message here
    }
});

/* --- 3. EVENT LISTENERS --- */
function setupEventListeners() {
    // ROBUSTNESS: Check if elements exist before adding listeners
    if (DOM.mainHeader) {
        window.addEventListener('scroll', () => {
            DOM.mainHeader.classList.toggle('scrolled', window.scrollY > 50);
        });
    }
    if (DOM.modalOverlay) DOM.modalOverlay.addEventListener('click', closeModal);
    if (DOM.modalCloseBtn) DOM.modalCloseBtn.addEventListener('click', closeModal);
}

/* --- 4. HERO SLIDER LOGIC --- */
function setupHero() {
    if (!DOM.heroSection) return; // Don't run if the hero section isn't on the page
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
    const [detailsData, imagesData] = await Promise.all([
        fetchMediaDetails(mediaType, slideData.id),
        fetchMediaImages(mediaType, slideData.id)
    ]);

    updateHeroBackground(slideData.backdrop_path, isFirstLoad);

    setTimeout(() => {
        updateHeroContent(detailsData, imagesData, slideData);
        DOM.heroSection.classList.add('active');
        updateHeroIndicators(index);
    }, 600);
}

function updateHeroBackground(backdropPath, isFirstLoad) {
    const nextBgUrl = `url(https://image.tmdb.org/t/p/original${backdropPath})`;
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

function updateHeroContent(detailsData, imagesData, slideData) {
    const logos = imagesData?.logos || [];
    const bestLogo = logos.find(l => l.iso_639_1 === 'en' && l.file_path.endsWith('.svg')) || logos.find(l => l.iso_639_1 === 'en') || logos[0];

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
            void progress.offsetWidth; // Trigger reflow
            if (index === activeIndex) {
                bar.classList.add('active');
                progress.style.transition = `width var(--hero-slide-duration) linear`;
                progress.style.width = '100%';
            }
        }
    });
}

function createCarousel(title, mediaItems) {
    // ROBUSTNESS: Ensure mediaItems is a valid array before proceeding
    if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
        return document.createDocumentFragment(); // Return an empty element
    }
    const section = document.createElement('section');
    section.className = 'carousel-section';
    section.innerHTML = `<h2>${title}</h2>`;
    const carouselDiv = document.createElement('div');
    carouselDiv.className = 'movie-carousel';
    mediaItems.forEach(item => {
        if (!item?.poster_path) return; // Use optional chaining for safety
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
    // ROBUSTNESS: Don't create an observer if there's nothing to observe
    if (sectionsToAnimate.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    sectionsToAnimate.forEach(section => observer.observe(section));
}

/* --- 6. MODAL LOGIC --- */
async function openDetailsModal(mediaItem) {
    if (!DOM.modal || !mediaItem) return;
    DOM.body.classList.add('modal-open');
    DOM.modalOverlay.classList.add('active');
    DOM.modal.classList.add('active');
    DOM.modalContent.innerHTML = '<p>Loading...</p>';
    const mediaType = mediaItem.media_type || (mediaItem.title ? 'movie' : 'tv');
    const details = await fetchMediaDetails(mediaType, mediaItem.id);

    // ROBUSTNESS: Use optional chaining and provide defaults for API data
    const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
    DOM.modalContent.innerHTML = `
        <h1>${details.title || details.name || 'Untitled'}</h1>
        <p>${details.overview || 'No description available.'}</p>
        <p><strong>Release Date:</strong> ${details.release_date || details.first_air_date || 'Unknown'}</p>
        <p><strong>Rating:</strong> ${rating} / 10</p>
    `;
}

function closeModal() {
    // FIX: Corrected typo `document..body` to `DOM.body` (document.body)
    DOM.body.classList.remove('modal-open');
    DOM.modalOverlay.classList.remove('active');
    DOM.modal.classList.remove('active');
}

/* --- 7. SWIPE LOGIC --- */
function setupSwipeHandlers() {
    if (!DOM.heroSection) return;
    DOM.heroSection.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        clearInterval(heroInterval);
    }, { passive: true });
    DOM.heroSection.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
    }, { passive: true });
    DOM.heroSection.addEventListener('touchend', () => {
        // ROBUSTNESS: Ensure touchEndX has been set to avoid firing on a simple tap
        if (touchEndX !== 0 && Math.abs(touchStartX - touchEndX) > 50) {
            if (touchStartX > touchEndX) {
                currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
            } else {
                currentHeroIndex = (currentHeroIndex - 1 + heroSlides.length) % heroSlides.length;
            }
            updateHeroSlide(currentHeroIndex);
        }
        startHeroSlider();
        // Reset coordinates
        touchStartX = 0;
        touchEndX = 0;
    });
}
