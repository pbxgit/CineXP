// main.js - V3: Robust Scrolling & UI Polish

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
        progressBar.innerHTML = `<div class="progress-bar-inner"></div>`;
        if (index === 0) progressBar.classList.add('active');
        progressContainer.appendChild(progressBar);
    });
    
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
    heroCarouselInterval = setInterval(() => {
        const slides = document.querySelectorAll('.carousel-slide');
        const progressBars = document.querySelectorAll('.progress-bar');
        
        slides[currentSlide].classList.remove('active');
        progressBars[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slideCount;
        slides[currentSlide].classList.add('active');
        progressBars[currentSlide].classList.add('active');
    }, 6000);
}

// --- BUG FIX & ENHANCEMENT: REWRITTEN SCROLLING LOGIC ---
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

    const row = categorySection.querySelector('.media-row');
    const leftArrow = categorySection.querySelector('.slider-arrow.left');
    const rightArrow = categorySection.querySelector('.slider-arrow.right');

    const updateArrowState = () => {
        const scrollLeft = Math.ceil(row.scrollLeft); // Use Math.ceil for precision
        const scrollWidth = row.scrollWidth;
        const clientWidth = row.clientWidth;
        
        leftArrow.disabled = scrollLeft <= 0;
        rightArrow.disabled = scrollLeft >= scrollWidth - clientWidth - 1; // -1 for tolerance
    };

    rightArrow.addEventListener('click', () => {
        const scrollAmount = row.clientWidth * 0.9; // Scroll 90% of the visible width
        row.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    leftArrow.addEventListener('click', () => {
        const scrollAmount = row.clientWidth * 0.9;
        row.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    // Update arrows whenever the scroll position changes or window is resized
    row.addEventListener('scroll', updateArrowState);
    window.addEventListener('resize', updateArrowState);
    
    // Initial state check
    updateArrowState();
}

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

document.body.addEventListener('click', (e) => {
    const card = e.target.closest('.movie-card');
    if (card) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = card.href; }, 500);
    }
});
