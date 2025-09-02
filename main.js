/*
=====================================================
    Personal Media Explorer - Main JavaScript File
    (UPDATED to work with the 'get-media' Netlify function)
=====================================================

    TABLE OF CONTENTS
    -----------------
    1.  GLOBAL CONFIGURATION & STATE
    2.  ROUTER & PAGE INITIALIZATION
    3.  API UTILITIES
    4.  HOME PAGE LOGIC
    5.  DETAILS PAGE LOGIC
    6.  WATCHLIST LOGIC
    7.  UI COMPONENTS & HELPERS
    8.  EVENT LISTENERS & OBSERVERS
*/

// 1. GLOBAL CONFIGURATION & STATE
// CORRECTED: Point to your actual Netlify function file
const API_BASE_URL = '/.netlify/functions/get-media'; 
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// 2. ROUTER & PAGE INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path === '/' || path === '/index.html') {
        initHomePage();
    } else if (path.includes('/details.html')) {
        initDetailsPage();
    } else if (path.includes('/watchlist.html')) {
        initWatchlistPage();
    }

    setupHeaderScroll();
});

// 3. API UTILITIES
// CORRECTED: This function now builds URLs that your 'get-media' function understands
async function fetchFromAPI(params) {
    try {
        const urlParams = new URLSearchParams(params);
        const response = await fetch(`${API_BASE_URL}?${urlParams}`);
        if (!response.ok) {
            throw new Error(`API error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching from API function:", error);
        return null;
    }
}

// 4. HOME PAGE LOGIC
async function initHomePage() {
    console.log("Initializing Home Page");
    // CORRECTED: Use the endpoint names defined in your 'get-media.js' function
    const [trendingMovies, popularTV, topRatedMovies] = await Promise.all([
        fetchFromAPI({ endpoint: 'trending_movies' }),
        fetchFromAPI({ endpoint: 'popular_tv' }),
        fetchFromAPI({ endpoint: 'top_rated_movies' }) // Assuming you want top rated for the Top 10
    ]);

    if (trendingMovies) setupHeroSlider(trendingMovies.results.slice(0, 5));
    if (topRatedMovies) populateTop10Shelf(topRatedMovies.results.slice(0, 10));
    if (trendingMovies) populateShelf('trending-movies-grid', trendingMovies.results, 'movie');
    if (popularTV) populateShelf('popular-tv-grid', popularTV.results, 'tv');
    
    setupIntersectionObserver();
}

function setupHeroSlider(slidesData) {
    const wrapper = document.getElementById('hero-slider-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = slidesData.map(item => `
        <div class="swiper-slide hero-slide" style="background-image: url('${IMAGE_BASE_URL}original${item.backdrop_path}');">
            <a href="/details.html?id=${item.id}&type=movie" style="display: block; width: 100%; height: 100%;">
                <div class="hero-slide-content">
                    <h1 class="hero-slide-title">${item.title || item.name}</h1>
                    <p class="hero-slide-overview">${item.overview}</p>
                </div>
            </a>
        </div>
    `).join('');

    new Swiper('.hero-slider', {
        loop: true,
        autoplay: { delay: 5000 },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });
}

function populateTop10Shelf(items) {
    const grid = document.getElementById('top-10-grid');
    if (!grid) return;
    grid.innerHTML = items.map((item, index) => `
        <a href="/details.html?id=${item.id}&type=movie" class="top-ten-card">
            <span class="top-ten-number">${index + 1}</span>
            <img src="${IMAGE_BASE_URL}w300${item.poster_path}" alt="${item.title}" class="top-ten-poster">
        </a>
    `).join('');
}

function populateShelf(gridId, items, type) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = items.map(item => createMediaCard(item, type)).join('');
}

// 5. DETAILS PAGE LOGIC
async function initDetailsPage() {
    console.log("Initializing Details Page");
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const type = urlParams.get('type');

    if (!id || !type) {
        showErrorState("Missing movie/TV ID or type from URL.");
        return;
    }

    // CORRECTED: Fetch details using the 'details' endpoint of your 'get-media' function
    const data = await fetchFromAPI({ endpoint: 'details', type, id });

    if (data && data.details) {
        displayDetails(data, type);
    } else {
        showErrorState("Could not fetch details for this item.");
    }
}

// CORRECTED: This function now handles the rich data object from your backend
function displayDetails(data, type) {
    const { details, logoUrl } = data; // Destructure the response
    const mainContent = document.getElementById('details-main-content');
    if (!mainContent) return;

    const backdropUrl = details.backdrop_path ? `${IMAGE_BASE_URL}original${details.backdrop_path}` : '';
    
    const backdropPlaceholder = document.getElementById('backdrop-placeholder');
    const backdropImage = document.getElementById('backdrop-image');
    if(backdropUrl) {
        backdropPlaceholder.style.backgroundImage = `url('${IMAGE_BASE_URL}w500${details.backdrop_path}')`;
        const img = new Image();
        img.src = backdropUrl;
        img.onload = () => {
            backdropImage.style.backgroundImage = `url('${backdropUrl}')`;
            backdropImage.style.opacity = 1;
        };
    }

    const title = details.title || details.name;
    const releaseDate = details.release_date || details.first_air_date || '';
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
    const runtime = details.runtime ? `${details.runtime} min` : (details.number_of_seasons ? `${details.number_of_seasons} seasons` : '');
    const genres = details.genres.map(g => g.name).join(', ');

    const detailsHTML = `
        <div class="details-content-overlay">
            ${logoUrl ? `<img src="${logoUrl}" alt="${title} Logo" class="media-logo">` : `<h1 class="fallback-title">${title}</h1>`}
            
            <div class="details-meta" style="display: flex; gap: 1rem; margin-bottom: 1rem; color: var(--color-text-secondary);">
                <span>${year}</span>
                ${runtime ? `<span>•</span><span>${runtime}</span>` : ''}
                ${genres ? `<span>•</span><span>${genres}</span>` : ''}
            </div>

            <p class="details-overview" style="font-size: 1rem; line-height: 1.6;">${details.overview}</p>
            
            <div class="details-buttons" style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                <button class="btn btn-primary" style="padding: 0.75rem 1.5rem; border: none; border-radius: 6px; background-color: var(--color-accent); color: white; font-weight: bold; cursor: pointer;">Play Trailer</button>
                <button class="btn btn-secondary" id="watchlist-btn" style="padding: 0.75rem 1.5rem; border: 1px solid var(--color-border); border-radius: 6px; background-color: rgba(30,30,30,0.5); color: white; font-weight: bold; cursor: pointer;">Add to Watchlist</button>
            </div>
        </div>
    `;
    
    mainContent.innerHTML = detailsHTML;
    
    setupWatchlistButton(details, type);
}

function showErrorState(message) {
    console.error(message);
    const skeleton = document.getElementById('skeleton-loader');
    const errorMsg = document.getElementById('error-message');
    if (skeleton) skeleton.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'block';
}

// 6. WATCHLIST LOGIC (Remains mostly the same, uses local storage for now)
function setupWatchlistButton(details, type) {
    const btn = document.getElementById('watchlist-btn');
    if (!btn) return;
    
    let watchlist = getWatchlist();
    const itemId = `${type}-${details.id}`;

    function updateButtonState() {
        if (watchlist.find(item => item.id === itemId)) {
            btn.textContent = 'Remove from Watchlist';
        } else {
            btn.textContent = 'Add to Watchlist';
        }
    }

    btn.addEventListener('click', () => {
        const itemIndex = watchlist.findIndex(item => item.id === itemId);
        if (itemIndex > -1) {
            watchlist.splice(itemIndex, 1); 
        } else {
            watchlist.push({ id: itemId, tmdbId: details.id, type: type, title: details.title || details.name, poster_path: details.poster_path });
        }
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        updateButtonState();
    });

    updateButtonState();
}

function getWatchlist() {
    return JSON.parse(localStorage.getItem('watchlist') || '[]');
}

function initWatchlistPage() {
    const watchlist = getWatchlist();
    const grid = document.getElementById('watchlist-grid');
    if (!grid) return;
    if (watchlist.length > 0) {
        grid.innerHTML = watchlist.map(item => createMediaCard(item, item.type)).join('');
    }
}

// 7. UI COMPONENTS & HELPERS
function createMediaCard(item, type) {
    const title = item.title || item.name;
    const id = item.tmdbId || item.id;
    return `
        <a href="/details.html?id=${id}&type=${type}" class="media-card">
            <img src="${IMAGE_BASE_URL}w500${item.poster_path}" alt="${title}" loading="lazy">
        </a>
    `;
}

function setupHeaderScroll() {
    const header = document.getElementById('main-header');
    if(header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

// 8. EVENT LISTENERS & OBSERVERS
function setupIntersectionObserver() {
    const animatedElements = document.querySelectorAll('[data-animation="fade-in-up"]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => observer.observe(el));
}
