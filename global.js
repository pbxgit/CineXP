// global.js - V18 (Navigation & Jank Fixes)

document.addEventListener('DOMContentLoaded', () => {
    const searchContainer = document.getElementById('nav-search');
    const searchInput = document.getElementById('search-input');
    const searchIcon = document.getElementById('search-icon');
    const backButton = document.getElementById('back-button');

    // --- Conditional Back Button ---
    if (backButton && window.location.pathname !== '/') {
        backButton.style.display = 'flex';
    }

    // --- Search Bar Logic ---
    if (searchIcon) {
        searchIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = searchContainer.classList.contains('active');
            const hasValue = searchInput.value.trim() !== '';

            if (isActive && hasValue) {
                window.location.href = `/search.html?query=${encodeURIComponent(searchInput.value.trim())}`;
            } else {
                searchContainer.classList.toggle('active');
                if (!isActive) searchInput.focus();
            }
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                window.location.href = `/search.html?query=${encodeURIComponent(searchInput.value.trim())}`;
            }
        });
    }

    // --- Global Click Listener to close search ---
    document.addEventListener('click', (e) => {
        if (searchContainer && !searchContainer.contains(e.target)) {
            searchContainer.classList.remove('active');
        }
    });
});

// --- CRITICAL FIX for Blank Page on Back Navigation ---
// This listens for the page being shown, including from the Back-Forward Cache (bfcache).
window.addEventListener('pageshow', (event) => {
    // If event.persisted is true, the page was loaded from the cache.
    // We must remove the fade-out class to ensure it's visible.
    if (event.persisted) {
        document.body.classList.remove('fade-out');
    }
});
