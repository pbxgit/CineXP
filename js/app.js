// =====================================================
// Personal Cinema - app.js
// =====================================================

(function () {
    'use strict';

    // --- 1. GLOBAL STATE & CONFIGURATION ---
    const state = {
        currentUser: null,
        watchlist: new Set(), // A Set of item IDs for quick lookups
    };
    
    const config = {
        apiBaseUrl: '/.netlify/functions',
        imageBaseUrl: 'https://image.tmdb.org/t/p/',
    };

    // --- 2. UTILITY & API FUNCTIONS ---
    async function apiRequest(functionName, params = {}, options = {}) {
        const urlParams = new URLSearchParams(params).toString();
        const url = `${config.apiBaseUrl}/${functionName}?${urlParams}`;
        
        // Netlify Identity provides a JWT for authentication
        const user = window.netlifyIdentity.currentUser();
        const headers = { ...options.headers };
        if (user) {
            headers['Authorization'] = `Bearer ${user.token.access_token}`;
        }

        try {
            const response = await fetch(url, { ...options, headers });
            if (!response.ok) {
                // Handle unauthorized or other errors gracefully
                if (response.status === 401) {
                    console.warn('Unauthorized request. User may need to log in.');
                }
                throw new Error(`API Error: ${response.statusText}`);
            }
            // Some responses might be empty (e.g., DELETE), handle that.
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            }
            return;

        } catch (error) {
            console.error(`Failed to fetch from ${functionName}:`, error);
            throw error;
        }
    }

    function getImageUrl(path, size = 'w500') {
        return path ? `${config.imageBaseUrl}${size}${path}` : '';
    }

    // --- 3. WATCHLIST MANAGEMENT ---
    async function syncWatchlist() {
        if (!state.currentUser) return;
        try {
            const items = await apiRequest('update-watchlist', {}, { method: 'GET' });
            state.watchlist = new Set(items.map(item => item.id));
        } catch (error) {
            console.error('Could not sync watchlist.', error);
        }
    }

    async function addToWatchlist(item) {
        const watchlistItem = { id: item.id, title: item.title || item.name, poster_path: item.poster_path, media_type: item.media_type };
        await apiRequest('update-watchlist', {}, { method: 'POST', body: JSON.stringify(watchlistItem) });
        state.watchlist.add(item.id);
    }

    async function removeFromWatchlist(item) {
        const watchlistItem = { id: item.id, title: item.title || item.name, poster_path: item.poster_path, media_type: item.media_type };
        await apiRequest('update-watchlist', {}, { method: 'DELETE', body: JSON.stringify(watchlistItem) });
        state.watchlist.delete(item.id);
    }

    // --- 4. UI COMPONENT BUILDERS ---
    // createMediaCard and createShelf remain the same from Phase 1...
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

    // --- 5. PAGE-SPECIFIC INITIALIZATION ---
    
    async function initHomePage() {
        // This function remains largely the same, but you could now add a
        // personalized "From Your Watchlist" shelf if the user is logged in.
        const heroSection = document.getElementById('hero-section');
        const shelvesContainer = document.getElementById('content-shelves');

        heroSection.innerHTML = `<div class="hero-content"><div class="skeleton" style="width: 350px; height: 64px; margin-bottom: 16px;"></div><div class="skeleton" style="width: 100%; height: 16px;"></div></div>`;
        const shelfDefinitions = [
            { id: 'trending-movies-shelf', title: 'Trending Movies', endpoint: 'trending_movies' },
            { id: 'top-rated-shelf', title: 'Top Rated Movies', endpoint: 'top_rated_movies' },
            { id: 'popular-tv-shelf', title: 'Popular TV Shows', endpoint: 'popular_tv' }
        ];
        shelvesContainer.innerHTML = shelfDefinitions.map(shelf => `<div class="media-shelf" id="${shelf.id}"></div>`).join('');
        shelfDefinitions.forEach(shelf => createShelf(shelf.id, shelf.title, [], true));

        try {
            const trendingMovies = await apiRequest('get-media', { endpoint: 'trending_movies' });
            const heroItem = trendingMovies.results[0];
            heroItem.media_type = 'movie'; // Add media_type for watchlist consistency
            
            const logoUrl = getImageUrl(heroItem.images?.logos?.find(l => l.iso_639_1 === 'en')?.file_path, 'w500');
            heroSection.innerHTML = `<img src="${getImageUrl(heroItem.backdrop_path, 'original')}" class="hero-backdrop" alt=""><div class="hero-content">${logoUrl ? `<img src="${logoUrl}" class="hero-logo" alt="${heroItem.title} Logo">` : `<h1 class="hero-title">${heroItem.title}</h1>`}<p class="hero-overview">${heroItem.overview}</p><a href="/details.html?type=movie&id=${heroItem.id}" class="btn btn-primary">More Info</a></div>`;
            
            shelfDefinitions.forEach(async (shelf) => {
                const data = await apiRequest('get-media', { endpoint: shelf.endpoint });
                data.results.forEach(item => item.media_type = shelf.endpoint.includes('tv') ? 'tv' : 'movie');
                createShelf(shelf.id, shelf.title, data.results);
            });
        } catch (error) {
            heroSection.innerHTML = `<p class="container">Could not load content.</p>`;
        }
    }

    async function initDetailsPage() {
    const mainContent = document.getElementById('details-main-content');
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = Number(urlParams.get('id'));

    if (!type || !id) {
        mainContent.innerHTML = `<h1 class="container">Error: Missing item type or ID.</h1>`;
        return;
    }

    try {
        await syncWatchlist();
        const details = await apiRequest('get-media', { endpoint: 'details', type, id });
        details.media_type = type;
        
        const title = details.title || details.name;
        document.title = `${title} | Personal Cinema`;

        const releaseDate = details.release_date || details.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
        const runtime = type === 'movie' ? `${details.runtime} min` : `${details.number_of_seasons} seasons`;
        const genres = details.genres.map(g => g.name).slice(0, 3).join(', ');
        
        const isInWatchlist = state.watchlist.has(id);

        // --- Main HTML Structure (with placeholder for AI section) ---
        mainContent.innerHTML = `
            <div class="details-backdrop-container"><img src="${getImageUrl(details.backdrop_path, 'original')}" class="details-backdrop" alt=""></div>
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
                    <div class="action-buttons" id="action-buttons">
                        <!-- Buttons will be rendered by JS -->
                    </div>
                </div>
            </div>
            <div class="container" id="details-lower-section">
                <!-- AI Insights Section will be rendered here -->
            </div>
        `;
        
        // --- Render Interactive Buttons ---
        const actionButtonsContainer = document.getElementById('action-buttons');
        if (state.currentUser) {
            // Watchlist Button
            const watchlistButton = document.createElement('button');
            watchlistButton.className = 'btn';
            watchlistButton.classList.add(isInWatchlist ? 'btn-secondary' : 'btn-primary');
            watchlistButton.textContent = isInWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist';
            
            watchlistButton.addEventListener('click', async () => { /* ... existing watchlist logic ... */ });
            actionButtonsContainer.appendChild(watchlistButton);

            // AI Insights Button
            const aiButton = document.createElement('button');
aiButton.className = 'btn btn-secondary';
aiButton.innerHTML = '✨ Get AI Insights'; // Using an emoji for flair
actionButtonsContainer.appendChild(aiButton);

aiButton.addEventListener('click', async () => {
    aiButton.disabled = true;
    aiButton.innerHTML = '<div class="spinner"></div>';
    const lowerSection = document.getElementById('details-lower-section');
    
    // Ensure the AI section exists
    if (!document.getElementById('ai-insights-section')) {
        lowerSection.innerHTML = `
            <section class="ai-insights-section" id="ai-insights-section">
                <h2 class="ai-insights-title">The Vibe</h2>
                <div class="ai-insights-content" id="ai-insights-content">
                    <p>Generating insights...</p>
                </div>
            </section>
        `;
    }
    
    const contentContainer = document.getElementById('ai-insights-content');

    try {
        const aiData = await apiRequest('get-ai-insights', { movieTitle: title, genres });
        contentContainer.innerHTML = `<p>${aiData.summary.replace(/\n/g, '<br>')}</p>`;
        // Hide the button after successful use to avoid clutter
        aiButton.style.display = 'none';
    } catch (error) {
        contentContainer.innerHTML = `<p>Sorry, the AI is unable to provide insights at this moment.</p>`;
        aiButton.disabled = false;
        aiButton.innerHTML = '✨ Try Again';
    }
});
        } else {
            actionButtonsContainer.innerHTML = `<button class="btn btn-secondary" onclick="window.netlifyIdentity.open()">Log In for Watchlist & AI Features</button>`;
        }
    } catch (error) {
        mainContent.innerHTML = `<h1 class="container">Could not load item details.</h1>`;
    }
}

    

    async function initWatchlistPage() {
        const grid = document.getElementById('watchlist-grid');
        grid.innerHTML = '<p>Loading your watchlist...</p>';

        if (!state.currentUser) {
            grid.innerHTML = '<p>Please log in to view your watchlist.</p>';
            return;
        }

        try {
            const items = await apiRequest('update-watchlist', {}, { method: 'GET' });
            if (items.length === 0) {
                grid.innerHTML = '<p>Your watchlist is empty. Add some movies and TV shows!</p>';
                return;
            }
            grid.innerHTML = items.map(createMediaCard).join('');
        } catch (error) {
            grid.innerHTML = '<p>Could not load your watchlist. Please try again.</p>';
        }
    }
    
    // --- 6. GLOBAL INITIALIZATION & ROUTER ---

    function initGlobalComponents() {
        const header = document.getElementById('main-header');
        if (!header) return;

        header.innerHTML = `
            <nav class="main-nav container">
                <a href="/" class="nav-logo">CINEMA</a>
                <div class="nav-links">
                    <a href="/" class="${document.body.classList.contains('home-page') ? 'active' : ''}">Home</a>
                    <a href="/watchlist.html" class="${document.body.classList.contains('watchlist-page') ? 'active' : ''}">Watchlist</a>
                    <div data-netlify-identity-button></div> <!-- Login/Logout button renders here -->
                </div>
            </nav>
        `;
        
        window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 50));
    }

    function handleAuthEvents() {
        window.netlifyIdentity.on('init', user => {
            state.currentUser = user;
            router(); // Re-run router to update UI after knowing user state
        });
        window.netlifyIdentity.on('login', user => {
            state.currentUser = user;
            window.location.reload(); // Reload the page to get fresh data
        });
        window.netlifyIdentity.on('logout', () => {
            state.currentUser = null;
            window.location.reload(); // Reload to clear personal data
        });
    }

    function router() {
        initGlobalComponents();
        const bodyClass = document.body.className;

        if (bodyClass.includes('home-page')) initHomePage();
        else if (bodyClass.includes('details-page')) initDetailsPage();
        else if (bodyClass.includes('watchlist-page')) initWatchlistPage();
    }
    
    // --- 7. SCRIPT EXECUTION ---
    document.addEventListener('DOMContentLoaded', () => {
        handleAuthEvents();
        window.netlifyIdentity.init();
    });

})();
