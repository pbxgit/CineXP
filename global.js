// global.js - V17 (Floating UI Logic)

document.addEventListener('DOMContentLoaded', () => {
    const searchContainer = document.getElementById('nav-search');
    const searchInput = document.getElementById('search-input');
    const searchIcon = document.getElementById('search-icon');
    const backButton = document.getElementById('back-button');

    // --- Conditional Back Button ---
    // Show the back button on any page that is not the root homepage
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

    // --- Global Click Listener ---
    document.addEventListener('click', (e) => {
        if (searchContainer && !searchContainer.contains(e.target)) {
            searchContainer.classList.remove('active');
        }
    });
});
