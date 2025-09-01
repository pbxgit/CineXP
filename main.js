// main.js - V4: Click Fixes, Shuffling & Persistent Animations

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('is-loaded');
    initializeHomepage();
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.body.classList.remove('fade-out');
    }
});

let heroCarouselInterval;

// --- FEATURE 3: SHUFFLE UTILITY ---
// Shuffles an array in place using the Fisher-Yates algorithm for randomness.
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function initializeHomepage() {
    const contentContainer = document.getElementById('content-container');
    contentContainer.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const [moviesResponse, showsResponse] = await Promise.all([
            fetch('/api/tmdb?media_type=movie'),
            fetch('/api/tmdb?media_type=tv')
        ]);

        if (!moviesResponse.ok || !showsResponse.ok) {
            throw new Error('Failed to fetch media from the API.');
        }

        const moviesData = await moviesResponse.json();
        const showsData = await showsResponse.json();
        
        contentContainer.innerHTML = '';

        // Shuffle the results for variety
        if (moviesData.results) shuffleArray(moviesData.results);
        if (showsData.results) shuffleArray(showsData.results);

        if (moviesData.results && moviesData.results.length > 0) {
            renderHeroCarousel(moviesData.results.slice(0, 5));
            renderCategoryRow('Popular Movies', moviesData.results, contentContainer, 'movie');
        }

        if (showsData.results && showsData.results.length > 0) {
            renderCategoryRow('Popular TV Shows', showsData.results, contentContainer, 'tv');
        }

    } catch (error) {
        console.error("Initialization Error:", error);
        contentContainer.innerHTML = `<p class="error-message">Could not load the Cineverse.</p>`;
    }
}

function renderHeroCarousel(mediaItems) {
    const slidesContainer = document.getElementById('carousel-slides');
    const progressContainer = document.getElementById('carousel-progress');
    slidesContainer.innerHTML = '';
    progressContainer.innerHTML = '';
    
    mediaItems.forEach((media, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        if (index === 0) slide.classList.add('active');

        const backdropUrl = `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`;
        slide.style.backgroundImage = `url(${backdropUrl})`;
        slide.innerHTML = `
            <div class="hero-spotlight-overlay"></div>
            <div class="hero-spotlight-content">
                <h1 class="hero-spotlight-title">${media.title || media.name}</h1>
                <p class="hero-spotlight-overview">${media.overview}</p>
                <a href="/details.html?id=${media.id}&type=movie" class="button-primary">
                    More Info
                </a>
            </div>
        `;
        slidesContainer.appendChild(slide);

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        if (index === 0) progressBar.classList.add('active');
        progressBar.innerHTML = `<div class="progress-bar-inner"></div>`;
        progressContainer.appendChild(progressBar);
    });
    
    startCarousel(mediaItems.length);
}

function startCarousel(slideCount, restart = false) {
    if (heroCarouselInterval) clearInterval(heroCarouselInterval);
    
    // If not restarting, don't change the current slide
    let currentSlide = restart ? 0 : (document.querySelector('.carousel-slide.active') || document.querySelector('.carousel-slide'))._DT_SlideIndex || 0;

    const advance = () => {
        const slides = document.querySelectorAll('.carousel-slide');
        const progressBars = document.querySelectorAll('.progress-bar');
        
        slides.forEach((s, i) => s._DT_SlideIndex = i); // Add index for reference

        slides[currentSlide].classList.remove('active');
        progressBars[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slideCount;
        slides[currentSlide].classList.add('active');
        progressBars[currentSlide].classList.add('active');
    };

    heroCarouselInterval = setInterval(advance, 6000);
    return advance; // Return the function so it can be called directly
}

function renderCategoryRow(title, mediaItems, container, mediaType) {
    const categorySection = document.createElement('section');
    categorySection.className = 'category-row';

    categorySection.innerHTML = `
        <h2 class="category-title">${title}</h2>
        <div class="media-row-wrapper">
            <button class="slider-arrow left" aria-label="Scroll left">&lt;</button>
            <div class="media-row">
                ${mediaItems.map(item => createMediaCard(item, mediaType)).join('')}
            </div>
            <button class="slider-arrow right" aria-label="Scroll right">&gt;</button>
        </div>
    `;
    
    container.appendChild(categorySection);

    // --- FEATURE 4: PERSISTENT SCROLL ANIMATION ---
    const cards = categorySection.querySelectorAll('.movie-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Toggle the class based on whether it's in view
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                // By removing the class, it can re-animate when it enters again
                entry.target.classList.remove('is-visible');
            }
        });
    }, { threshold: 0.1 }); // A threshold of 0.1 means the animation triggers when 10% of the card is visible
    cards.forEach(card => observer.observe(card));

    const row = categorySection.querySelector('.media-row');
    const leftArrow = categorySection.querySelector('.slider-arrow.left');
    const rightArrow = categorySection.querySelector('.slider-arrow.right');

    const updateArrowState = () => {
        const scrollLeft = Math.ceil(row.scrollLeft);
        const scrollWidth = row.scrollWidth;
        const clientWidth = row.clientWidth;
        
        leftArrow.disabled = scrollLeft <= 0;
        rightArrow.disabled = scrollLeft >= scrollWidth - clientWidth - 1;
    };

    rightArrow.addEventListener('click', () => row.scrollBy({ left: row.clientWidth * 0.9, behavior: 'smooth' }));
    leftArrow.addEventListener('click', () => row.scrollBy({ left: -row.clientWidth * 0.9, behavior: 'smooth' }));
    
    row.addEventListener('scroll', updateArrowState, { passive: true });
    new ResizeObserver(updateArrowState).observe(row); // More reliable than window resize
    updateArrowState();
}

function createMediaCard(item, mediaType) {
    const title = item.title || item.name;
    const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';
    return `<a class="movie-card" href="/details.html?id=${item.id}&type=${mediaType}">...</a>`; // The innerHTML is unchanged
}
// Helper to avoid repeating card HTML
function createMediaCard(item, mediaType) {
    const title = item.title || item.name;
    const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';

    return `
        <a class="movie-card" href="/details.html?id=${item.id}&type=${mediaType}">
            <div class="card-poster">
                <img src="${posterUrl}" alt="${title}" loading="lazy">
            </div>
            <div class="card-body">
                <h3 class="card-title">${title}</h3>
                <div class="card-rating">
                    <span>⭐ ${item.vote_average.toFixed(1)}</span>
                </div>
            </div>
        </a>
    `;
}

// --- BUG FIX 1 & FEATURE 2: ROBUST DELEGATED CLICK LISTENER ---
document.body.addEventListener('click', (e) => {
    // Case 1: Clicked a card in a row
    const card = e.target.closest('.movie-card');
    if (card) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = card.href; }, 500);
        return;
    }

    // Case 2: Clicked the hero button
    const heroButton = e.target.closest('#hero-carousel .button-primary');
    if (heroButton) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = heroButton.href; }, 500);
        return;
    }

    // Case 3: Clicked the hero slide itself (but not the button) to advance
    const slide = e.target.closest('.carousel-slide');
    if (slide) {
        const slideCount = document.querySelectorAll('.carousel-slide').length;
        const advanceFn = startCarousel(slideCount); // This restarts the interval and returns the advance function
        advanceFn(); // Call it immediately to advance the slide
    }
});
