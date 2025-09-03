// =====================================================
// Personal Media Explorer - main.js
// Version 1: Client-Side Application Logic
// =====================================================

// Use a self-invoking function to avoid polluting the global namespace
(function () {
    'use strict';

    // --- A. GLOBAL CONFIGURATION & STATE ---

    const API_BASE_URL = '/.netlify/functions';
    const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
    
    // Simple state management object
    const appState = {
        watchlist: new Set(), // A Set is used to easily check if an item exists
    };


    // --- B. CORE UTILITY FUNCTIONS ---

    /**
     * A centralized function to fetch data from our Netlify serverless functions.
     * @param {string} functionName - The name of the function file (e.g., 'get-media').
     * @param {object} [params={}] - An object of query string parameters.
     * @param {object} [options={}] - Standard options for the fetch API (method, body, etc.).
     * @returns {Promise<any>} The JSON response from the function.
     */
    async function apiRequest(functionName, params = {}, options = {}) {
        const urlParams = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/${functionName}?${urlParams}`;

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API request failed with status ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error in apiRequest for '${functionName}':`, error);
            // In a real app, you might show a user-facing error message here.
            throw error; // Re-throw the error so calling functions can handle it
        }
    }

    /**
     * Creates a full image URL from a TMDB path.
     * @param {string} path - The image path from the TMDB API.
     * @param {string} [size='w500'] - The desired image size.
     * @returns {string|null} The full image URL or null if path is missing.
     */
    function getImageUrl(path, size = 'w500') {
        return path ? `${TMDB_IMAGE_BASE_URL}${size}${path}` : null;
    }


    // --- C. WATCHLIST MANAGEMENT ---

    /**
     * Fetches the current user's watchlist from the server and updates the local state.
     */
    async function syncWatchlist() {
        try {
            const watchlistItems = await apiRequest('update-watchlist', {}, { method: 'GET' });
            const itemIds = watchlistItems.map(itemStr => JSON.parse(itemStr).id);
            appState.watchlist = new Set(itemIds);
        } catch (error) {
            console.error("Could not sync watchlist.", error);
        }
    }

    /**
     * Adds an item to the watchlist on the server and updates local state.
     * @param {object} mediaItem - The movie or TV show object to add.
     */
    async function addToWatchlist(mediaItem) {
        const watchlistItem = {
            id: mediaItem.id,
            title: mediaItem.title || mediaItem.name,
            poster_path: mediaItem.poster_path,
            media_type: mediaItem.media_type || (mediaItem.title ? 'movie' : 'tv')
        };
        try {
            await apiRequest('update-watchlist', {}, {
                method: 'POST',
                body: JSON.stringify(watchlistItem)
            });
            appState.watchlist.add(mediaItem.id);
            console.log(`${watchlistItem.title} added to watchlist.`);
        } catch (error) {
            console.error("Failed to add to watchlist.", error);
        }
    }

    /**
     * Removes an item from the watchlist on the server and updates local state.
     * @param {object} mediaItem - The movie or TV show object to remove.
     */
    async function removeFromWatchlist(mediaItem) {
        // Construct the object exactly as it would be stored to ensure lrem finds it.
        const watchlistItem = {
            id: mediaItem.id,
            title: mediaItem.title || mediaItem.name,
            poster_path: mediaItem.poster_path,
            media_type: mediaItem.media_type || (mediaItem.title ? 'movie' : 'tv')
        };
        try {
            await apiRequest('update-watchlist', {}, {
                method: 'DELETE',
                body: JSON.stringify(watchlistItem)
            });
            appState.watchlist.delete(mediaItem.id);
            console.log(`${watchlistItem.title} removed from watchlist.`);
        } catch (error) {
            console.error("Failed to remove from watchlist.", error);
        }
    }


    // --- D. PAGE-SPECIFIC INITIALIZATION LOGIC ---

    /**
     * Initializes all functionality for the Home Page (`index.html`).
     */
    async function initHomePage() {
        const heroSliderWrapper = document.getElementById('hero-slider-wrapper');
        const heroContentContainer = document.getElementById('hero-content-container');
        const contentSkeleton = document.getElementById('content-skeleton');
        const realContent = document.getElementById('real-content');

        try {
            // Fetch all required data concurrently
            const [trendingMovies, topRatedMovies, popularTV] = await Promise.all([
                apiRequest('get-media', { endpoint: 'trending_movies' }),
                apiRequest('get-media', { endpoint: 'top_rated_movies' }),
                apiRequest('get-media', { endpoint: 'popular_tv' })
            ]);

            // 1. Populate Hero Slider
            const heroSlides = trendingMovies.results.slice(0, 5); // Use top 5 for the hero
            heroSlides.forEach((movie, index) => {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';
                slide.innerHTML = `<div class="hero-slide-background" style="background-image: url(${getImageUrl(movie.backdrop_path, 'original')})"></div>`;
                heroSliderWrapper.appendChild(slide);

                const content = document.createElement('div');
                content.className = 'hero-content';
                content.dataset.index = index;
                content.innerHTML = `
                    <h1 class="hero-title-fallback">${movie.title}</h1>
                    <p class="hero-overview">${movie.overview}</p>
                    <a href="/details.html?type=movie&id=${movie.id}" class="hero-cta">View Details</a>
                `;
                heroContentContainer.appendChild(content);
            });
            
            // Initialize Swiper
            const swiper = new Swiper('.hero-slider', {
                loop: true,
                effect: 'fade',
                autoplay: { delay: 7000, disableOnInteraction: false },
                on: {
                    slideChange: function () {
                        document.querySelectorAll('.hero-content').forEach(el => el.classList.remove('is-active'));
                        const activeContent = document.querySelector(`.hero-content[data-index="${this.realIndex}"]`);
                        if(activeContent) activeContent.classList.add('is-active');
                    },
                    init: function () {
                        const initialContent = document.querySelector('.hero-content[data-index="0"]');
                        if (initialContent) initialContent.classList.add('is-active');
                    }
                }
            });

            // 2. Populate Premiere Section (Spotlight + Top 10)
            populatePremiereSection(trendingMovies.results[0], topRatedMovies.results);
            
            // 3. Populate Standard Shelves
            createShelf('trending-shelf', 'Trending Movies', trendingMovies.results);
            createShelf('popular-shelf', 'Popular TV Shows', popularTV.results);
            
            // 4. Reveal Content
            contentSkeleton.style.display = 'none';
            document.body.classList.add('loaded');

        } catch (error) {
            console.error("Failed to initialize the home page:", error);
            // Optionally, replace skeleton with an error message
            contentSkeleton.innerHTML = `<p class="error-message">Could not load content. Please try again later.</p>`;
        }
    }

    /**
     * Initializes all functionality for the Details Page (`details.html`).
     */
    async function initDetailsPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const id = urlParams.get('id');

        if (!type || !id) {
            document.getElementById('details-main-content').innerHTML = `<h1>Invalid media type or ID.</h1>`;
            return;
        }
        
        try {
            await syncWatchlist(); // Ensure watchlist status is up-to-date
            const { details, logoUrl, credits, recommendations } = await apiRequest('get-media', { endpoint: 'details', type, id });

            // 1. Set Backdrop
            const backdropPlaceholder = document.getElementById('backdrop-placeholder');
            const backdropImage = document.getElementById('backdrop-image');
            const posterPath = details.poster_path || details.backdrop_path;
            
            if (posterPath) {
                const fullImageUrl = getImageUrl(details.backdrop_path, 'original');
                backdropPlaceholder.style.backgroundImage = `url(${getImageUrl(posterPath, 'w500')})`;
                backdropImage.style.backgroundImage = `url(${fullImageUrl})`;
                backdropImage.style.opacity = 1;

                // 2. Extract Accent Color using ColorThief
                const colorThief = new ColorThief();
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = getImageUrl(posterPath, 'w300');
                img.onload = () => {
                    const dominantColor = colorThief.getColor(img);
                    document.documentElement.style.setProperty('--color-dynamic-accent', `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`);
                };
            }

            // 3. Populate Main Hero Content
            populateDetailsHero(details, logoUrl, type);

            // 4. Populate Tabbed Content
            setupTabs(details, credits, recommendations, type);

            // Hide skeleton loader
            document.getElementById('skeleton-loader').style.display = 'none';

        } catch (error) {
            console.error("Failed to initialize the details page:", error);
            document.getElementById('details-main-content').innerHTML = `<p class="error-message container">Could not load details for this item. It may not exist or there was a network error.</p>`;
        }
    }

    /**
     * Initializes all functionality for the Watchlist Page (`watchlist.html`).
     */
    async function initWatchlistPage() {
        const grid = document.getElementById('watchlist-grid');
        try {
            const watchlistItems = await apiRequest('update-watchlist', {}, { method: 'GET' });
            grid.innerHTML = ''; // Clear any placeholders

            if (watchlistItems.length === 0) {
                // The :empty CSS pseudo-class will handle the message
                return;
            }

            watchlistItems.forEach(itemStr => {
                const item = JSON.parse(itemStr);
                const card = createMediaCard(item);
                grid.appendChild(card);
            });
        } catch (error) {
            console.error("Failed to load watchlist:", error);
            grid.innerHTML = `<p class="error-message">Could not load your watchlist.</p>`;
        }
    }


    // --- E. UI COMPONENT BUILDERS ---
    
    /**
     * Creates a media card element.
     * @param {object} item - Movie or TV show object.
     * @returns {HTMLAnchorElement} The created card element.
     */
    function createMediaCard(item) {
        const type = item.media_type || (item.title ? 'movie' : 'tv');
        const card = document.createElement('a');
        card.className = 'media-card';
        card.href = `/details.html?type=${type}&id=${item.id}`;
        card.innerHTML = `
            <img src="${getImageUrl(item.poster_path, 'w500') || 'https://via.placeholder.com/500x750?text=No+Image'}" 
                 alt="${item.title || item.name}" 
                 loading="lazy">
        `;
        return card;
    }

    /**
     * Creates and populates a media shelf.
     * @param {string} elementId - The ID of the shelf container.
     * @param {string} title - The title of the shelf.
     * @param {Array} items - Array of media items.
     */
    function createShelf(elementId, title, items) {
        const shelfElement = document.getElementById(elementId);
        if (!shelfElement) return;

        const itemsHtml = items.map(item => createMediaCard(item).outerHTML).join('');

        shelfElement.innerHTML = `
            <div class="container">
                <h2 class="shelf-title">${title}</h2>
            </div>
            <div class="media-scroller">
                <div class="media-scroller-inner">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Populates the "Premiere" section on the homepage.
     * @param {object} headlinerItem - The main featured item.
     * @param {Array} topItems - The list of top items for the shortlist.
     */
    function populatePremiereSection(headlinerItem, topItems) {
        const section = document.getElementById('premiere-section');
        const topTen = topItems.slice(0, 10);

        const shortlistHtml = topTen.map((item, index) => `
            <a href="/details.html?type=movie&id=${item.id}" class="shortlist-item">
                <span class="shortlist-rank">${index + 1}</span>
                <span class="shortlist-title-text">${item.title}</span>
                <img src="${getImageUrl(item.poster_path, 'w300')}" class="shortlist-poster-peek" loading="lazy">
            </a>
        `).join('');

        section.innerHTML = `
            <a href="/details.html?type=movie&id=${headlinerItem.id}" class="premiere-headliner">
                <img src="${getImageUrl(headlinerItem.backdrop_path, 'w1280')}" class="headliner-backdrop" loading="lazy">
                <div class="headliner-content">
                    <h3 class="headliner-title">${headlinerItem.title}</h3>
                    <p class="headliner-overview">${headlinerItem.overview}</p>
                </div>
            </a>
            <div class="premiere-shortlist">
                <h2 class="shortlist-title">Top Rated This Week</h2>
                ${shortlistHtml}
            </div>
        `;
    }

    /**
     * Populates the hero section of the details page.
     * @param {object} details - The full details object for the media.
     * @param {string|null} logoUrl - The URL for the media's logo, if available.
     * @param {string} type - The media type ('movie' or 'tv').
     */
    function populateDetailsHero(details, logoUrl, type) {
        const mainContent = document.getElementById('details-main-content');
        
        const title = details.title || details.name;
        const releaseDate = details.release_date || details.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
        const runtime = type === 'movie' ? `${details.runtime} min` : `${details.number_of_seasons} seasons`;
        const genres = details.genres.map(g => g.name).slice(0, 2).join(', ');

        // Watchlist button logic
        const isInWatchlist = appState.watchlist.has(details.id);
        const watchlistButtonText = isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist';
        const watchlistButtonClass = isInWatchlist ? 'btn-secondary' : 'btn-primary';

        const heroHTML = `
            <div class="details-content-overlay">
                ${logoUrl ? `<img src="${logoUrl}" alt="${title} logo" class="media-logo">` : `<h1 class="fallback-title">${title}</h1>`}
                
                <div class="details-meta-pills">
                    <span>${year}</span>
                    ${genres ? `<span>${genres}</span>` : ''}
                    <span>${runtime}</span>
                    ${details.vote_average ? `<span>⭐ ${details.vote_average.toFixed(1)}</span>` : ''}
                </div>

                <p class="details-overview">${details.overview}</p>

                <div class="details-buttons-container">
                    <button id="watchlist-toggle-btn" class="${watchlistButtonClass}">${watchlistButtonText}</button>
                    <!-- Add other buttons like a trailer button here if desired -->
                </div>
            </div>
        `;
        mainContent.innerHTML = heroHTML;

        // Add event listener for the new button
        document.getElementById('watchlist-toggle-btn').addEventListener('click', async (e) => {
            const button = e.target;
            button.disabled = true; // Prevent double-clicks
            const currentStatus = appState.watchlist.has(details.id);

            if (currentStatus) {
                await removeFromWatchlist(details);
            } else {
                await addToWatchlist(details);
            }
            
            // Update button appearance after action
            const newStatus = appState.watchlist.has(details.id);
            button.textContent = newStatus ? 'Remove from Watchlist' : 'Add to Watchlist';
            button.className = newStatus ? 'btn-secondary' : 'btn-primary';
            button.disabled = false;
        });
    }


    // --- F. DETAILS PAGE - TABS & DYNAMIC CONTENT ---

    /**
     * Sets up the navigation and panels for the tabbed content area.
     * @param {object} details - Full media details.
     * @param {object} credits - Credits object.
     * @param {object} recommendations - Recommendations object.
     * @param {string} type - Media type ('movie' or 'tv').
     */
    function setupTabs(details, credits, recommendations, type) {
        const navContainer = document.getElementById('details-tabs-nav');
        const contentContainer = document.getElementById('details-tabs-content');
        navContainer.innerHTML = '';
        contentContainer.innerHTML = '';

        const tabs = [];
        if (type === 'tv' && details.seasons_details?.length > 0) {
            tabs.push({ title: 'Episodes', content: createSeasonsPanel(details) });
        }
        if (credits.cast?.length > 0) {
            tabs.push({ title: 'Cast', content: createGridPanel(credits.cast, 'cast') });
        }
        if (recommendations.results?.length > 0) {
            tabs.push({ title: 'More Like This', content: createGridPanel(recommendations.results, 'recommendation') });
        }
        
        tabs.forEach((tab, index) => {
            // Create nav button
            const btn = document.createElement('button');
            btn.className = 'tab-nav-btn';
            btn.textContent = tab.title;
            btn.dataset.tabIndex = index;
            if (index === 0) btn.classList.add('active');
            navContainer.appendChild(btn);

            // Create content panel
            const panel = document.createElement('div');
            panel.className = 'tab-panel';
            panel.dataset.tabIndex = index;
            if (index === 0) panel.classList.add('active');
            panel.innerHTML = tab.content;
            contentContainer.appendChild(panel);
        });

        // Add event listener for tab navigation
        navContainer.addEventListener('click', (e) => {
            if (e.target.matches('.tab-nav-btn')) {
                const tabIndex = e.target.dataset.tabIndex;
                navContainer.querySelectorAll('.tab-nav-btn').forEach(btn => btn.classList.remove('active'));
                contentContainer.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
                
                e.target.classList.add('active');
                contentContainer.querySelector(`.tab-panel[data-tab-index="${tabIndex}"]`).classList.add('active');
            }
        });

        // Activate season-specific logic if the seasons panel exists
        if (contentContainer.querySelector('.seasons-section')) {
            activateSeasonsLogic(details);
        }
    }

    /**
     * Creates the HTML content for a generic grid panel (Cast, Recommendations).
     * @param {Array} items - The items to display in the grid.
     * @param {string} type - 'cast' or 'recommendation'.
     * @returns {string} The HTML string for the panel.
     */
    function createGridPanel(items, type) {
        const cards = items.slice(0, 18).map(item => {
            const imgPath = type === 'cast' ? item.profile_path : item.poster_path;
            const title = item.name || item.title;
            const subtitle = type === 'cast' ? item.character : (new Date(item.release_date || item.first_air_date).getFullYear() || '');
            const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
            
            return `
                <a href="/details.html?type=${mediaType}&id=${item.id}" class="grid-card">
                    <img src="${getImageUrl(imgPath, 'w300') || 'https://via.placeholder.com/300x450?text=No+Image'}" class="grid-card-img" loading="lazy">
                    <div class="grid-card-title">${title}</div>
                    ${subtitle ? `<div class="grid-card-subtitle">${subtitle}</div>` : ''}
                </a>
            `;
        }).join('');
        return `<div class="details-grid">${cards}</div>`;
    }

    /**
     * Creates the HTML content for the TV seasons/episodes panel.
     * @param {object} details - The full TV show details object.
     * @returns {string} The HTML string for the panel.
     */
    function createSeasonsPanel(details) {
        const seasonPills = details.seasons_details.map((season, index) =>
            `<button class="season-pill ${index === 0 ? 'active' : ''}" data-season-index="${index}">${season.name}</button>`
        ).join('');

        return `
            <div class="seasons-section">
                <nav class="season-pills-nav">${seasonPills}</nav>
                <div id="episodes-grid"></div>
            </div>
        `;
    }

    /**
     * Adds event listeners and logic for the interactive seasons panel.
     * @param {object} details - The full TV show details object.
     */
    function activateSeasonsLogic(details) {
        const nav = document.querySelector('.season-pills-nav');
        const grid = document.getElementById('episodes-grid');
        
        // Function to display episodes for a given season index
        function displaySeason(seasonIndex) {
            const season = details.seasons_details[seasonIndex];
            if (!season || !season.episodes) {
                grid.innerHTML = '<p>No episode information available for this season.</p>';
                return;
            }
            grid.innerHTML = season.episodes.map(ep => `
                <div class="episode-card">
                    <span class="episode-number">${ep.episode_number}</span>
                    <img src="${ep.thumbnail_url}" class="episode-thumbnail" loading="lazy">
                    <div class="episode-info">
                        <h4 class="episode-title">${ep.name}</h4>
                        <p class="episode-overview">${ep.overview}</p>
                    </div>
                </div>
            `).join('');
        }

        // Add event listener to the season pills navigation
        nav.addEventListener('click', (e) => {
            if (e.target.matches('.season-pill')) {
                nav.querySelectorAll('.season-pill').forEach(pill => pill.classList.remove('active'));
                e.target.classList.add('active');
                displaySeason(e.target.dataset.seasonIndex);
            }
        });

        // Display the first season by default
        displaySeason(0);
    }


    // --- G. GLOBAL EVENT LISTENERS & INITIAL ROUTER ---

    /**
     * Handles the transparent-to-solid transition for the main header on scroll.
     */
    function handleHeaderScroll() {
        const header = document.getElementById('main-header');
        if (!header) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    /**
     * Simple router to execute page-specific code based on a body class.
     */
    function router() {
        const bodyClass = document.body.className;

        if (bodyClass.includes('home-page')) {
            initHomePage();
        } else if (bodyClass.includes('details-page')) {
            initDetailsPage();
        } else if (bodyClass.includes('watchlist-page')) {
            initWatchlistPage();
        }
    }

    // --- H. SCRIPT EXECUTION ---

    // When the DOM is fully loaded, run the application.
    document.addEventListener('DOMContentLoaded', () => {
        handleHeaderScroll();
        router();
    });

})();
