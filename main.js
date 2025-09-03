/**
 * =================================================================
 * Movie Explorer - Main JavaScript File (Restored & Focused)
 * =================================================================
 *
 * This script has been restored to focus ONLY on the core requirement:
 * 1.  It loads content into the main shelves on the homepage.
 * 2.  It creates the correct links from each item to the details page.
 * 3.  It loads the correct data on the details page based on the link clicked.
 *
 * NOTE: This script intentionally does NOT populate the "Hero Section" at the
 * top of the homepage. That section will appear as a large blank area.
 * You can simply scroll past it to see the working shelves of content below.
 * This approach guarantees that the main content area loads correctly.
 *
 */

// The backend API endpoint provided by your Netlify function
const API_BASE_URL = '/.netlify/functions/get-media';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

/**
 * -----------------------------------------------------------------
 * Main Initializer
 * This function runs as soon as the HTML page is ready.
 * -----------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', () => {
    // This is a simple router that runs the correct code for the current page.
    if (document.body.classList.contains('home-page')) {
        initHomePage();
    } else if (document.body.classList.contains('details-page')) {
        initDetailsPage();
    }
});

/**
 * -----------------------------------------------------------------
 * Homepage Logic
 * -----------------------------------------------------------------
 */
async function initHomePage() {
    console.log("Homepage: Initializing.");

    try {
        // Fetch data for both shelves at the same time to be faster.
        const [trending, popular] = await Promise.all([
            fetchAPIData('trending_movies'),
            fetchAPIData('popular_tv')
        ]);
        console.log("Homepage: Successfully fetched data.", { trending, popular });

        // Use the fetched data to build the HTML for the shelves.
        // This targets the #trending-shelf and #popular-shelf elements in your index.html
        populateShelf('trending-shelf', 'Trending Movies', trending.results, 'movie');
        populateShelf('popular-shelf', 'Popular TV Shows', popular.results, 'tv');

    } catch (error) {
        console.error("Homepage: A critical error occurred.", error);
        // If there's an error, show a message to the user inside the main content area.
        const contentArea = document.getElementById('real-content');
        if (contentArea) {
            contentArea.innerHTML = `<div class="container"><p>Sorry, we couldn't load content right now. Please try again later.</p></div>`;
        }
    } finally {
        // This part ALWAYS runs, even if there was an error.
        // It adds the 'loaded' class to the body. Your style.css file uses
        // this class to hide the skeleton loader and fade in the real content.
        document.body.classList.add('loaded');
        console.log("Homepage: 'loaded' class added to body. Content should now be visible.");
    }
}

/**
 * Creates the HTML for a single content shelf and adds it to the page.
 */
function populateShelf(elementId, title, items, defaultType) {
    const shelfElement = document.getElementById(elementId);
    if (!shelfElement) {
        console.error(`Homepage: Shelf element with ID #${elementId} was not found.`);
        return;
    }

    // Create a long string of HTML containing all the media cards.
    const itemsHtml = items.map(item => {
        const posterPath = item.poster_path
            ? `${TMDB_IMAGE_BASE_URL}w342${item.poster_path}`
            : 'https://via.placeholder.com/342x513?text=No+Image';

        // Determine the media type. The 'trending' endpoint provides it, others may not.
        const mediaType = item.media_type || defaultType;
        const itemTitle = item.title || item.name;

        // ** THIS IS THE CORE FIX **
        // Each item is an anchor tag `<a>` that links to the details page.
        // The link correctly includes the item's id and type in the URL.
        return `
            <a href="/details.html?id=${item.id}&type=${mediaType}" class="media-card" title="${itemTitle}">
                <img src="${posterPath}" alt="${itemTitle}" loading="lazy">
            </a>
        `;
    }).join('');

    // Put the final HTML for the complete shelf into the page.
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

/**
 * -----------------------------------------------------------------
 * Details Page Logic
 * -----------------------------------------------------------------
 */
async function initDetailsPage() {
    console.log("Details Page: Initializing.");

    // Read the 'id' and 'type' from the browser's URL bar.
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('type');

    // If the id or type are missing, we can't load anything.
    if (!mediaId || !mediaType) {
        displayDetailsError("Could not load this item because the ID or media type is missing from the URL.");
        return;
    }

    try {
        // Fetch the specific details for this one item from our backend function.
        const data = await fetchAPIData('details', { type: mediaType, id: mediaId });
        console.log("Details Page: Successfully fetched data.", data);

        // Use the fetched data to build the details page.
        populateDetailsPage(data);

    } catch (error) {
        console.error("Details Page: A critical error occurred.", error);
        displayDetailsError("Sorry, we couldn't load the details for this item right now.");
    }
}

/**
 * Fills the details page with the content fetched from the API.
 */
function populateDetailsPage({ details, logoUrl }) {
    // Hide the skeleton loader now that we have the real data.
    document.getElementById('skeleton-loader').style.display = 'none';

    // Set the large background image.
    const backdropImage = document.getElementById('backdrop-image');
    if (details.backdrop_path) {
        backdropImage.style.backgroundImage = `url(${TMDB_IMAGE_BASE_URL}original${details.backdrop_path})`;
        backdropImage.style.opacity = '1';
    }

    // Populate the main content area with the title and overview.
    const mainContent = document.getElementById('details-main-content');
    const title = details.title || details.name;
    const overview = details.overview;

    // Use the fancy logo image if it exists, otherwise just use a plain text title.
    const titleElement = logoUrl
        ? `<img src="${logoUrl}" alt="${title}" class="media-logo">`
        : `<h1 class="fallback-title">${title}</h1>`;

    // Inject the final HTML into the main content area.
    mainContent.innerHTML = `
        <div class="details-content-overlay">
            ${titleElement}
            <p class="details-overview">${overview}</p>
        </div>
    `;
}

/**
 * Shows an error message on the details page if something goes wrong.
 */
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

/**
 * -----------------------------------------------------------------
 * Reusable API Fetching Function
 * -----------------------------------------------------------------
 */
async function fetchAPIData(endpoint, params = {}) {
    const url = new URL(API_BASE_URL, window.location.origin);
    url.searchParams.set('endpoint', endpoint);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

    console.log(`Fetching data from: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    return response.json();
}
