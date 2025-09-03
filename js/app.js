// =====================================================
// Personal Cinema - app.js (Debugging Version)
// =====================================================

(function () {
    'use strict';

    // ... (Sections 1-4 are the same as before, only initDetailsPage and initHomePage are changed)
    const state = { watchlist: new Set() };
    const config = { apiBaseUrl: '/.netlify/functions', imageBaseUrl: 'https://image.tmdb.org/t/p/', watchBaseUrl: 'https://www.cineby.app' };
    const ICONS = { checkmark: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`, spinner: `<div class="spinner"></div>`, add: `+` };
    async function apiRequest(functionName, params = {}, options = {}) { /* ... unchanged ... */ const urlParams = new URLSearchParams(params).toString(); const url = `${config.apiBaseUrl}/${functionName}?${urlParams}`; try { const response = await fetch(url, { ...options }); if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`); const contentType = response.headers.get("content-type"); if (contentType && contentType.includes("application/json")) return response.json(); } catch (error) { console.error(`Failed to fetch from ${functionName}:`, error); throw error; } }
    function getImageUrl(path, size = 'w500') { return path ? `${config.imageBaseUrl}${size}${path}` : null; }
    function createScrollObserver() { const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.1 }); document.querySelectorAll('.animate-in').forEach(el => observer.observe(el)); }
    function getLogoUrl(imagesData, size = 'w500') { if (!imagesData?.logos || imagesData.logos.length === 0) { return null; } const englishLogo = imagesData.logos.find(logo => logo.iso_639_1 === 'en'); if (englishLogo && englishLogo.file_path) { return getImageUrl(englishLogo.file_path, size); } const fallbackLogo = imagesData.logos[0]; if (fallbackLogo && fallbackLogo.file_path) { return getImageUrl(fallbackLogo.file_path, size); } return null; }
    async function syncWatchlist() { /* ... unchanged ... */ }
    async function addToWatchlist(item) { /* ... unchanged ... */ }
    async function removeFromWatchlist(item) { /* ... unchanged ... */ }
    function createMediaCard(item) { /* ... unchanged ... */ }
    function createShelf(elementId, title, items, skeleton = false) { /* ... unchanged ... */ }

    // --- 5. PAGE-SPECIFIC INITIALIZATION (WITH DEBUGGING) ---
    async function initHomePage() {
        // ... (code for skeleton loaders is the same)
        const heroSection = document.getElementById('hero-section');
        const shelvesContainer = document.getElementById('content-shelves');
        heroSection.innerHTML = `<div class="hero-content"><div class="skeleton" style="width: 350px; height: 64px; margin-bottom: 16px;"></div><div class="skeleton" style="width: 100%; height: 16px;"></div></div>`;
        const shelfDefinitions = [ { id: 'trending-movies-shelf', title: 'Trending Movies', endpoint: 'trending_movies' }, { id: 'top-rated-shelf', title: 'Top Rated Movies', endpoint: 'top_rated_movies' }, { id: 'popular-tv-shelf', title: 'Popular TV Shows', endpoint: 'popular_tv' } ];
        shelvesContainer.innerHTML = shelfDefinitions.map(shelf => `<div class="media-shelf animate-in" id="${shelf.id}"></div>`).join('');
        shelfDefinitions.forEach(shelf => createShelf(shelf.id, shelf.title, [], true));

        try {
            const trendingMovies = await apiRequest('get-media', { endpoint: 'trending_movies' });
            const heroItem = trendingMovies.results[0];
            const heroDetails = await apiRequest('get-media', { endpoint: 'details', type: 'movie', id: heroItem.id });
            
            // *** DEBUGGING LINE FOR HOMEPAGE ***
            console.log("--- HERO ITEM DETAILS (HOMEPAGE) ---", heroDetails);

            const logoUrl = getLogoUrl(heroDetails.images);
            const titleElement = logoUrl ? `<img src="${logoUrl}" class="hero-logo" alt="${heroItem.title} Logo">` : `<h1 class="hero-title">${heroItem.title}</h1>`;
            heroSection.innerHTML = `<img src="${getImageUrl(heroItem.backdrop_path, 'original')}" class="hero-backdrop" alt=""><div class="hero-content">${titleElement}<p class="hero-overview">${heroItem.overview}</p><a href="/details.html?type=movie&id=${heroItem.id}" class="btn btn-primary">More Info</a></div>`;
            shelfDefinitions.forEach(async (shelf) => { const data = await apiRequest('get-media', { endpoint: shelf.endpoint }); createShelf(shelf.id, shelf.title, data.results); });
        } catch (error) { heroSection.innerHTML = `<p class="container">Could not load content.</p>`; }
    }

    async function initDetailsPage() {
        const mainContent = document.getElementById('details-main-content');
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const id = Number(urlParams.get('id'));
        if (!type || !id) { mainContent.innerHTML = `<h1 class="container page-title">Error: Missing item type or ID.</h1>`; return; }
        
        try {
            await syncWatchlist();
            const details = await apiRequest('get-media', { endpoint: 'details', type, id });
            
            // *** DEBUGGING LINES FOR DETAILS PAGE ***
            console.log("--- FULL DETAILS OBJECT RECEIVED FROM API ---", details);
            console.log("--- 'images' PROPERTY WITHIN DETAILS ---", details.images);

            const title = details.title || details.name;
            document.title = `${title} | Personal Cinema`;
            const releaseDate = details.release_date || details.first_air_date;
            const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
            const runtime = type === 'movie' ? `${details.runtime} min` : `${details.number_of_seasons} seasons`;
            const genres = details.genres.map(g => `<div class="meta-pill">${g.name}</div>`).join('');
            const rating = details.vote_average ? `<div class="meta-pill"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> ${details.vote_average.toFixed(1)}</div>` : '';
            
            const logoUrl = getLogoUrl(details.images);
            const titleElement = logoUrl ? `<img src="${logoUrl}" class="details-logo" alt="${title} Logo">` : `<h1 class="title">${title}</h1>`;

            mainContent.innerHTML = `<div class="details-backdrop-container"><img src="${getImageUrl(details.backdrop_path, 'original')}" class="details-backdrop" alt=""></div><div class="details-content-container"><img src="${getImageUrl(details.poster_path, 'w500')}" class="details-poster" alt="${title} Poster"><div class="details-info">${titleElement}<div class="meta-pills"><div class="meta-pill">${year}</div>${genres}<div class="meta-pill">${runtime}</div>${rating}</div><p class="overview">${details.overview}</p><div class="action-buttons" id="action-buttons"></div></div></div><div class="container" id="details-lower-section"></div>`;
            
            // ... (rest of the function is unchanged)
            const actionButtonsContainer = document.getElementById('action-buttons');
            const isInWatchlist = state.watchlist.has(id);
            let watchUrl = type === 'movie' ? `${config.watchBaseUrl}/movie/${id}?play=true` : `${config.watchBaseUrl}/tv/${id}/${details.seasons?.find(s=>s.season_number > 0)?.season_number || 1}/1?play=true`;
            if (watchUrl) { const watchButton = document.createElement('a'); watchButton.href = watchUrl; watchButton.className = 'btn btn-primary'; watchButton.textContent = 'Watch Now'; watchButton.target = '_blank'; actionButtonsContainer.appendChild(watchButton); }
            const watchlistButton = document.createElement('button');
            watchlistButton.className = 'btn btn-secondary';
            watchlistButton.innerHTML = isInWatchlist ? `${ICONS.checkmark} In Watchlist` : `${ICONS.add} Add to Watchlist`;
            watchlistButton.addEventListener('click', async () => { /* ... */ });
            actionButtonsContainer.appendChild(watchlistButton);
            const aiButton = document.createElement('button');
            aiButton.className = 'btn btn-secondary';
            aiButton.innerHTML = '✨ Get AI Insights';
            aiButton.addEventListener('click', async () => { /* ... */ });
            actionButtonsContainer.appendChild(aiButton);

        } catch (error) { mainContent.innerHTML = `<h1 class="container page-title">Could not load item details.</h1>`; }
    }
    
    async function initWatchlistPage() { /* ... unchanged ... */ }
    function initGlobalComponents() { /* ... unchanged ... */ }
    function router() { /* ... unchanged ... */ }
    document.addEventListener('DOMContentLoaded', router);

})();
