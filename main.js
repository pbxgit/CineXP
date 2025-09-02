/**
 * =================================================================
 * Movie Explorer - Main JavaScript File (Corrected)
 * =================================================================
 *
 * Handles:
 * 1.  Homepage Logic: Fetching and displaying shelves, using the CSS-intended
 *     'loaded' class to trigger visibility.
 * 2.  Details Page Logic: Fetching and displaying details for a specific media item.
 * 3.  Global Logic: Header scroll effects.
 *
 */

const API_BASE_URL = '/.netlify/functions/get-media';

/**
 * -----------------------------------------------------------------
 * Event Listeners and Page-Specific Logic
 * -----------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', () => {
    // Run global functions
    handleHeaderScroll();

    // Page-specific routing
    if (document.body.classList.contains('home-page')) {
        initHomePage();
    } else if (document.body.classList.contains('details-page')) {
        initDetailsPage();
    }
});

/**
 * -----------------------------------------------------------------
 * Global Functions
 * -----------------------------------------------------------------
 */

// Adds a scrolled class to the header for styling
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
 * -----------------------------------------------------------------
 * Homepage Logic
 * -----------------------------------------------------------------
 */

async function initHomePage() {
    console.log("Initializing Homepage");

    try {
        // Fetch all data in parallel for efficiency
        const [trending, popular] = await Promise.all([
            fetchMediaData('trending_movies'),
            fetchMediaData('top_rated_movies') // Using top_rated as per your function capabilities
        ]);

        // Populate the shelves with the fetched data
        populateShelf('trending-shelf', 'Trending This Week', trending.results, 'movie');
        populateShelf('popular-shelf', 'Top Rated Movies', popular.results, 'movie');

    } catch (error) {
        console.error("Failed to initialize home page:", error);
        // Display an error message to the user if needed
        const contentArea = document.getElementById('real-content');
        if (contentArea) {
            contentArea.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">Could not load content. Please try again later.</p>';
        }
    } finally {
        // **THIS IS THE FIX:**
        // Add the 'loaded' class to the body. The CSS will handle hiding the
        // skeleton and showing the real content with the intended animations.
        document.body.classList.add('loaded');
    }
}

// Generic function to fetch data from our Netlify function
async function fetchMediaData(endpoint, params = {}) {
    const url = new URL(API_BASE_URL, window.location.origin);
    url.searchParams.set('endpoint', endpoint);
    for (const key in params) {
        url.searchParams.set(key, params[key]);
    }

    const response = await fetch(url);
    if (!response.ok) {
        const errorInfo = await response.json();
        throw new Error(`API Error for ${endpoint}: ${errorInfo.error || response.statusText}`);
    }
    return response.json();
}

// Function to create and populate a media shelf
function populateShelf(elementId, title, items, defaultType) {
    const shelfElement = document.getElementById(elementId);
    if (!shelfElement || !items || items.length === 0) {
        console.warn(`Shelf "${elementId}" could not be populated. No items found.`);
        return;
    }

    let itemsHtml = items.map(item => createMediaCard(item, defaultType)).join('');

    shelfElement.innerHTML = `
        <div class="container">
            <h2 class="shelf-title">${title}</h2>
            <div class="media-scroller">
                <div class="media-scroller-inner">
                    ${itemsHtml}
                </div>
            </div>
        </div>
    `;
}

// Creates the HTML for a single media card with the correct link
function createMediaCard(item, defaultType) {
    const posterPath = item.poster_path
        ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
        : 'https://via.placeholder.com/200x300?text=No+Image';

    // Use the media_type from the API if it exists (like in 'trending'), otherwise use the default.
    const mediaType = item.media_type || defaultType;

    return `
        <a href="/details.html?id=${item.id}&type=${mediaType}" class="media-card" title="${item.title || item.name}">
            <img src="${posterPath}" alt="${item.title || item.name}" loading="lazy">
        </a>
    `;
}

/**
 * -----------------------------------------------------------------
 * Details Page Logic
 * -----------------------------------------------------------------
 */

async function initDetailsPage() {
    console.log("Initializing Details Page");
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('type');

    if (!mediaId || !mediaType) {
        displayDetailsError("Page not found. Media ID or type is missing.");
        return;
    }

    try {
        const data = await fetchMediaData('details', { type: mediaType, id: mediaId });
        populateDetailsPage(data);
    } catch (error) {
        console.error("Failed to load details:", error);
        displayDetailsError("We couldn't load the details for this item. Please try again.");
    }
}

function populateDetailsPage({ details, logoUrl, credits, recommendations }) {
    // Hide skeleton loader first
    const skeletonLoader = document.getElementById('skeleton-loader');
    if (skeletonLoader) {
        skeletonLoader.style.display = 'none';
    }

    // Set backdrop image
    const backdropContainer = document.getElementById('backdrop-image');
    if (details.backdrop_path) {
        backdropContainer.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${details.backdrop_path})`;
        backdropContainer.style.opacity = '1';
    }

    // Populate main hero content
    const mainContent = document.getElementById('details-main-content');
    const title = details.title || details.name;
    const overview = details.overview;
    const titleElement = logoUrl
        ? `<img src="${logoUrl}" alt="${title}" class="media-logo">`
        : `<h1 class="fallback-title">${title}</h1>`;

    mainContent.innerHTML = `
        <div class="details-content-overlay" style="animation: fadeIn 0.5s ease-in-out;">
            ${titleElement}
            <p class="details-overview">${overview}</p>
            <!-- Meta pills and buttons can be added here -->
        </div>
    `;
    
    // You can expand this to populate the cast and recommendations tabs
    const tabsContent = document.getElementById('details-tabs-content');
    if (tabsContent) {
        // Example: just showing raw data for now
        tabsContent.innerHTML = `
            <h3>Cast</h3>
            <pre>${JSON.stringify(credits.cast.slice(0, 5), null, 2)}</pre>
            <h3>Recommendations</h3>
            <pre>${JSON.stringify(recommendations.results.slice(0, 5), null, 2)}</pre>
        `;
    }
}

function displayDetailsError(message) {
    const mainContent = document.getElementById('details-main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="details-content-overlay">
                <h1 class="fallback-title">Error</h1>
                <p>${message}</p>
            </div>`;
    }
}
