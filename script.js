document.addEventListener('DOMContentLoaded', () => {
    const contentGrid = document.getElementById('content-grid');
    const loadingIndicator = document.getElementById('loading');
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

    /**
     * A unified function to fetch data from our Netlify 'getMedia' function.
     * @param {string} endpoint - The TMDb endpoint to target (e.g., 'trending/all/week').
     * @param {object} [params={}] - Optional query parameters (e.g., { query: 'Inception' }).
     * @returns {Promise<object>} - A promise that resolves to the JSON data from the API.
     */
    async function fetchFromTMDb(endpoint, params = {}) {
        const url = new URL('/.netlify/functions/getMedia', window.location.origin);
        url.searchParams.append('endpoint', endpoint);
        for (const key in params) {
            url.searchParams.append(key, params[key]);
        }

        try {
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('Error fetching from Netlify function:', error);
            loadingIndicator.textContent = 'Failed to load content.';
            // Return a default structure to prevent further errors
            return { results: [] }; 
        }
    }

    /**
     * Fetches and displays the initial trending content.
     */
    async function displayTrendingContent() {
        const data = await fetchFromTMDb('trending/all/week');
        displayContent(data.results);
    }

    /**
     * Renders a list of media items to the content grid.
     * @param {Array} items - An array of movie or TV show objects.
     */
    function displayContent(items) {
        loadingIndicator.style.display = 'none';
        contentGrid.innerHTML = ''; // Clear previous content

        if (!items || items.length === 0) {
            contentGrid.innerHTML = '<p class="error-message">No results found.</p>';
            return;
        }

        items.forEach(item => {
            if (!item.poster_path) return;

            const card = document.createElement('div');
            card.classList.add('poster-card');
            
            const posterUrl = imageBaseUrl + item.poster_path;
            const title = item.title || item.name;

            card.innerHTML = `<img src="${posterUrl}" alt="${title}">`;
            contentGrid.appendChild(card);
        });

        setupIntersectionObserver();
    }

    /**
     * Sets up the Intersection Observer to animate cards on scroll.
     */
    function setupIntersectionObserver() {
        // This function remains the same
        const cards = document.querySelectorAll('.poster-card');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        cards.forEach(card => observer.observe(card));
    }

    // --- Initial Load ---
    displayTrendingContent();
});
