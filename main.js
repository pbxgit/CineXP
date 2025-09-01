// main.js - V1 (Renewed with Skeleton Loading & Polished UX)

document.addEventListener('DOMContentLoaded', () => {
    initializeHomepage();
});

async function initializeHomepage() {
    const contentContainer = document.getElementById('content-container');
    const heroContainer = document.getElementById('hero-carousel');

    // --- Skeleton Loading ---
    // Show skeleton placeholders immediately for a professional loading experience.
    heroContainer.innerHTML = `<div class="skeleton-hero"></div>`;
    contentContainer.innerHTML = createSkeletonCategory();
    
    try {
        const [moviesResponse, showsResponse, recommendedResponse] = await Promise.all([
            fetch('/api/tmdb?media_type=movie'),
            fetch('/api/tmdb?media_type=tv'),
            fetch('/api/tmdb?endpoint=top_rated')
        ]);

        if (!moviesResponse.ok || !showsResponse.ok || !recommendedResponse.ok) {
            throw new Error('API request failed to load content.');
        }

        const moviesData = await moviesResponse.json();
        const showsData = await showsResponse.json();
        const recommendedData = await recommendedResponse.json();
        
        // Render the real content
        renderHeroCarousel(moviesData.results.slice(0, 5));
        
        contentContainer.innerHTML = ''; // Clear skeleton rows before rendering real ones
        renderCategoryRow('Popular Movies', moviesData.results);
        renderCategoryRow('Recommended For You', recommendedData.results);
        renderCategoryRow('Popular TV Shows', showsData.results);

    } catch (error) {
        console.error("Homepage Initialization Error:", error);
        heroContainer.innerHTML = '';
        contentContainer.innerHTML = `<p class="error-message">Could not load the Cineverse.</p>`;
    }
}

// --- UI Rendering ---
function createSkeletonCategory() {
    const skeletonCard = `<div class="movie-card skeleton"><div class="card-poster"></div><div class="card-body"><h3></h3></div></div>`;
    const skeletonRow = `<div class="category-row"><h2 class="skeleton"></h2><div class="media-row-wrapper"><div class="media-row">${skeletonCard.repeat(6)}</div></div></div>`;
    return skeletonRow.repeat(3);
}

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
        slide.innerHTML = `<div class="hero-spotlight-overlay"></div><div class="hero-spotlight-content"><h1>${media.title || media.name}</h1><p>${media.overview}</p><a href="/details.html?id=${media.id}&type=${mediaTypeFor(media)}" class="button-primary">More Info</a></div>`;
        slidesContainer.appendChild(slide);

        const progressWrapper = document.createElement('div');
        progressWrapper.className = 'progress-bar-wrapper';
        progressWrapper.dataset.index = index;
        progressWrapper.innerHTML = `<div class="progress-bar-inner"></div>`;
        progressContainer.appendChild(progressWrapper);
    });

    setTimeout(() => {
        slidesContainer.querySelector('.carousel-slide')?.classList.add('active');
        progressContainer.querySelector('.progress-bar-wrapper')?.classList.add('active');
        startCarousel(mediaItems.length, 0);
    }, 50);

    heroContainer.addEventListener('click', handleCarouselClick);
}

function renderCategoryRow(title, mediaItems) {
    const contentContainer = document.getElementById('content-container');
    const categorySection = document.createElement('section');
    categorySection.className = 'category-row';
    categorySection.innerHTML = `<h2>${title}</h2><div class="media-row-wrapper"><button class="slider-arrow left">&lt;</button><div class="media-row"></div><button class="slider-arrow right">&gt;</button></div>`;
    
    const mediaRow = categorySection.querySelector('.media-row');
    let cardsHtml = '';
    mediaItems.forEach(item => { if (item.poster_path) cardsHtml += createMediaCard(item); });
    mediaRow.innerHTML = cardsHtml;
    
    contentContainer.appendChild(categorySection);

    // Attach event listeners for the slider arrows
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
    new ResizeObserver(updateArrowState).observe(row);
    updateArrowState();
}

function createMediaCard(item) {
    return `<a class="movie-card" href="/details.html?id=${item.id}&type=${mediaTypeFor(item)}"><div class="card-poster"><img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" loading="lazy"></div><div class="card-body"><h3>${item.title || item.name}</h3></div></a>`;
}

// --- Interactivity ---
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

function handleCarouselClick(e) {
    const progressWrapper = e.target.closest('.progress-bar-wrapper');
    if (progressWrapper) {
        const slideIndex = parseInt(progressWrapper.datase
