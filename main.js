/**
 * =================================================================
 * Movie Explorer - Main JavaScript File
 * =================================================================
 *
 * Handles:
 * 1.  Homepage Logic: Fetching and displaying shelves of media.
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
    // This is the main function to bootstrap the homepage
    console.log("Initializing Homepage");
    
    // Fetch all data in parallel
    const [trending, popular] = await Promise.all([
        fetchMediaData('trending_movies'),
        fetchMediaData('popular_tv')
    ]);

    // Populate the shelves with the fetched data
    populateShelf('trending-shelf', 'Trending Movies', trending.results);
    populateShelf('popular-shelf', 'Popular TV Shows', popular.results);

    // Hide skeleton loader and show real content
    document.getElementById('content-skeleton').style.display = 'none';
    document.getElementById('real-content').style.opacity = '1';
}

// Generic function to fetch data from our Netlify function
async function fetchMediaData(endpoint, params = {}) {
    const url = new URL(API_BASE_URL, window.location.origin);
    url.searchParams.set('endpoint', endpoint);
    for (const key in params) {
        url.searchParams.set(key, params[key]);
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error(`Failed to fetch ${endpoint}:`, error);
        return { results: [] }; // Return empty data on failure
    }
}

// Function to create and populate a media shelf
function populateShelf(elementId, title, items) {
    const shelfElement = document.getElementById(elementId);
    if (!shelfElement || !items || items.length === 0) return;

    // Determine media type for links. TMDB's trending endpoint includes 'media_type'.
    // For others, we might need to infer it or pass it in.
    const mediaType = items[0].media_type || (elementId.includes('tv') ? 'tv' : 'movie');

    let itemsHtml = items.map(item => createMediaCard(item, mediaType)).join('');

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

// ** THE FIX IS HERE **
// This function now creates a complete anchor tag `<a>` with the correct `href`
function createMediaCard(item, mediaType) {
    const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Image';
    
    // Construct the link to the details page with ID and type as URL parameters.
    // We use item.media_type if available, otherwise we fall back to the type passed to the function.
    const type = item.media_type || mediaType;

    return `
        <a href="/details.html?id=${item.id}&type=${type}" class="media-card">
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
    
    // Get the ID and type from the URL
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('type');

    if (!mediaId || !mediaType) {
        displayDetailsError("Could not find the required media ID or type in the URL.");
        return;
    }

    // Fetch the detailed data
    const data = await fetchMediaData('details', { type: mediaType, id: mediaId });

    if (data.error || !data.details) {
        displayDetailsError("Failed to fetch media details.");
        return;
    }
    
    // We have the data, now populate the page
    populateDetailsPage(data);
}

function populateDetailsPage({ details, logoUrl, credits, recommendations }) {
    // Hide skeleton loader
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

    // Populate main content
    const mainContent = document.getElementById('details-main-content');
    const title = details.title || details.name;
    const overview = details.overview;
    
    // Use logo if available, otherwise show a styled title
    const titleElement = logoUrl 
        ? `<img src="${logoUrl}" alt="${title}" class="media-logo">`
        : `<h1 class="fallback-title">${title}</h1>`;

    mainContent.innerHTML = `
        <div class="details-content-overlay">
            ${titleElement}
            <p class="details-overview">${overview}</p>
            <!-- Add more details like meta pills and buttons here later -->
        </div>
    `;
    
    // (Optional) Populate tabs with cast and recommendations
    // This part can be expanded to create the full tabbed interface
    const tabsContent = document.getElementById('details-tabs-content');
    if (tabsContent) {
        tabsContent.innerHTML = `<p><strong>Cast and Recommendations can be displayed here.</strong></p>`;
    }
}

function displayDetailsError(message) {
    const mainContent = document.getElementById('details-main-content');
    mainContent.innerHTML = `<div class="details-content-overlay"><h1 class="fallback-title">Error</h1><p>${message}</p></div>`;
}
