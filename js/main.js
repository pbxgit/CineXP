/* --- 1. GLOBAL & DOM VARIABLES --- */
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval;
let isBg1Active = true;
let touchStartX = 0;
let touchEndX = 0;

// Cache DOM elements for performance
const bg1 = document.querySelector('.hero-background');
const bg2 = document.querySelector('.hero-background-next');
const heroSection = document.getElementById('hero-section');
const modalOverlay = document.getElementById('details-modal-overlay');
const modal = document.getElementById('details-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');

/* --- 2. INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', async () => {
    const [trendingMovies, trendingShows] = await Promise.all([
        fetchMedia('movie', 'trending'),
        fetchMedia('tv', 'trending')
    ]);

    heroSlides = [...trendingMovies, ...trendingShows]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 7);

    if (heroSlides.length > 0) {
        setupHero();
    }

    const carouselsContainer = document.getElementById('content-carousels');
    carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
    carouselsContainer.appendChild(createCarousel('Trending TV Shows', trendingShows));

    setupScrollAnimations();
    setupEventListeners();
});

/* --- 3. EVENT LISTENERS --- */
function setupEventListeners() {
    window.addEventListener('scroll', () => {
        document.querySelector('.main-header').classList.toggle('scrolled', window.scrollY > 50);
    });

    modalOverlay.addEventListener('click', closeModal);
    modalCloseBtn.addEventListener('click', closeModal);
}

/* --- 4. HERO SLIDER LOGIC --- */
function setupHero() {
    setupHeroIndicators();
    setupSwipeHandlers();
    startHeroSlider();
    updateHeroSlide(currentHeroIndex, true); // Initial load
}

function startHeroSlider() {
    clearInterval(heroInterval);
    const slideDuration = 10000; // 10 seconds
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
    currentHeroIndex = index;
    const slideData = heroSlides[index];

    // --- Preload next image for seamless transition ---
    const nextIndex = (index + 1) % heroSlides.length;
    const nextSlide = heroSlides[nextIndex];
    new Image().src = `https://image.tmdb.org/t/p/original${nextSlide.backdrop_path}`;

    heroSection.classList.remove('active');

    const mediaType = slideData.media_type || (slideData.title ? 'movie' : 'tv');
    const [detailsData, imagesData] = await Promise.all([
        fetchMediaDetails(mediaType, slideData.id),
        fetchMediaImages(mediaType, slideData.id)
    ]);

    updateHeroBackground(slideData.backdrop_path, isFirstLoad);

    setTimeout(() => {
        updateHeroContent(detailsData, imagesData, slideData); // Pass slideData
        heroSection.classList.add('active');
        updateHeroIndicators(index);
    }, 500);
}

function updateHeroBackground(backdropPath, isFirstLoad) {
    const nextBgUrl = `url(https://image.tmdb.org/t/p/original${backdropPath})`;
    if (isFirstLoad) {
        bg1.style.backgroundImage = nextBgUrl;
    } else {
        const activeBg = isBg1Active ? bg1 : bg2;
        const nextBg = isBg1Active ? bg2 : bg1;
        nextBg.style.backgroundImage = nextBgUrl;
        activeBg.style.opacity = 0;
        nextBg.style.opacity = 1;
        isBg1Active = !isBg1Active;
    }
}

