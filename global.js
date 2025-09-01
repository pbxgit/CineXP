// global.js - V5 (Simplified & Standalone)

document.addEventListener('DOMContentLoaded', () => {
    const searchContainer = document.getElementById('nav-search');
    const searchInput = document.getElementById('search-input');
    const searchIcon = document.getElementById('search-icon');
    const header = document.querySelector('.global-nav');

    // Header scroll effect
    if (header && header.classList.contains('floating')) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('solid', window.scrollY > 50);
        }, { passive: true });
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
    
    // Close search when clicking outside
    document.addEventListener('click', (e) => {
        if (searchContainer && !searchContainer.contains(e.target)) {
            searchContainer.classList.remove('active');
        }
    });
});
