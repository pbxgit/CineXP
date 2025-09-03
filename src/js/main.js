// src/js/main.js
console.log("main.js: Script execution started.");

import { initializeRouter } from './router.js';
import { renderHeader, renderFooter, updateBackdrop } from './ui.js';

const appRoot = document.getElementById('app-root');

function setupGlobalListeners() {
    console.log("main.js: Setting up global listeners.");
    // Event delegation for clicks (more efficient)
    document.body.addEventListener('click', (e) => {
        // Handle movie card clicks to navigate to detail page
        const card = e.target.closest('.movie-card');
        if (card) {
            const { type, id } = card.dataset;
            if (type && id) {
                window.location.hash = `/${type}/${id}`;
            }
        }
    });

    // Event delegation for hover effects
    appRoot.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.movie-card');
        if (card) {
            updateBackdrop(card.dataset.backdrop);
        }
    });
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/src/sw.js')
                .then(reg => console.log('main.js: Service Worker Registered'))
                .catch(err => console.error(`main.js: Service Worker Registration Error: ${err}`));
        });
    }
}

// --- Main App Initialization Function ---
function init() {
    console.log("main.js: Initializing application.");
    renderHeader();
    renderFooter();
    initializeRouter();
    setupGlobalListeners();
    registerServiceWorker();
    console.log("main.js: Initialization complete.");
}

// Start the application
init();
