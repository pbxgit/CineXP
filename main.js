// main.js - V1 (Renewed with Skeleton Loading & Interactive Hero)

document.addEventListener('DOMContentLoaded', () => {
    initializeHomepage();
});

// --- Core Homepage Logic ---
async function initializeHomepage() {
    const contentContainer = document.getElementById('content-container');
    const heroContainer = document.getElementById('hero-carousel');

    // --- Skeleton Loading ---
    // Show skeleton placeholders immediately for better perceived performance.
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
        
        contentContainer.innerHTML = ''; // Clear skeleton rows
        renderCategoryRow('Popular Movies', moviesData.results, contentContainer);
        renderCategoryRow('Recommended For You', recommendedData.results, contentContainer);
        renderCategoryRow('Popular TV Shows', showsData.results, contentContainer);

    } catch (error) {
        console.error("Homepage Initialization Error:", error);
        heroContainer.innerHTML = '';
        contentContainer.innerHTML = `<p class="error-message">Could not load the Cineverse.</p>`;
    }
}

// --- Skeleton Loading UI ---
function createSkeletonCategory() {
    const skeletonCard = `<div class="movie-card skeleton"><div class="card-poster"></div><div class="card-body"><h3></h3></div></div>`;
    const skeletonRow = `<div class="category-row"><h2 class="skeleton"></h2><div class="media-row-wrapper"><div class="media-row">${skeletonCard.repeat(5)}</div></div></div>`;
    return skeletonRow.repeat(3);
}


// --- Interactive Hero Carousel ---
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
        initializeDragInteraction(slidesContainer, mediaItems.length);
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

function initializeDragInteraction(container, slideCount) {
    let isDragging = false, startX, currentTranslate = 0, prevTranslate = 0;
    
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX;
        container.style.cursor = 'grabbing';
        clearInterval(heroCarouselInterval);
    });

    container.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const currentX = e.pageX;
            currentTranslate = prevTranslate + (currentX - startX);
            container.style.transform = `translateX(${currentTranslate}px)`;
        }
    });

    const endDrag = () => {
        isDragging = false;
        container.style.cursor = 'grab';
        prevTranslate = currentTranslate;
        // Basic snap logic (a more advanced version would use velocity)
        const currentSlide = Math.round(-currentTranslate / window.innerWidth);
        const newIndex = Math.max(0, Math.min(slideCount - 1, currentSlide));
        // This is a simplified snap, a full implementation would be more complex
    };
    
    container.addEventListener('mouseup', endDrag);
    container.addEventListener('mouseleave', endDrag);
}


// --- Content Row Logic (Unchanged but included for completeness) ---
function renderCategoryRow(title, mediaItems, container) {
    const categorySection = document.createElement('section');
    categorySection.className = 'category-row';
    categorySection.innerHTML = `<h2>${title}</h2><div class="media-row-wrapper"><button class="slider-arrow left">&lt;</button><div class="media-row"></div><button class="slider-arrow right">&gt;</button></div>`;
    const mediaRow = categorySection.querySelector('.media-row');
    let cardsHtml = '';
    mediaItems.forEach(item => { if (item.poster_path) cardsHtml += createMediaCard(item); });
    mediaRow.innerHTML = cardsHtml;
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
    new ResizeObserver(updateArrowState).observe(row);
    updateArrowState();
}

function createMediaCard(item) {
    return `<a class="movie-card" href="/details.html?id=${item.id}&type=${mediaTypeFor(item)}"><div class="card-poster"><img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" loading="lazy"></div><div class="card-body"><h3>${item.title || item.name}</h3></div></a>`;
}

// --- Global Click & Helper Functions ---
document.body.addEventListener('click', (e) => {
    const targetLink = e.target.closest('a.movie-card, a.button-primary');
    if (targetLink) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = targetLink.href; }, 400);
    }
});
function mediaTypeFor(item) {
    return item.media_type || (item.title ? 'movie' : 'tv');
}
