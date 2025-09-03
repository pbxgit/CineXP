/* --- 1. GLOBAL VARIABLES --- */
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval;
let bg1, bg2, isBg1Active = true;
let touchStartX = 0, touchEndX = 0;

/* --- 2. INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', async () => {
    bg1 = document.querySelector('.hero-background');
    bg2 = document.querySelector('.hero-background-next');

    const [trendingMovies, trendingShows] = await Promise.all([
        fetchMedia('movie', 'trending'),
        fetchMedia('tv', 'trending')
    ]);
    heroSlides = [...trendingMovies, ...trendingShows].sort((a, b) => b.popularity - a.popularity).slice(0, 7);

    if (heroSlides.length > 0) {
        setupHeroIndicators();
        setupSwipeHandlers();
        startHeroSlider();
    }
    // Setup carousels...
    const carouselsContainer = document.getElementById('content-carousels');
    carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
    carouselsContainer.appendChild(createCarousel('Trending TV Shows', trendingShows));
    setupScrollAnimations();
});

/* --- 3. HERO SLIDER LOGIC --- */
async function updateHeroSlide(index, isFirstLoad = false) {
    const slideData = heroSlides[index];
    const heroSection = document.getElementById('hero-section');
    const heroLogoContainer = heroSection.querySelector('.hero-logo-container');
    const heroLogoImg = heroSection.querySelector('.hero-logo');
    const heroTagline = heroSection.querySelector('.hero-tagline');
    heroSection.classList.remove('active');

    const mediaType = slideData.media_type || (slideData.title ? 'movie' : 'tv');
    
    const [detailsData, imagesData] = await Promise.all([
        fetchMediaDetails(mediaType, slideData.id),
        fetchMediaImages(mediaType, slideData.id)
    ]);

    // Seamless Background Logic (Unchanged)
    const nextBgUrl = `url(https://image.tmdb.org/t/p/original${slideData.backdrop_path})`;
    if (isFirstLoad) { bg1.style.backgroundImage = nextBgUrl; }
    else {
        const activeBg = isBg1Active ? bg1 : bg2; const nextBg = isBg1Active ? bg2 : bg1;
        nextBg.style.backgroundImage = nextBgUrl; nextBg.style.opacity = 1; activeBg.style.opacity = 0;
        setTimeout(() => { activeBg.style.backgroundImage = ''; }, 2000);
        isBg1Active = !isBg1Active;
    }

    // Content Update Logic
    setTimeout(() => {
        // Handle Tagline
        heroTagline.textContent = detailsData.tagline || '';
        heroTagline.style.display = detailsData.tagline ? 'block' : 'none';

        // --- ROBUST LOGO FIX ---
        // 1. Assume we should hide the logo container by default.
        heroLogoContainer.style.display = 'none';
        
        // 2. Check if the API returned a valid logos array with items in it.
        if (imagesData && imagesData.logos && imagesData.logos.length > 0) {
            // 3. Find the best available logo (English preferred, otherwise the first one).
            const bestLogo = imagesData.logos.find(l => l.iso_639_1 === 'en') || imagesData.logos[0];
            
            // 4. If a logo is successfully found, update the image and show the container.
            if (bestLogo && bestLogo.file_path) {
                heroLogoImg.src = `https://image.tmdb.org/t/p/w500${bestLogo.file_path}`;
                heroLogoContainer.style.display = 'block';
            }
        } else {
            // Optional: Log for debugging when a movie has no logos.
            console.log(`No logos found for: ${slideData.title || slideData.name}`);
        }
        
        heroSection.classList.add('active');
        updateHeroIndicators(index);
    }, 500);
}


/* --- 4. SWIPE LOGIC & HELPERS --- */
function setupSwipeHandlers() {
    const heroSection = document.getElementById('hero-section');
    heroSection.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; clearInterval(heroInterval); }, { passive: true });
    heroSection.addEventListener('touchmove', (e) => { touchEndX = e.touches[0].clientX; }, { passive: true });
    heroSection.addEventListener('touchend', () => {
        if (Math.abs(touchStartX - touchEndX) > 50) {
            if (touchStartX > touchEndX) currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
            else currentHeroIndex = (currentHeroIndex - 1 + heroSlides.length) % heroSlides.length;
            updateHeroSlide(currentHeroIndex);
        }
        startHeroSlider();
    });
}
window.addEventListener('scroll', () => { document.querySelector('.main-header').classList.toggle('scrolled', window.scrollY > 50); });
function setupHeroIndicators() { /* ... */ }
function updateHeroIndicators(index) { /* ... */ }
function createCarousel(title, mediaItems) { /* ... */ }
function setupScrollAnimations() { /* ... */ }



/* --- 5. UI HELPERS & OTHER FUNCTIONS --- */
/*
 * Miscellaneous functions for creating UI elements and handling animations.
*/

/**
 * Creates the indicator bar elements based on the number of slides.
 */
function setupHeroIndicators() {
    const indicatorsContainer = document.querySelector('.hero-content .hero-indicators');
    indicatorsContainer.innerHTML = ''; // Clear previous indicators.
    heroSlides.forEach(() => {
        const bar = document.createElement('div');
        bar.className = 'indicator-bar';
        bar.innerHTML = `<div class="progress"></div>`;
        indicatorsContainer.appendChild(bar);
    });
}

/**
 * Updates the active state of the indicators.
 * @param {number} index - The index of the indicator to activate.
 */
function updateHeroIndicators(index) {
    document.querySelectorAll('.indicator-bar').forEach((bar, i) => {
        bar.classList.toggle('active', i === index);
    });
}

/**
 * Creates a complete carousel section element.
 * @param {string} title - The title of the carousel.
 * @param {Array} mediaItems - The array of movies or shows.
 * @returns {HTMLElement} The constructed section element.
 */
function createCarousel(title, mediaItems) {
    // This function remains unchanged and correct.
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

/**
 * Sets up the Intersection Observer to animate carousels as they scroll into view.
 */
function setupScrollAnimations() {
    // This function remains unchanged and correct.
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

// Add the scroll listener for the header's "glass" effect.
window.addEventListener('scroll', () => {
    document.querySelector('.main-header').classList.toggle('scrolled', window.scrollY > 50);
});
