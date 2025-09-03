// src/js/main.js
import { initializeRouter } from './router.js';
import { renderHeader, renderFooter, updateBackdrop } from './ui.js';

const appRoot = document.getElementById('app-root');

// Global event delegation for clicks and hovers
document.addEventListener('click', (e) => {
    // Handle movie card clicks to navigate
    const card = e.target.closest('.movie-card');
    if (card) {
        const { type, id } = card.dataset;
        window.location.hash = `/${type}/${id}`;
    }
});

appRoot.addEventListener('mouseover', (e) => {
    // Update backdrop on movie card hover
    const card = e.target.closest('.movie-card');
    if (card) {
        updateBackdrop(card.dataset.backdrop);
    }
});

// PWA Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/src/sw.js')
                .then(reg => console.log('Service Worker: Registered'))
                .catch(err => console.error(`Service Worker: Error: ${err}`));
        });
    }
}

// App Initialization
function init() {
    renderHeader();
    renderFooter();
    initializeRouter();
    registerServiceWorker();
}

// Start the application
init();
