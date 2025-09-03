// --- Global variables for the Hero Slider ---
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval;
let touchStartX = 0;
let touchEndX = 0;

// --- Main execution block ---
document.addEventListener('DOMContentLoaded', async () => {
    const [trendingMovies, trendingShows] = await Promise.all([
        fetchMedia('movie', 'trending'),
        fetchMedia('tv', 'trending')
    ]);

    heroSlides = [...trendingMovies, ...trendingShows]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 7);

    if (heroSlides.length > 0) {
        setupHeroIndicators();
        setupSwipeHandlers();
        startHeroSlider();
    }

    const carouselsContainer = document.getElementById('content-carousels');
    if (trendingMovies && trendingMovies.length > 0) {
        carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
    }
    if (trendingShows && trendingShows.length > 0) {
        carouselsContainer.appendChild(createCarousel('Trending TV Shows', trendingShows));
    }
    
    setupScrollAnimations();
});

// --- Event Listeners ---
window.addEventListener('scroll', () => {
    document.querySelector('.main-header').classList.toggle('scrolled', window.scrollY > 50);
});

// --- Hero Section Functions ---
function setupHeroIndicators() {
    const indicatorsContainer = document.querySelector('.hero-content .hero-indicators');
    indicatorsContainer.innerHTML = '';
    heroSlides.forEach(() => {
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
    
    heroBackground.style.animation = 'none';
    void heroBackground.offsetWidth;
    heroBackground.style.animation = '';

    const mediaType = slideData.media_type || (slideData.title ? 'movie' : 'tv');
    
    // SIMPLIFIED: We only need to fetch the images.
    const imagesData = await fetchMediaImages(mediaType, slideData.id);

    setTimeout(() => {
        heroBackground.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${slideData.backdrop_path})`;
        heroDescription.textContent = slideData.overview;

        // Smart Logo Selection Logic
        let bestLogo = null;
        if (imagesData && imagesData.logos && imagesData.logos.length > 0) {
            // Priority 1: Find the official English logo (most likely to be the special branded one).
            bestLogo = imagesData.logos.find(logo => logo.iso_639_1 === 'en');
            // Priority 2: If no English logo, fall back to the very first logo available.
            if (!bestLogo) {
                bestLogo = imagesData.logos[0];
            }
        }

        if (bestLogo) {
            heroLogoImg.src = `https://image.tmdb.org/t/p/w500${bestLogo.file_path}`;
            heroLogoImg.parentElement.style.display = 'block';
        } else {
            heroLogoImg.parentElement.style.display = 'none';
        }

        heroSection.classList.add('active');
        updateHeroIndicators(index);
    }, 500);
}

function startHeroSlider() {
    clearInterval(heroInterval);
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
    heroSection.addEventListener('touchstart', (evt) => {
        touchStartX = evt.touches[0].clientX;
        clearInterval(heroInterval);
    }, { passive: true });
    heroSection.addEventListener('touchmove', (evt) => {
        touchEndX = evt.touches[0].clientX;
    }, { passive: true });
    heroSection.addEventListener('touchend', () => {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) { // Swiped left
                currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
            } else { // Swiped right
                currentHeroIndex = (currentHeroIndex - 1 + heroSlides.length) % heroSlides.length;
            }
        }
        startHeroSlider();
    });
}

// --- Carousel and Animation Functions ---
function createCarousel(title, mediaItems) {
    const section = document.createElement('section');
    section.className = 'carousel-section';
    const h2 = document.createElement('h2');
    h2.textContent = title;
    section.appendChild(h2);
    const carouselDiv = document.createElement('div');
    carouselDiv.className = 'movie-carousel';
    mediaItems.forEach(item => {
        if (!item.poster_path) return;
        const posterLink = document.createElement('a');
        posterLink.className = 'movie-poster';
        const img = document.createElement('img');
        img.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
        img.alt = item.title || item.name;
        img.loading = 'lazy';
        posterLink.appendChild(img);
        carouselDiv.appendChild(posterLink);
    });
    section.appendChild(carouselDiv);
    return section;
}

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    setTimeout(() => {
        document.querySelectorAll('.carousel-section').forEach(section => {
            observer.observe(section);
        });
    }, 100);
}
