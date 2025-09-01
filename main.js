// main.js - V7: Enhanced Debugging & Final Fixes

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('is-loaded');
    initializeHomepage();
});

async function initializeHomepage() {
    const contentContainer = document.getElementById('content-container');
    const heroContainer = document.getElementById('hero-carousel');
    
    try {
        const [moviesResponse, showsResponse, recommendedResponse] = await Promise.all([
            fetch('/api/tmdb?media_type=movie'),
            fetch('/api/tmdb?media_type=tv'),
            fetch('/api/tmdb?endpoint=top_rated')
        ]);

        // --- ENHANCED DEBUGGING ---
        // Log the status of each response to see exactly what's happening.
        console.log('Movies Response Status:', moviesResponse.status);
        console.log('Shows Response Status:', showsResponse.status);
        console.log('Recommended Response Status:', recommendedResponse.status);
        
        if (!moviesResponse.ok || !showsResponse.ok || !recommendedResponse.ok) {
            // Throw a more specific error
            throw new Error(`API request failed with status: 
                Movies(${moviesResponse.status}), 
                Shows(${showsResponse.status}), 
                Recommended(${recommendedResponse.status})`
            );
        }

        const moviesData = await moviesResponse.json();
        const showsData = await showsResponse.json();
        const recommendedData = await recommendedResponse.json();
        
        contentContainer.innerHTML = '';
        heroContainer.innerHTML = `
            <div class="carousel-slides" id="carousel-slides"></div>
            <div class="carousel-progress" id="carousel-progress"></div>
        `;

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
        console.error("CRITICAL INITIALIZATION ERROR:", error);
        heroContainer.innerHTML = ''; // Clear spinner
        contentContainer.innerHTML = `<p class="error-message">Could not load the Cineverse. Check the console for details.</p>`;
    }
}

// NOTE: All other functions (renderHeroCarousel, renderCategoryRow, createMediaCard, etc.)
// are unchanged. If you have the version with shuffling and persistent animations, keep it.
// The code below is the correct, complete set of functions for this file.

let heroCarouselInterval;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
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
                <a href="/details.html?id=${media.id}&type=movie" class="button-primary">More Info</a>
            </div>`;
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
    let currentSlide = restart ? 0 : (document.querySelector('.carousel-slide.active')?.dataset.index || 0);

    const advance = () => {
        const slides = document.querySelectorAll('.carousel-slide');
        const progressBars = document.querySelectorAll('.progress-bar');
        slides.forEach((s, i) => s.dataset.index = i);

        slides[currentSlide].classList.remove('active');
        progressBars[currentSlide].classList.remove('active');
        currentSlide = (parseInt(currentSlide) + 1) % slideCount;
        slides[currentSlide].classList.add('active');
        progressBars[currentSlide].classList.add('active');
    };
    heroCarouselInterval = setInterval(advance, 6000);
    return advance;
}

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
    const targetLink = e.target.closest('a');
    if (targetLink && (targetLink.classList.contains('movie-card') || targetLink.classList.contains('button-primary'))) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = targetLink.href; }, 500);
        return;
    }
    if (e.target.closest('.carousel-slide')) {
        const slideCount = document.querySelectorAll('.carousel-slide').length;
        const advanceFn = startCarousel(slideCount);
        advanceFn();
    }
});
