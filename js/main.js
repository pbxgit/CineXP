/* --- 1. GLOBAL VARIABLES --- */
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval;
let bg1, bg2, isBg1Active = true;
let touchStartX = 0, touchEndX = 0;

/* --- 2. INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', async () => {
    // Cache the background elements for performance
    bg1 = document.querySelector('.hero-background');
    bg2 = document.querySelector('.hero-background-next');

    // Fetch initial data
    const [trendingMovies, trendingShows] = await Promise.all([
        fetchMedia('movie', 'trending'),
        fetchMedia('tv', 'trending')
    ]);
    
    // Combine, sort, and take the top 7 for the hero showcase.
    heroSlides = [...trendingMovies, ...trendingShows]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 7);

    // Setup UI components
    if (heroSlides.length > 0) {
        setupHeroIndicators();
        setupSwipeHandlers();
        startHeroSlider();
    }
    
    // Setup the carousels
    const carouselsContainer = document.getElementById('content-carousels');
    carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
    carouselsContainer.appendChild(createCarousel('Trending TV Shows', trendingShows));
    
    // Initialize animations for carousels
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

    // Seamless Background Logic
    const nextBgUrl = `url(https://image.tmdb.org/t/p/original${slideData.backdrop_path})`;
    if (isFirstLoad) {
        bg1.style.backgroundImage = nextBgUrl;
    } else {
        const activeBg = isBg1Active ? bg1 : bg2;
        const nextBg = isBg1Active ? bg2 : bg1;
        nextBg.style.backgroundImage = nextBgUrl;
        nextBg.style.opacity = 1;
        activeBg.style.opacity = 0;
        setTimeout(() => { activeBg.style.backgroundImage = ''; }, 2000);
        isBg1Active = !isBg1Active;
    }

    // Content Update Logic
    setTimeout(() => {
        // Handle Tagline
        heroTagline.textContent = detailsData.tagline || '';
        heroTagline.style.display = detailsData.tagline ? 'block' : 'none';

        // --- DEFINITIVE ROBUST LOGO FIX ---
        console.log(`[Debug] Checking logo for: ${slideData.title || slideData.name}`);
        
        let bestLogo = null;
        // 1. Verify that the API response and the 'logos' array are valid.
        if (imagesData && Array.isArray(imagesData.logos) && imagesData.logos.length > 0) {
            console.log(`[Debug] Found ${imagesData.logos.length} logos.`);
            // 2. Find the best available logo (English preferred, otherwise the first one).
            bestLogo = imagesData.logos.find(l => l.iso_639_1 === 'en') || imagesData.logos[0];
        } else {
            console.log(`[Debug] No valid logos array found in API response.`);
        }

        // 3. If a valid logo object with a file path was found, display it.
        if (bestLogo && bestLogo.file_path) {
            console.log(`[Debug] Displaying logo: ${bestLogo.file_path}`);
            heroLogoImg.src = `https://image.tmdb.org/t/p/w500${bestLogo.file_path}`;
            heroLogoContainer.style.display = 'block';
        } else {
            // 4. Otherwise, ensure the container is hidden.
            console.log(`[Debug] Hiding logo container.`);
            heroLogoContainer.style.display = 'none';
        }
        
        heroSection.classList.add('active');
        updateHeroIndicators(index);
    }, 500);
}

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
function setupSwipeHandlers() {
    const heroSection = document.getElementById('hero-section');
    heroSection.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; clearInterval(heroInterval); }, { passive: true });
    heroSection.addEventListener('touchmove', (e) => { touchEndX = e.touches[0].clientX; }, { passive: true });
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
            if (entry.isInteracting) {
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