function updateHeroContent(detailsData, imagesData, slideData) {
    const heroContent = heroSection.querySelector('.hero-content');
    const heroLogoContainer = heroContent.querySelector('.hero-logo-container');
    const heroLogoImg = heroContent.querySelector('.hero-logo');
    const heroTitle = heroContent.querySelector('.hero-title');
    const heroTagline = heroContent.querySelector('.hero-tagline');

    const bestLogo = imagesData?.logos?.find(l => l.iso_639_1 === 'en' && l.file_path.endsWith('.svg')) || imagesData?.logos?.find(l => l.iso_639_1 === 'en') || imagesData?.logos?.[0];

    if (bestLogo?.file_path) {
        heroLogoContainer.style.display = 'block';
        heroTitle.style.display = 'none';
        heroLogoImg.src = `https://image.tmdb.org/t/p/w500${bestLogo.file_path}`;
    } else {
        heroLogoContainer.style.display = 'none';
        heroTitle.style.display = 'block';
        heroTitle.textContent = slideData.title || slideData.name;
    }

    heroTagline.textContent = detailsData?.tagline || '';
    heroTagline.style.display = detailsData?.tagline ? 'block' : 'none';
}


/* --- 5. UI & ANIMATION HELPERS --- */
function setupHeroIndicators() {
    const indicatorsContainer = document.querySelector('.hero-content .hero-indicators');
    indicatorsContainer.innerHTML = '';
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
        indicatorsContainer.appendChild(bar);
    });
}

function updateHeroIndicators(index) {
    document.querySelectorAll('.indicator-bar').forEach((bar, i) => {
        bar.classList.remove('active');
        const progress = bar.querySelector('.progress');
        if (progress) {
            progress.style.transition = 'none';
            progress.style.width = '0%';
            void progress.offsetWidth; // Trigger reflow
            if (i === index) {
                bar.classList.add('active');
                progress.style.transition = `width var(--hero-slide-duration) linear`;
                progress.style.width = '100%';
            }
        }
    });
}


function createCarousel(title, mediaItems) {
    const section = document.createElement('section');
    section.className = 'carousel-section';
    section.innerHTML = `<h2>${title}</h2>`;
    const carouselDiv = document.createElement('div');
    carouselDiv.className = 'movie-carousel';

    mediaItems.forEach(item => {
        if (!item.poster_path) return;
        const posterLink = document.createElement('a');
        posterLink.className = 'movie-poster';
        posterLink.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" loading="lazy">`;

        posterLink.addEventListener('click', () => openDetailsModal(item));

        carouselDiv.appendChild(posterLink);
    });
    section.appendChild(carouselDiv);
    return section;
}

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries).forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    }), {
        threshold: 0.1
    });
    setTimeout(() => {
        document.querySelectorAll('.carousel-section').forEach(section => observer.observe(section));
    }, 100);
}

/* --- 6. MODAL LOGIC --- */
async function openDetailsModal(mediaItem) {
    document.body.classList.add('modal-open');
    modalOverlay.classList.remove('hidden');
    modal.classList.remove('hidden');

    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = '<p>Loading...</p>'; // Loading state

    // Fetch full details
    const mediaType = mediaItem.media_type || (mediaItem.title ? 'movie' : 'tv');
    const details = await fetchMediaDetails(mediaType, mediaItem.id);

    // Populate modal
    modalContent.innerHTML = `
        <h1>${details.title || details.name}</h1>
        <p>${details.overview}</p>
        <p><strong>Release Date:</strong> ${details.release_date || details.first_air_date}</p>
        <p><strong>Rating:</strong> ${details.vote_average.toFixed(1)} / 10</p>
    `;
}

function closeModal() {
    document.body.classList.remove('modal-open');
    modalOverlay.classList.add('hidden');
    modal.classList.add('hidden');
}

/* --- 7. SWIPE LOGIC --- */
function setupSwipeHandlers() {
    heroSection.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        clearInterval(heroInterval);
    }, {
        passive: true
    });
    heroSection.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
    }, {
        passive: true
    });
    heroSection.addEventListener('touchend', () => {
        if (Math.abs(touchStartX - touchEndX) > 50) {
            if (touchStartX > touchEndX) { // Swiped left
                currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
            } else { // Swiped right
                currentHeroIndex = (currentHeroIndex - 1 + heroSlides.length) % heroSlides.length;
            }
            updateHeroSlide(currentHeroIndex);
        }
        startHeroSlider();
    });
}
