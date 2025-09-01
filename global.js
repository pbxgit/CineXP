// global.js - V6 (Conditional Back Button & Final Polish)

document.addEventListener('DOMContentLoaded', () => {
    const searchContainer = document.getElementById('nav-search');
    const searchInput = document.getElementById('search-input');
    const searchIcon = document.getElementById('search-icon');
    const header = document.querySelector('.global-nav');

    // --- NEW: CONDITIONAL BACK BUTTON ---
    // Show back button on any page that isn't the homepage
    const backButton = document.getElementById('back-button');
    if (backButton && window.location.pathname !== '/') {
        backButton.style.display = 'flex';
    }

    // Search toggle and execution
    if (searchIcon) {
        searchIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (searchContainer.classList.contains('active') && searchInput.value.trim() !== '') {
                window.location.href = `/search.html?query=${encodeURIComponent(searchInput.value.trim())}`;
            } else {
                searchContainer.classList.toggle('active');
                if (searchContainer.classList.contains('active')) {
                    searchInput.focus();
                }
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
    
    document.addEventListener('click', (e) => {
        if (searchContainer && !searchContainer.contains(e.target)) {
            searchContainer.classList.remove('active');
        }
    });
});
