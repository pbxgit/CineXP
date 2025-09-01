// main.js - V15 (Complete, Stable & Verified)

document.addEventListener('DOMContentLoaded', () => {
    initializeHomepage();
});

// --- Utility: Shuffles arrays for content variety ---
function shuffleArray(array) {
    if (!array) return;
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- Core Homepage Logic ---
async function initializeHomepage() {
    const contentContainer = document.getElementById('content-container');
    const heroContainer = document.getElementById('hero-carousel');
    
    try {
        // Fetch all data concurrently
        const [moviesResponse, showsResponse, recommendedResponse] = await Promise.all([
            fetch('/api/tmdb?media_type=movie'),
            fetch('/api/tmdb?media_type=tv'),
            fetch('/api/tmdb?endpoint=top_rated')
        ]);

        if (!moviesResponse.ok || !showsResponse.ok || !recommendedResponse.ok) {
            throw new Error('One or more API requests failed to load.');
        }

        const moviesData = await moviesResponse.json();
        const showsData = await showsResponse.json();
        const recommendedData = await recommendedResponse.json();
        
        // Clear loading spinners
        contentContainer.innerHTML = '';
        heroContainer.innerHTML = '';

        // Shuffle arrays before rendering
        shuffleArray(moviesData.results);
        shuffleArray(showsData.results);
        shuffleArray(recommendedData.results);

        // Render all sections
        if (moviesData.results?.length > 0) {
            renderHeroCarousel(moviesData.results.slice(0, 5));
            renderCategoryRow('Popular Movies', moviesData.results, contentContainer, 'movie');
        }
        if (recommendedData.results?.length > 0) {
            renderCategoryRow('Recommended For You', recommendedData.results, contentContainer, 'movie');
        }
        if (showsData.results?.length > 0) {
            renderCategoryRow('Popular TV Shows', showsData.results, contentContainer, 'tv');
        }
    } catch (error) {
        console.error("Homepage Initialization Error:", error);
        heroContainer.innerHTML = '';
        contentContainer.innerHTML = `<p class="error-message">Could not load the Cineverse.</p>`;
    }
}

// --- Hero Carousel Rendering & Logic ---
let heroCarouselInterval;

function renderHeroCarousel(mediaItems) {
    const heroContainer = document.getElementById('hero-carousel');
    heroContainer.innerHTML = `
        <div class="carousel-slides"></div>
        <div class="carousel-progress"></div>
    `;
    const slidesContainer = heroContainer.querySelector('.carousel-slides');
    const progressContainer = heroContainer.querySelector('.carousel-progress');

    mediaItems.forEach((media, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.dataset.index = index;
        slide.style.backgroundImage = `url(https://image.tmdb.org/t/p/w1280${media.backdrop_path})`;
        slide.innerHTML = `
            <div class="hero-spotlight-overlay"></div>
            <div class="hero-spotlight-content">
                <h1>${media.title || media.name}</h1>
                <p>${media.overview}</p>
                <a href="/details.html?id=${media.id}&type=movie" class="button-primary">More Info</a>
            </div>`;
        slidesContainer.appendChild(slide);

        const progressWrapper = document.createElement('div');
        progressWrapper.className = 'progress-bar-wrapper';
        progressWrapper.dataset.index = index;
        progressWrapper.innerHTML = `<div class="progress-bar-inner"></div>`;
        progressContainer.appendChild(progressWrapper);
    });

    // Race-condition fix: Wait a moment before activating the first slide
    setTimeout(() => {
        slidesContainer.querySelector('.carousel-slide').classList.add('active');
        progressContainer.querySelector('.progress-bar-wrapper').classList.add('active');
        startCarousel(mediaItems.length, 0); // Start carousel at index 0
    }, 50);
}

function startCarousel(slideCount, startIndex = 0) {
    if (heroCarouselInterval) clearInterval(heroCarouselInterval);
    let currentSlide = startIndex;
    const slides = document.querySelectorAll('.carousel-slide');
    const progressBars = document.querySelectorAll('.progress-bar-wrapper');

    const advance = () => {
        slides[currentSlide]?.classList.remove('active');
        progressBars[currentSlide]?.classList.remove('active');
        currentSlide = (currentSlide + 1) % slideCount;
        slides[currentSlide]?.classList.add('active');
        progressBars[currentSlide]?.classList.add('active');
    };
    heroCarouselInterval = setInterval(advance, 6000);
}

// Event listener for hero carousel interactivity
document.getElementById('hero-carousel')?.addEventListener('click', (e) => {
    const progressWrapper = e.target.closest('.progress-bar-wrapper');
    if (progressWrapper) {
        const slideIndex = parseInt(progressWrapper.dataset.index);
        if (isNaN(slideIndex)) return;

        if (heroCarouselInterval) clearInterval(heroCarouselInterval);
        
        document.querySelector('.carousel-slide.active')?.classList.remove('active');
        document.querySelector('.progress-bar-wrapper.active')?.classList.remove('active');

        document.querySelector(`.carousel-slide[data-index='${slideIndex}']`)?.classList.add('active');
        progressWrapper.classList.add('active');
        
        startCarousel(document.querySelectorAll('.carousel-slide').length, slideIndex);
    }
});

// --- Content Row Rendering & Logic ---
function renderCategoryRow(title, mediaItems, container, mediaType) {
    const categorySection = document.createElement('section');
    categorySection.className = 'category-row';
    categorySection.innerHTML = `<h2>${title}</h2><div class="media-row-wrapper"><button class="slider-arrow left">&lt;</button><div class="media-row"></div><button class="slider-arrow right">&gt;</button></div>`;
    
    const mediaRow = categorySection.querySelector('.media-row');
    mediaItems.forEach(item => {
        if (item.poster_path) { // Only render items that have a poster
             mediaRow.insertAdjacentHTML('beforeend', createMediaCard(item, mediaType));
        }
    });
    
    container.appendChild(categorySection);

    const row = categorySection.querySelector('.media-row');
    const leftArrow = categorySection.querySelector('.slider-arrow.left');
    const rightArrow = categorySection.querySelector('.slider-arrow.right');

    const updateArrowState = () => {
        const { scrollLeft, scrollWidth, clientWidth } = row;
        leftArrow.disabled = scrollLeft <= 0;
        rightArrow.disabled = scrollLeft >= scrollWidth - clientWidth - 1;
    };

    rightArrow.addEventListener('click', () => row.scrollBy({ left: row.clientWidth, behavior: 'smooth' }));
    leftArrow.addEventListener('click', () => row.scrollBy({ left: -row.clientWidth, behavior: 'smooth' }));
    
    row.addEventListener('scroll', updateArrowState, { passive: true });
    new ResizeObserver(updateArrowState).observe(row); // For window resizing
    updateArrowState(); // Initial check
}

function createMediaCard(item, mediaType) {
    return `
        <a class="movie-card" href="/details.html?id=${item.id}&type=${mediaType}">
            <div class="card-poster">
                <img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" loading="lazy">
            </div>
            <div class="card-body">
                <h3>${item.title || item.name}</h3>
            </div>
        </a>`;
}

// --- Global Click Listener for Page Transitions ---
document.body.addEventListener('click', (e) => {
    // Handles clicks on movie cards and "More Info" buttons
    const targetLink = e.target.closest('a.movie-card, a.button-primary');
    if (targetLink) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = targetLink.href; }, 500);
    }
});
