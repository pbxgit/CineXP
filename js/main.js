/* --- 1. GLOBAL VARIABLES --- */
/*
 * Storing state variables globally for easy access across functions.
*/
let heroSlides = [];      // Holds the data for the hero section slides.
let currentHeroIndex = 0; // Tracks the currently active slide index.
let heroInterval;         // Holds the setInterval timer for auto-sliding.

// For the seamless background transition effect
let bg1, bg2;
let isBg1Active = true;

// For robust swipe detection
let touchStartX = 0;
let touchEndX = 0;


/* --- 2. INITIALIZATION --- */
/*
 * The main entry point of the script. It runs once the HTML document is fully loaded.
*/
document.addEventListener('DOMContentLoaded', async () => {
    // Cache the background elements for performance
    bg1 = document.querySelector('.hero-background');
    bg2 = document.querySelector('.hero-background-next');

    // --- Fetch initial data ---
    // Fetch data for movies and shows in parallel to speed up loading.
    const [trendingMovies, trendingShows] = await Promise.all([
        fetchMedia('movie', 'trending'),
        fetchMedia('tv', 'trending')
    ]);
    
    // Combine, sort by popularity, and take the top 7 for the hero showcase.
    heroSlides = [...trendingMovies, ...trendingShows]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 7);

    // --- Setup UI components ---
    if (heroSlides.length > 0) {
        setupHeroIndicators();
        setupSwipeHandlers();
        startHeroSlider();
    }
    
    // Setup the horizontally scrolling carousels.
    const carouselsContainer = document.getElementById('content-carousels');
    carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
    carouselsContainer.appendChild(createCarousel('Trending TV Shows', trendingShows));
    
    // Initialize animations for carousels to fade in on scroll.
    setupScrollAnimations();
});


/* --- 3. HERO SLIDER LOGIC --- */
/*
 * All functions related to managing the hero section slider.
*/

/**
 * The core function to update the hero slide's content and background.
 * @param {number} index - The index of the slide to display.
 * @param {boolean} isFirstLoad - A flag to handle the initial slide load differently.
 */
async function updateHeroSlide(index, isFirstLoad = false) {
    // --- 1. Get references to HTML elements ---
    const slideData = heroSlides[index];
    const heroSection = document.getElementById('hero-section');
    const heroLogoContainer = heroSection.querySelector('.hero-logo-container');
    const heroLogoImg = heroSection.querySelector('.hero-logo');
    const heroTagline = heroSection.querySelector('.hero-tagline');
    
    // --- 2. Start by fading out old content ---
    heroSection.classList.remove('active');

    // --- 3. Fetch all necessary data in parallel ---
    const mediaType = slideData.media_type || (slideData.title ? 'movie' : 'tv');
    const [detailsData, imagesData] = await Promise.all([
        fetchMediaDetails(mediaType, slideData.id),
        fetchMediaImages(mediaType, slideData.id)
    ]);

    // --- 4. Update the background seamlessly ---
    const nextBgUrl = `url(https://image.tmdb.org/t/p/original${slideData.backdrop_path})`;
    if (isFirstLoad) {
        bg1.style.backgroundImage = nextBgUrl;
    } else {
        const activeBg = isBg1Active ? bg1 : bg2;
        const nextBg = isBg1Active ? bg2 : bg1;
        nextBg.style.backgroundImage = nextBgUrl;
        nextBg.style.opacity = 1;
        activeBg.style.opacity = 0;
        setTimeout(() => { activeBg.style.backgroundImage = ''; }, 2000); // Match CSS transition
        isBg1Active = !isBg1Active;
    }

    // --- 5. Update the content after a short delay for animations ---
    setTimeout(() => {
        // --- LOGO LOGIC (REBUILT FROM SCRATCH) ---
        const bestLogo = imagesData?.logos?.find(l => l.iso_639_1 === 'en') || imagesData?.logos?.[0];
        if (bestLogo?.file_path) {
            heroLogoContainer.style.display = 'block'; // Show the container
            heroLogoImg.src = `https://image.tmdb.org/t/p/w500${bestLogo.file_path}`;
        } else {
            heroLogoContainer.style.display = 'none'; // Hide if no logo found
        }
        
        // --- TAGLINE LOGIC ---
        if (detailsData?.tagline) {
            heroTagline.textContent = detailsData.tagline;
            heroTagline.style.display = 'block';
        } else {
            heroTagline.style.display = 'none';
        }
        
        // --- 6. Fade in the new content ---
        heroSection.classList.add('active');
        updateHeroIndicators(index);
    }, 500);
}

/**
 * Initializes and starts the automatic hero slider timer.
 */
function startHeroSlider() {
    clearInterval(heroInterval);
    updateHeroSlide(currentHeroIndex, true);
    const slideDuration = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hero-slide-duration')) * 1000;
    heroInterval = setInterval(() => {
        currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
        updateHeroSlide(currentHeroIndex);
    }, slideDuration);
}


/* --- 4. SWIPE & SCROLL LOGIC --- */
/*
 * Robust touch event handlers for mobile swipe navigation and header scroll effect.
*/
function setupSwipeHandlers() {
    const heroSection = document.getElementById('hero-section');

    heroSection.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        clearInterval(heroInterval);
    }, { passive: true });

    heroSection.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
    }, { passive: true });

    heroSection.addEventListener('touchend', () => {
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

window.addEventListener('scroll', () => {
    document.querySelector('.main-header').classList.toggle('scrolled', window.scrollY > 50);
});


/* --- 5. UI HELPERS --- */
/*
 * Miscellaneous functions for creating UI elements and handling animations.
*/

/**
 * Creates the indicator bar elements based on the number of slides.
 */
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
