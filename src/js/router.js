// src/js/router.js
console.log("router.js: Module loaded.");

import { renderHomePage, renderSearchPage, renderDetailPage, renderWatchlistPage, updateNavLinks } from './ui.js';

// A map of URL routes to the functions that render them
const routes = {
    '/': renderHomePage,
    '/home': renderHomePage,
    '/search': renderSearchPage,
    '/watchlist': renderWatchlistPage
};

function handleRouting() {
    console.log(`router.js: Handling route for hash: ${window.location.hash}`);
    const hash = window.location.hash || '#/home';
    const [path, type, id] = hash.split('/'); // Example: #/movie/123 -> ["", "movie", "123"]

    // Route to a detail page if the URL matches the pattern
    if (type && id && (type === 'movie' || type === 'tv')) {
        renderDetailPage(type, id);
    } 
    // Otherwise, route to a main page
    else {
        const routeKey = path.replace('#', '');
        const routeHandler = routes[routeKey] || renderHomePage; // Default to home page
        routeHandler();
    }
    updateNavLinks(hash);
}

export function initializeRouter() {
    console.log("router.js: Initializing router listeners.");
    // Listen for hash changes (clicking links) and initial page load
    window.addEventListener('hashchange', handleRouting);
    window.addEventListener('load', handleRouting);
}
