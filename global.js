// global.js - V1 (Renewed & Stable)

document.addEventListener('DOMContentLoaded', () => {
    // Fetch and inject the header on every page load for consistency.
    fetch('/_partials/_header.html')
        .then(res => {
            if (!res.ok) throw new Error('Could not load header component.');
            return res.text();
        })
        .then(headerHtml => {
            document.getElementById('global-header').innerHTML = headerHtml;
            // Once the header is guaranteed to be in the DOM, initialize its scripts.
            initializeHeader();
        })
        .catch(error => console.error("Header load error:", error));
});

function initializeHeader() {
    const searchContainer = document.getElementById('nav-search');
    const searchInput = document.getElementById('search-input');
    const searchIcon = document.getElementById('search-icon');
    const backButton = document.getElementById('back-button');
    const header = document.querySelector('.global-nav');

    // --- Conditional Back Button ---
    // Show the back button on any page that is not the root homepage.
    if (backButton && window.location.pathname !== '/') {
        backButton.style.display = 'flex';
    }

    // --- Header Scroll Effect for Homepage ---
    if (document.body.classList.contains('home')) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('solid', window.scrollY > 50);
        }, { passive: true });
    }

    // --- Smooth, Jank-Free Search Bar Logic ---
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
