// global.js - V4 (Header Scroll Effect)

function initializeGlobalNav() {
    const searchContainer = document.getElementById('nav-search');
    const searchInput = document.getElementById('search-input');
    const searchIcon = document.getElementById('search-icon');
    const header = document.querySelector('.global-nav');

    // --- NEW: HEADER SCROLL EFFECT ---
    if (header && header.classList.contains('floating')) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('solid');
            } else {
                header.classList.remove('solid');
            }
        }, { passive: true });
    }

    if (searchIcon) {
        searchIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the document click listener from firing
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
    
    // Close search if user clicks outside
    document.addEventListener('click', (e) => {
        if (searchContainer && !searchContainer.contains(e.target)) {
            searchContainer.classList.remove('active');
        }
    });
}
