// =====================================================
// Personal Cinema - app.js
// =====================================================

(function () {
    'use strict';

    // --- 1. GLOBAL STATE & CONFIGURATION ---
    const state = {}; // Will be used in Phase 2
    
    const config = {
        apiBaseUrl: '/.netlify/functions',
        imageBaseUrl: 'https://image.tmdb.org/t/p/',
    };

    // --- 2. UTILITY FUNCTIONS ---
    async function apiRequest(functionName, params = {}) {
        const urlParams = new URLSearchParams(params).toString();
        const url = `${config.apiBaseUrl}/${functionName}?${urlParams}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            return response.json();
        } catch (error) {
            console.error(`Failed to fetch from ${functionName}:`, error);
            throw error;
        }
    }

    function getImageUrl(path, size = 'w500') {
        return path ? `${config.imageBaseUrl}${size}${path}` : '';
    }

    // --- 3. UI COMPONENT BUILDERS ---

    function createMediaCard(item) {
        const type = item.media_type || (item.title ? 'movie' : 'tv');
        const posterUrl = getImageUrl(item.poster_path, 'w500') || 'https://via.placeholder.com/500x750?text=No+Image';
        return `
            <a href="/details.html?type=${type}&id=${item.id}" class="media-card">
                <img src="${posterUrl}" alt="${item.title || item.name}" loading="lazy">
            </a>
        `;
    }

    function createShelf(elementId, title, items, skeleton = false) {
        const container = document.getElementById(elementId);
        if (!container) return;

        let content;
        if (skeleton) {
            content = Array(10).fill('<div class="media-card skeleton"></div>').join('');
        } else {
            content = items.map(createMediaCard).join('');
        }
        
        container.innerHTML = `
            <h2 class="shelf-title">${skeleton ? '<div class="skeleton" style="width: 250px; height: 28px;"></div>' : title}</h2>
            <div class="media-scroller">
                <div class="media-scroller-inner">
                    ${content}
                </div>
            </div>
        `;
    }

    // --- 4. PAGE-SPECIFIC INITIALIZATION ---
    
    async function initHomePage() {
        const heroSection = document.getElementById('hero-section');
        const shelvesContainer = document.getElementById('content-shelves');

        // --- Render Skeletons Immediately ---
        heroSection.innerHTML = `
            <div class="hero-content">
                <div class="skeleton" style="width: 350px; height: 64px; margin-bottom: 16px;"></div>
                <div class="skeleton" style="width: 100%; height: 16px; margin-bottom: 8px;"></div>
                <div class="skeleton" style="width: 80%; height: 16px; margin-bottom: 32px;"></div>
                <div class="skeleton" style="width: 180px; height: 48px; border-radius: 12px;"></div>
            </div>`;
        
        const shelfDefinitions = [
            { id: 'trending-movies-shelf', title: 'Trending Movies', endpoint: 'trending_movies' },
            { id: 'top-rated-shelf', title: 'Top Rated Movies', endpoint: 'top_rated_movies' },
            { id: 'popular-tv-shelf', title: 'Popular TV Shows', endpoint: 'popular_tv' }
        ];

        shelvesContainer.innerHTML = shelfDefinitions.map(shelf => `<div class="media-shelf" id="${shelf.id}"></div>`).join('');
        shelfDefinitions.forEach(shelf => createShelf(shelf.id, shelf.title, [], true));

        // --- Fetch Real Data ---
        try {
            const trendingMovies = await apiRequest('get-media', { endpoint: 'trending_movies' });
            
            // Populate Hero
            const heroItem = trendingMovies.results[0];
            const logoUrl = getImageUrl(heroItem.images?.logos?.find(l => l.iso_639_1 === 'en')?.file_path, 'w500');
            heroSection.innerHTML = `
                <img src="${getImageUrl(heroItem.backdrop_path, 'original')}" class="hero-backdrop" alt="">
                <div class="hero-content">
                    ${logoUrl ? `<img src="${logoUrl}" class="hero-logo" alt="${heroItem.title} Logo">` : `<h1 class="hero-title">${heroItem.title}</h1>`}
                    <p class="hero-overview">${heroItem.overview}</p>
                    <a href="/details.html?type=movie&id=${heroItem.id}" class="btn btn-primary">More Info</a>
                </div>
            `;
            
            // Populate Shelves Concurrently
            shelfDefinitions.forEach(async (shelf) => {
                const data = await apiRequest('get-media', { endpoint: shelf.endpoint });
                createShelf(shelf.id, shelf.title, data.results);
            });

        } catch (error) {
            heroSection.innerHTML = `<p class="container">Could not load content. Please try again later.</p>`;
        }
    }

    async function initDetailsPage() {
        const mainContent = document.getElementById('details-main-content');
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const id = urlParams.get('id');

        if (!type || !id) {
            mainContent.innerHTML = `<h1 class="container">Error: Missing item type or ID.</h1>`;
            return;
        }

        try {
            const details = await apiRequest('get-media', { endpoint: 'details', type, id });
            
            const title = details.title || details.name;
            document.title = `${title} | Personal Cinema`;

            const releaseDate = details.release_date || details.first_air_date;
            const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
            const runtime = type === 'movie' ? `${details.runtime} min` : `${details.number_of_seasons} seasons`;
            const genres = details.genres.map(g => g.name).slice(0, 3).join(', ');

            mainContent.innerHTML = `
                <div class="details-backdrop-container">
                    <img src="${getImageUrl(details.backdrop_path, 'original')}" class="details-backdrop" alt="">
                </div>
                <div class="details-content-container">
                    <img src="${getImageUrl(details.poster_path, 'w500')}" class="details-poster" alt="${title} Poster">
                    <div class="details-info">
                        <h1 class="title">${title}</h1>
                        <div class="meta-pills">
                            <span>${year}</span>
                            ${genres ? `<span>${genres}</span>` : ''}
                            <span>${runtime}</span>
                            ${details.vote_average ? `<span>⭐ ${details.vote_average.toFixed(1)}</span>` : ''}
                        </div>
                        <p class="overview">${details.overview}</p>
                        <div class="action-buttons">
                            <button class="btn btn-primary">Add to Watchlist</button>
                            <button class="btn btn-secondary">Play Trailer</button>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            mainContent.innerHTML = `<h1 class="container">Could not load item details.</h1>`;
        }
    }

    function initWatchlistPage() {
        console.log("Initializing Watchlist Page...");
        // This will be built out in Phase 2.
    }
    
    // --- 5. GLOBAL INITIALIZATION & ROUTER ---

    function initGlobalComponents() {
        const header = document.getElementById('main-header');
        if (!header) return;

        header.innerHTML = `
            <nav class="main-nav container">
                <a href="/" class="nav-logo">CINEMA</a>
                <div class="nav-links">
                    <a href="/" class="${document.body.classList.contains('home-page') ? 'active' : ''}">Home</a>
                    <a href="/watchlist.html" class="${document.body.classList.contains('watchlist-page') ? 'active' : ''}">Watchlist</a>
                </div>
            </nav>
        `;
        
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    function router() {
        initGlobalComponents();
        const bodyClass = document.body.className;

        if (bodyClass.includes('home-page')) initHomePage();
        else if (bodyClass.includes('details-page')) initDetailsPage();
        else if (bodyClass.includes('watchlist-page')) initWatchlistPage();
    }
    
    // --- 6. SCRIPT EXECUTION ---
    document.addEventListener('DOMContentLoaded', router);

})();
