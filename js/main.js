// --- Global variables for the Hero Slider ---
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval;
let touchStartX = 0;
let touchEndX = 0;

// --- Main execution block ---
document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. Fetch and combine top movies and TV shows ---
    const [trendingMovies, trendingShows] = await Promise.all([
        fetchMedia('movie', 'trending'),
        fetchMedia('tv', 'trending')
    ]);

    // Combine, sort by popularity, and take the top 7 for the hero
    heroSlides = [...trendingMovies, ...trendingShows]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 7);

    // --- 2. Initialize Hero Section ---
    if (heroSlides.length > 0) {
        setupHeroIndicators();
        setupSwipeHandlers();
        startHeroSlider();
    }

    // --- 3. Create Content Carousels (using the fetched data) ---
    const carouselsContainer = document.getElementById('content-carousels');
    if (trendingMovies && trendingMovies.length > 0) {
        carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
    }
    const popularTvShows = await fetchMedia('tv', 'popular'); // Fetch another category
    if (popularTvShows && popularTvShows.length > 0) {
        carouselsContainer.appendChild(createCarousel('Popular TV Shows', popularTvShows));
    }

    // --- 4. Initialize animations ---
    setupScrollAnimations();
});

// --- Event Listeners ---
window.addEventListener('scroll', () => {
    const header = document.querySelector('.main-header');
    header.classList.toggle('scrolled', window.scrollY > 50);
});

// --- Hero Section Functions ---

function setupHeroIndicators() {
    const indicatorsContainer = document.querySelector('.hero-indicators');
    indicatorsContainer.innerHTML = ''; // Clear any existing indicators
    heroSlides.forEach((_, i) => {
        const bar = document.createElement('div');
        bar.className = 'indicator-bar';
        bar.innerHTML = `<div class="progress"></div>`;
        indicatorsContainer.appendChild(bar);
    });
}

function updateHeroIndicators(index) {
    document.querySelectorAll('.indicator-bar').forEach((bar, i) => {
        bar.classList.toggle('active', i === index);
    });
}

async function updateHeroSlide(index) {
    const slideData = heroSlides[index];
    const heroSection = document.getElementById('hero-section');
    const heroBackground = heroSection.querySelector('.hero-background');
    const heroLogoImg = heroSection.querySelector('.hero-logo');
    const heroDescription = heroSection.querySelector('.hero-description');

    heroSection.classList.remove('active');
    
    // Reset and restart Ken Burns animation for a fresh effect on each slide
    heroBackground.style.animation = 'none';
    void heroBackground.offsetWidth; // Trigger reflow
    heroBackground.style.animation = '';

    const mediaType = slideData.media_type || (slideData.title ? 'movie' : 'tv');
    const logoData = await fetchMediaImages(mediaType, slideData.id);

    setTimeout(() => {
        heroBackground.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${slideData.backdrop_path})`;
        heroDescription.textContent = slideData.overview;

        if (logoData && logoData.file_path) {
            heroLogoImg.src = `https://image.tmdb.org/t/p/w500${logoData.file_path}`;
            heroLogoImg.style.display = 'block';
        } else {
            heroLogoImg.style.display = 'none';
        }

        heroSection.classList.add('active');
        updateHeroIndicators(index);
    }, 500);
}

function startHeroSlider() {
    clearInterval(heroInterval); // Clear existing timer
    updateHeroSlide(currentHeroIndex);
    const slideDuration = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hero-slide-duration')) * 1000;
    heroInterval = setInterval(() => {
        currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
        updateHeroSlide(currentHeroIndex);
    }, slideDuration);
}

// --- Swipe Gesture Functions ---

function setupSwipeHandlers() {
    const heroSection = document.getElementById('hero-section');
    heroSection.addEventListener('touchstart', handleTouchStart, false);
    heroSection.addEventListener('touchmove', handleTouchMove, false);
    heroSection.addEventListener('touchend', handleTouchEnd, false);
}

function handleTouchStart(evt) {
    touchStartX = evt.touches[0].clientX;
    clearInterval(heroInterval); // Pause slider on interaction
}

function handleTouchMove(evt) {
    touchEndX = evt.touches[0].clientX;
}

function handleTouchEnd() {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) { // Threshold for a valid swipe
        if (diff > 0) { // Swiped left
            currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
        } else { // Swiped right
            currentHeroIndex = (currentHeroIndex - 1 + heroSlides.length) % heroSlides.length;
        }
    }
    startHeroSlider(); // Resume slider after interaction
}


// --- Carousel and Animation Functions (Unchanged) ---
function createCarousel(title, mediaItems) { /* ... same as before ... */ }
function setupScrollAnimations() { /* ... same as before ... */ }
