// global.js - V19 (Definitive & Stable)

document.addEventListener('DOMContentLoaded', () => {
    const searchContainer = document.getElementById('nav-search');
    const searchInput = document.getElementById('search-input');
    const searchIcon = document.getElementById('search-icon');
    const backButton = document.getElementById('back-button');
    const header = document.querySelector('.global-nav');

    // --- Conditional Back Button ---
    // This is for the floating UI on non-homepage pages
    if (backButton && window.location.pathname !== '/') {
        backButton.style.display = 'flex';
    }

    // --- Header Scroll Effect for Homepage ---
    // This makes the header solid when the user scrolls down on the homepage
    if (document.body.classList.contains('home')) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('solid');
            } else {
                header.classList.remove('solid');
            }
        }, { passive: true });
    }

    // --- Search Bar Logic ---
    if (searchIcon) {
        searchIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = searchContainer.classList.contains('active');
            const hasValue = searchInput.value.trim() !== '';

            if (isActive && hasValue) {
                window.location.href = `/search.html?query=${encodeURIComponent(searchInput.value.trim())}`;
            } else {
                searchContainer.classList.toggle('active');
                if (searchContainer.classList.contains('active')) {
                    searchInput.focus();
                }
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                window.location.href = `/search.html?query=${encodeURIComponent(searchInput.value.trim())}`;
            }
        });
    }

    // Close search when clicking anywhere else on the page
    document.addEventListener('click', (e) => {
        if (searchContainer && !searchContainer.contains(e.target)) {
            searchContainer.classList.remove('active');
        }
    });
});

// --- Critical Fix for Blank Pages on Back Navigation ---
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.body.classList.remove('fade-out');
    }
});```

---

### **2. `main.js`**

This is the complete, stable script for the homepage, with all carousel and content row logic fully functional.

```javascript
// main.js - V19 (Definitive & Stable)

document.addEventListener('DOMContentLoaded', () => {
    initializeHomepage();
});

// --- Utility: Shuffles an array for content variety ---
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
        
        heroContainer.innerHTML = '';
        contentContainer.innerHTML = '';

        shuffleArray(moviesData.results);
        shuffleArray(showsData.results);
        shuffleArray(recommendedData.results);

        if (moviesData.results?.length > 0) {
            renderHeroCarousel(moviesData.results.slice(0, 5));
            renderCategoryRow('Popular Movies', moviesData.results, contentContainer);
        }
        if (recommendedData.results?.length > 0) {
            renderCategoryRow('Recommended For You', recommendedData.results, contentContainer);
        }
        if (showsData.results?.length > 0) {
            renderCategoryRow('Popular TV Shows', showsData.results, contentContainer);
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
                <a href="/details.html?id=${media.id}&type=${mediaTypeFor(media)}" class="button-primary">More Info</a>
            </div>`;
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
        const slideIndex = parseInt(progressWrapper.dataset.index);
        if (isNaN(slideIndex)) return;

        if (heroCarouselInterval) clearInterval(heroCarouselInterval);
        
        document.querySelector('.carousel-slide.active')?.classList.remove('active');
        document.querySelector('.progress-bar-wrapper.active')?.classList.remove('active');

        document.querySelector(`.carousel-slide[data-index='${slideIndex}']`)?.classList.add('active');
        progressWrapper.classList.add('active');
        
        startCarousel(document.querySelectorAll('.carousel-slide').length, slideIndex);
    }
}

// --- Content Row Rendering & Logic ---
function renderCategoryRow(title, mediaItems, container) {
    const categorySection = document.createElement('section');
    categorySection.className = 'category-row';
    categorySection.innerHTML = `
        <h2>${title}</h2>
        <div class="media-row-wrapper">
            <button class="slider-arrow left">&lt;</button>
            <div class="media-row"></div>
            <button class="slider-arrow right">&gt;</button>
        </div>`;
    
    const mediaRow = categorySection.querySelector('.media-row');
    let cardsHtml = '';
    mediaItems.forEach(item => {
        if (item.poster_path) {
             cardsHtml += createMediaCard(item);
        }
    });
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
    return `
        <a class="movie-card" href="/details.html?id=${item.id}&type=${mediaTypeFor(item)}">
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
    const targetLink = e.target.closest('a.movie-card, a.button-primary');
    if (targetLink) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = targetLink.href; }, 400);
    }
});

// --- Helper to determine media type ---
function mediaTypeFor(item) {
    return item.media_type || (item.title ? 'movie' : 'tv');
}
