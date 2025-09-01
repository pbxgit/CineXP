// main.js - V2: Dynamic Carousel & Animated Sliders

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('is-loaded');
    initializeHomepage();
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.body.classList.remove('fade-out');
    }
});

let heroCarouselInterval; // To hold the interval timer for the hero carousel

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

        if (moviesData.results && moviesData.results.length > 0) {
            // Use top 5 movies for the hero carousel
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
        // Create Slide
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

        // Create Progress Bar
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `<div class="progress-bar-inner"></div>`;
        if (index === 0) progressBar.classList.add('active');
        progressContainer.appendChild(progressBar);
    });
    
    // Add fade-out transition logic to all hero buttons
    document.querySelectorAll('#hero-carousel .button-primary').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => { window.location.href = e.currentTarget.href; }, 500);
        });
    });

    startCarousel(mediaItems.length);
}

function startCarousel(slideCount) {
    if (heroCarouselInterval) clearInterval(heroCarouselInterval);
    
    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-slide');
    const progressBars = document.querySelectorAll('.progress-bar');

    heroCarouselInterval = setInterval(() => {
        // Deactivate current slide and progress bar
        slides[currentSlide].classList.remove('active');
        progressBars[currentSlide].classList.remove('active');

        currentSlide = (currentSlide + 1) % slideCount;

        // Activate next slide and progress bar
        slides[currentSlide].classList.add('active');
        progressBars[currentSlide].classList.add('active');
    }, 6000); // Change slide every 6 seconds
}

function renderCategoryRow(title, mediaItems, container, mediaType) {
    const categorySection = document.createElement('section');
    categorySection.className = 'category-row';

    categorySection.innerHTML = `
        <h2 class="category-title">${title}</h2>
        <div class="media-row-wrapper">
            <button class="slider-arrow left" aria-label="Scroll left" disabled>&lt;</button>
            <div class="media-row">
                ${mediaItems.map(item => createMediaCard(item, mediaType)).join('')}
            </div>
            <button class="slider-arrow right" aria-label="Scroll right">&gt;</button>
        </div>
    `;
    
    container.appendChild(categorySection);

    // Animate cards into view
    const cards = categorySection.querySelectorAll('.movie-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    cards.forEach(card => observer.observe(card));

    // Slider functionality
    const wrapper = categorySection.querySelector('.media-row-wrapper');
    const row = categorySection.querySelector('.media-row');
    const leftArrow = categorySection.querySelector('.slider-arrow.left');
    const rightArrow = categorySection.querySelector('.slider-arrow.right');
    let scrollPosition = 0;

    rightArrow.addEventListener('click', () => {
        const scrollAmount = wrapper.clientWidth * 0.8;
        scrollPosition += scrollAmount;
        if (scrollPosition > row.scrollWidth - wrapper.clientWidth) {
            scrollPosition = row.scrollWidth - wrapper.clientWidth;
        }
        row.style.transform = `translateX(-${scrollPosition}px)`;
        updateArrowState();
    });

    leftArrow.addEventListener('click', () => {
        const scrollAmount = wrapper.clientWidth * 0.8;
        scrollPosition -= scrollAmount;
        if (scrollPosition < 0) {
            scrollPosition = 0;
        }
        row.style.transform = `translateX(-${scrollPosition}px)`;
        updateArrowState();
    });
    
    function updateArrowState() {
        leftArrow.disabled = scrollPosition <= 0;
        rightArrow.disabled = scrollPosition >= row.scrollWidth - wrapper.clientWidth;
    }
}

function createMediaCard(item, mediaType) {
    const title = item.title || item.name;
    const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';

    return `
        <a class="movie-card" href="/details.html?id=${item.id}&type=${mediaType}" data-id="${item.id}" data-type="${mediaType}">
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

// Add delegated event listener for card clicks for better performance
document.body.addEventListener('click', (e) => {
    const card = e.target.closest('.movie-card');
    if (card) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = card.href; }, 500);
    }
});
