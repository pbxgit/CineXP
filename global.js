// global.js - Logic for the persistent header and search functionality

function initializeGlobalNav() {
    const searchIcon = document.getElementById('search-icon');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');
    const closeSearch = document.getElementById('close-search');

    if (searchIcon) {
        searchIcon.addEventListener('click', () => {
            searchContainer.classList.add('active');
            searchInput.focus();
        });
    }

    if (closeSearch) {
        closeSearch.addEventListener('click', () => {
            searchContainer.classList.remove('active');
            searchInput.value = '';
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                window.location.href = `/search.html?query=${encodeURIComponent(searchInput.value.trim())}`;
            }
        });
    }
}
