// --- Global variables ---
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval;
let bg1, bg2; // For seamless background transitions
let isBg1Active = true;

// --- Main execution block ---
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
        // setupSwipeHandlers(); // Swipe handlers can be added back later
        startHeroSlider();
    }
    // ... rest of the setup for carousels ...
});

// ... Event Listeners & Other Functions ...

async function updateHeroSlide(index, isFirstLoad = false) {
    const slideData = heroSlides[index];
    const heroSection = document.getElementById('hero-section');
    const heroLogoImg = heroSection.querySelector('.hero-logo');
    const heroDescription = heroSection.querySelector('.hero-description');

    heroSection.classList.remove('active');

    const mediaType = slideData.media_type || (slideData.title ? 'movie' : 'tv');
    const [imagesData, detailsData] = await Promise.all([
        fetchMediaImages(mediaType, slideData.id),
        fetchMediaDetails(mediaType, slideData.id)
    ]);

    // --- Seamless Background Logic ---
    const nextBgUrl = `url(https://image.tmdb.org/t/p/original${slideData.backdrop_path})`;
    if (isFirstLoad) {
        bg1.style.backgroundImage = nextBgUrl;
    } else {
        const activeBg = isBg1Active ? bg1 : bg2;
        const nextBg = isBg1Active ? bg2 : bg1;
        
        nextBg.style.backgroundImage = nextBgUrl;
        nextBg.style.opacity = 1;
        activeBg.style.opacity = 0;

        // After transition, reset the old background
        setTimeout(() => {
            activeBg.style.backgroundImage = '';
        }, 1500); // Match CSS transition duration

        isBg1Active = !isBg1Active;
    }

    // --- Content Update Logic ---
    setTimeout(() => {
        // Use tagline if it exists, otherwise fall back to overview
        heroDescription.textContent = detailsData.tagline || slideData.overview;
        if (!heroDescription.textContent) heroDescription.style.display = 'none';
        else heroDescription.style.display = '-webkit-box';

        // LOGO FIX: More robust logo finding logic
        let bestLogo = null;
        if (imagesData && imagesData.logos && imagesData.logos.length > 0) {
            bestLogo = imagesData.logos.find(logo => logo.iso_639_1 === 'en') || imagesData.logos[0];
        }
        
        if (bestLogo && bestLogo.file_path) {
            heroLogoImg.src = `https://image.tmdb.org/t/p/w500${bestLogo.file_path}`;
            heroLogoImg.parentElement.style.display = 'block';
        } else {
            heroLogoImg.parentElement.style.display = 'none';
        }

        heroSection.classList.add('active');
        updateHeroIndicators(index);
    }, 500); // Delay content update to sync with animations
}

function startHeroSlider() {
    clearInterval(heroInterval);
    updateHeroSlide(currentHeroIndex, true); // True for first load
    const slideDuration = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hero-slide-duration')) * 1000;
    heroInterval = setInterval(() => {
        currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
        updateHeroSlide(currentHeroIndex);
    }, slideDuration);
}

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
