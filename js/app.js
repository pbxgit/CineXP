// =====================================================
// Personal Cinema - app.js
// =====================================================

// Use a self-invoking function to create a private scope.
(function () {
    'use strict';

    // --- 1. GLOBAL STATE & CONFIGURATION ---
    const state = {
        // Example: currentUser: null, watchlist: new Set()
    };
    
    const config = {
        apiBaseUrl: '/.netlify/functions',
        imageBaseUrl: 'https://image.tmdb.org/t/p/',
    };

    // --- 2. UTILITY FUNCTIONS ---
    // (e.g., apiRequest, getImageUrl, etc.)

    // --- 3. UI COMPONENT BUILDERS ---
    // (e.g., createMediaCard, createShelf, etc.)
    
    // --- 4. PAGE-SPECIFIC INITIALIZATION ---
    
    function initHomePage() {
        console.log("Initializing Home Page...");
        // Logic to fetch hero content and shelves will go here.
    }

    function initDetailsPage() {
        console.log("Initializing Details Page...");
        // Logic to fetch details, set backdrop, handle tabs, etc.
    }

    function initWatchlistPage() {
        console.log("Initializing Watchlist Page...");
        // Logic to fetch and display the user's watchlist.
    }
    
    // --- 5. GLOBAL INITIALIZATION & ROUTER ---

    /**
     * A simple router that executes the correct initialization
     * function based on the body's class name.
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
    
    // --- 6. SCRIPT EXECUTION ---

    // Wait for the DOM to be fully loaded before running the app.
    document.addEventListener('DOMContentLoaded', router);

})();
