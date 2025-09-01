// global.js - V16 (Stable & Self-Contained)

document.addEventListener('DOMContentLoaded', () => {
    const searchContainer = document.getElementById('nav-search');
    const searchInput = document.getElementById('search-input');
    const searchIcon = document.getElementById('search-icon');

    if (!searchContainer || !searchInput || !searchIcon) {
        console.error('Search UI elements not found in the DOM.');
        return;
    }

    // --- Search Bar Logic ---
    searchIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents the document click listener from closing it immediately
        
        const isActive = searchContainer.classList.contains('active');
        const hasValue = searchInput.value.trim() !== '';

        if (isActive && hasValue) {
            window.location.href = `/search.html?query=${encodeURIComponent(searchInput.value.trim())}`;
        } else {
            searchContainer.classList.toggle('active');
            if (!isActive) {
                searchInput.focus();
            }
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
            window.location.href = `/search.html?query=${encodeURIComponent(searchInput.value.trim())}`;
        }
    });
    
    // --- Global Click Listener ---
    // Closes the search bar if a click occurs outside of it
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            searchContainer.classList.remove('active');
        }
    });
});
