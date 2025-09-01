// main.js - V1 (Renewed with Skeleton Loading & Interactive Hero)

document.addEventListener('DOMContentLoaded', () => {
    initializeHomepage();
});

// --- Core Homepage Logic ---
async function initializeHomepage() {
    const contentContainer = document.getElementById('content-container');
    const heroContainer = document.getElementById('hero-carousel');

    // --- Skeleton Loading ---
    heroContainer.innerHTML = `<div class="skeleton skeleton-hero"></div>`;
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
        
        contentContainer.innerHTML = '';
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

    const row = categorySection.querySelector('.media-row');
    const leftArrow = categorySection.querySelector('.slider-arrow.left');
    const rightArrow = categorySection.querySelector('.slider-arrow.right');
    
    const updateArrowState = () => {
        const { scrollLeft, scrollWidth, clientWidth } = row;
        leftArrow.disabled = scrollLeft <= 0;
        rightArrow.disabled = scrollLeft >= scrollWidth - clientWidth - 1;
    };
    rightArrow.addEventListener('click', () => row.scrollBy({ left: row.clientWidth * 0.8, behavior: 'smooth' }));
    leftArrow.addEventListener('click', () => row.scrollB
