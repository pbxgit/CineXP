// main.js - V13 (Carousel Logic Restored & Stabilized)

document.addEventListener('DOMContentLoaded', () => {
    initializeHomepage();
});

// --- Utility Functions ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- Core Initialization ---
async function initializeHomepage() {
    const contentContainer = document.getElementById('content-container');
    const heroContainer = document.getElementById('hero-carousel');
    
    try {
        const [moviesResponse, showsResponse, recommendedResponse] = await Promise.all([
            fetch('/api/tmdb?media_type=movie'),
            fetch('/api/tmdb?media_type=tv'),
            fetch('/api/tmdb?endpoint=top_rated')
        ]);

        if (!moviesResponse.ok || !showsResponse.ok || !recommendedResponse.ok) {
            throw new Error('One or more API requests failed.');
        }

        const moviesData = await moviesResponse.json();
        const showsData = await showsResponse.json();
        const recommendedData = await recommendedResponse.json();
        
        contentContainer.innerHTML = '';
        heroContainer.innerHTML = '';

        if (moviesData.results) shuffleArray(moviesData.results);
        if (showsData.results) shuffleArray(showsData.results);
        if (recommendedData.results) shuffleArray(recommendedData.results);

        if (moviesData.results?.length > 0) {
            // THIS IS THE CRITICAL RESTORED FUNCTION CALL
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
        console.error("CRITICAL INITIALIZATION ERROR:", error);
        heroContainer.innerHTML = '';
        contentContainer.innerHTML = `<p class="error-message">Could not load the Cineverse.</p>`;
    }
}


// --- CRITICAL RESTORED FUNCTIONS ---
let heroCarouselInterval;

function renderHeroCarousel(mediaItems) {
    const heroContainer = document.getElementById('hero-carousel');
    heroContainer.innerHTML = `
        <div class="carousel-slides" id="carousel-slides"></div>
        <div class="carousel-progress" id="carousel-progress"></div>
    `;
    const slidesContainer = document.getElementById('carousel-slides');
    const progressContainer = document.getElementById('carousel-progress');

    mediaItems.forEach((media, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.dataset.index = index; // Set index for progress bar
        const backdropUrl = `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`;
        slide.style.backgroundImage = `url(${backdropUrl})`;
        slide.innerHTML = `
            <div class="hero-spotlight-overlay"></div>
            <div class="hero-spotlight-content">
                <h1 class="hero-spotlight-title">${media.title || media.name}</h1>
                <p class="hero-spotlight-overview">${media.overview}</p>
                <a href="/details.html?id=${media.id}&type=movie" class="button-primary">More Info</a>
            </div>`;
        slidesContainer.appendChild(slide);

        const progressWrapper = document.createElement('div');
        progressWrapper.className = 'progress-bar-wrapper';
        progressWrapper.dataset.index = index;
        progressWrapper.innerHTML = `<div class="progress-bar-inner"></div>`;
        progressContainer.appendChild(progressWrapper);
    });
    
    setTimeout(() => {
        document.querySelector('.carousel-slide').classList.add('active');
        document.querySelector('.progress-bar-wrapper').classList.add('active');
        startCarousel(mediaItems.length);
    }, 50);
}

function startCarousel(slideCount) {
    if (heroCarouselInterval) clearInterval(heroCarouselInterval);
    let currentSlide = 0;

    const advance = () => {
        const slides = document.querySelectorAll('.carousel-slide');
        const progressBars = document.querySelectorAll('.progress-bar-wrapper');

        slides[currentSlide].classList.remove('active');
        progressBars[currentSlide].classList.remove('active');
        
        currentSlide = (currentSlide + 1) % slideCount;
        
        slides[currentSlide].classList.add('active');
        progressBars[currentSlide].classList.add('active');
    };

    heroCarouselInterval = setInterval(advance, 6000);
}

// --- Event Listener for Carousel Interactivity ---
document.getElementById('hero-carousel').addEventListener('click', (e) => {
    // Check if a progress bar was clicked
    const progressWrapper = e.target.closest('.progress-bar-wrapper');
    if (progressWrapper) {
        const slideIndex = parseInt(progressWrapper.dataset.index);
        const slideCount = document.querySelectorAll('.carousel-slide').length;

        // Reset and jump to the clicked slide
        if (heroCarouselInterval) clearInterval(heroCarouselInterval);
        
        document.querySelector('.carousel-slide.active').classList.remove('active');
        document.querySelector('.progress-bar-wrapper.active').classList.remove('active');

        document.querySelector(`.carousel-slide[data-index='${slideIndex}']`).classList.add('active');
        progressWrapper.classList.add('active');

        // Restart the timer from the new slide
        startCarousel(slideCount);
        return;
    }

    // Check if the "More Info" button was clicked
    const button = e.target.closest('a.button-primary');
    if (button) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = button.href; }, 500);
    }
});


// --- UNCHANGED CONTENT ROW FUNCTIONS ---
// (These can remain exactly as they were in the last stable version)
function renderCategoryRow(title, mediaItems, container, mediaType) {
    const categorySection = document.createElement('section');
    categorySection.className = 'category-row';
    categorySection.innerHTML = `
        <h2 class="category-title">${title}</h2>
        <div class="media-row-wrapper">
            <button class="slider-arrow left" aria-label="Scroll left">&lt;</button>
            <div class="media-row">${mediaItems.map(item => createMediaCard(item, mediaType)).join('')}</div>
            <button class="slider-arrow right" aria-label="Scroll right">&gt;</button>
        </div>`;
    container.appendChild(categorySection);
    const cards = categorySection.querySelectorAll('.movie-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
    }, { threshold: 0.1 });
    cards.forEach(card => observer.observe(card));
    const row = categorySection.querySelector('.media-row');
    const leftArrow = categorySection.querySelector('.slider-arrow.left');
    const rightArrow = categorySection.querySelector('.slider-arrow.right');
    const updateArrowState = () => {
        if (!row) return;
        const scrollLeft = Math.ceil(row.scrollLeft);
        const scrollWidth = row.scrollWidth;
        const clientWidth = row.clientWidth;
        leftArrow.disabled = scrollLeft <= 0;
        rightArrow.disabled = scrollLeft >= scrollWidth - clientWidth - 1;
    };
    rightArrow.addEventListener('click', () => row.scrollBy({ left: row.clientWidth * 0.9, behavior: 'smooth' }));
    leftArrow.addEventListener('click', () => row.scrollBy({ left: -row.clientWidth * 0.9, behavior: 'smooth' }));
    row.addEventListener('scroll', updateArrowState, { passive: true });
    new ResizeObserver(updateArrowState).observe(row);
    updateArrowState();
}
function createMediaCard(item, mediaType) {
    const title = item.title || item.name;
    const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';
    return `
        <a class="movie-card" href="/details.html?id=${item.id}&type=${mediaType}">
            <div class="card-poster"><img src="${posterUrl}" alt="${title}" loading="lazy"></div>
            <div class="card-body">
                <h3 class="card-title">${title}</h3>
                <div class="card-rating"><span>⭐ ${item.vote_average.toFixed(1)}</span></div>
            </div>
        </a>`;
}
document.body.addEventListener('click', (e) => {
    const card = e.target.closest('a.movie-card');
    if (card) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = card.href; }, 500);
    }
});
