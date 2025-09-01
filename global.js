// global.js - V1 (Renewed & Stable)

document.addEventListener('DOMContentLoaded', () => {
    // Fetch and inject the header on every page load.
    fetch('/_partials/_header.html')
        .then(res => {
            if (!res.ok) throw new Error('Could not load header component.');
            return res.text();
        })
        .then(headerHtml => {
            document.getElementById('global-header').innerHTML = headerHtml;
            // Once the header is loaded, initialize its interactive elements.
            initializeHeader();
        })
        .catch(error => console.error("Header load error:", error));
});

function initializeHeader() {
    const searchContainer = document.getElementById('nav-search');
    const searchInput = document.getElementById('search-input');
    const searchIcon = document.getElementById('search-icon');
    const backButton = document.getElementById('back-button');

    // --- Conditional Back Button ---
    // Show the back button on any page that is not the root homepage.
    if (backButton && window.location.pathname !== '/') {
        backButton.style.display = 'flex';
    }

    // --- Smooth Search Bar Logic ---
    if (searchIcon) {
        searchIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = searchContainer.classList.contains('active');
            const hasValue = searchInput.value.trim() !== '';

            if (isActive && hasValue) {
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

    // Close search when clicking anywhere else on the page.
    document.addEventListener('click', (e) => {
        if (searchContainer && !searchContainer.contains(e.target)) {
            searchContainer.classList.remove('active');
        }
    });
}

// --- Critical Fix for Blank Pages on Back Navigation ---
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.body.classList.remove('fade-out');
    }
});
