// global.js - V3 with Inline Search Logic

function initializeGlobalNav() {
    const searchContainer = document.getElementById('nav-search');
    const searchInput = document.getElementById('search-input');
    const searchIcon = document.getElementById('search-icon');

    if (searchIcon) {
        searchIcon.addEventListener('click', () => {
            // If search is already active, and input has value, perform search
            if (searchContainer.classList.contains('active') && searchInput.value.trim() !== '') {
                window.location.href = `/search.html?query=${encodeURIComponent(searchInput.value.trim())}`;
            } else {
                // Otherwise, just toggle the search bar
                searchContainer.classList.toggle('active');
                searchInput.focus();
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                window.location.href = `/search.html?query=${encodeURIComponent(searchInput.value.trim())}`;
            }
        });

        // Optional: Close search if user clicks outside of it
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                searchContainer.classList.remove('active');
            }
        });
    }
}
