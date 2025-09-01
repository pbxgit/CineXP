// This event listener waits for the HTML document to be fully loaded before running any script.
document.addEventListener('DOMContentLoaded', () => {
    // We check the URL path to determine which page is currently loaded.
    const path = window.location.pathname;

    if (path === '/' || path.endsWith('index.html')) {
        // If it's the homepage, fetch and display popular movies.
        fetchAndDisplayPopularMovies();
    } else if (path.endsWith('details.html')) {
        // If it's the details page, fetch and display the specific movie's details.
        fetchAndDisplayMovieDetails();
    } else if (path.endsWith('watchlist.html')) {
        // If it's the watchlist page, fetch and display the user's saved movies.
        fetchAndDisplayWatchlist();
    }
});

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/**
 * Creates an HTML card element for a single movie.
 * @param {object} movie - The movie object from the TMDB API.
 * @returns {HTMLElement} - The article element representing the movie card.
 */
function createMovieCard(movie) {
    const card = document.createElement('article');
    card.className = 'movie-card';
    
    // Store the movie ID in the element for later use.
    card.dataset.movieId = movie.id;

    const posterPath = movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    
    card.innerHTML = `<img src="${posterPath}" alt="${movie.title}">`;
    
    // Add an event listener to navigate to the details page on click.
    card.addEventListener('click', () => {
        window.location.href = `/details.html?id=${movie.id}`;
    });

    return card;
}

// --- HOMEPAGE LOGIC ---
async function fetchAndDisplayPopularMovies() {
    const movieGrid = document.getElementById('movie-grid');
    try {
        // Call our own Netlify function to get the movies.
        const response = await fetch('/.netlify/functions/get-movies');
        const data = await response.json();
        
        movieGrid.innerHTML = ''; // Clear the "loading" text.
        movieGrid.removeAttribute('aria-busy');

        // Create a card for each movie and add it to the grid.
        data.results.forEach(movie => {
            const movieCard = createMovieCard(movie);
            movieGrid.appendChild(movieCard);
        });
    } catch (error) {
        movieGrid.innerHTML = '<p>Sorry, we could not load movies at this time.</p>';
        console.error('Error fetching popular movies:', error);
    }
}

// --- DETAILS PAGE LOGIC ---
async function fetchAndDisplayMovieDetails() {
    const contentArea = document.getElementById('movie-details-content');
    const aiSummaryBtn = document.getElementById('ai-summary-btn');

    // Get the movie ID from the URL (e.g., "?id=123").
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (!movieId) {
        contentArea.innerHTML = '<p>No movie ID provided. Please go back to the homepage.</p>';
        return;
    }

    try {
        // Fetch details for this specific movie ID.
        const response = await fetch(`/.netlify/functions/get-movies?id=${movieId}`);
        const movie = await response.json();

        const posterPath = movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
        
        // Populate the content area with the movie details.
        contentArea.innerHTML = `
            <article>
                <div class="grid">
                    <div>
                        <img src="${posterPath}" alt="${movie.title}">
                    </div>
                    <div>
                        <h2>${movie.title}</h2>
                        <p>${movie.overview}</p>
                        <p><strong>Release Date:</strong> ${movie.release_date}</p>
                        <p><strong>Rating:</strong> ${movie.vote_average.toFixed(1)} / 10</p>
                        <button id="watchlist-btn" data-movie-id="${movie.id}">Add to Watchlist</button>
                    </div>
                </div>
            </article>
        `;
        contentArea.removeAttribute('aria-busy');

        // Set up the AI summary button.
        aiSummaryBtn.onclick = () => fetchAiSummary(movie.title);
        
        // Set up the watchlist button.
        document.getElementById('watchlist-btn').onclick = () => addToWatchlist(movie);

    } catch (error) {
        contentArea.innerHTML = '<p>Failed to load movie details.</p>';
        console.error('Error fetching movie details:', error);
    }
}

async function fetchAiSummary(movieTitle) {
    const summaryContainer = document.getElementById('ai-summary-text-container');
    const summaryText = document.getElementById('ai-summary-text');
    const summaryBtn = document.getElementById('ai-summary-btn');

    summaryBtn.setAttribute('aria-busy', 'true');
    summaryBtn.textContent = 'Generating...';

    try {
        const response = await fetch('/.netlify/functions/get-ai-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movieTitle })
        });
        const data = await response.json();
        
        summaryText.textContent = data.summary;
        summaryContainer.style.display = 'block'; // Show the container.

    } catch (error) {
        summaryText.textContent = 'Could not generate an AI summary at this time.';
        console.error('Error fetching AI summary:', error);
    } finally {
        summaryBtn.setAttribute('aria-busy', 'false');
        summaryBtn.style.display = 'none'; // Hide button after use.
    }
}


// --- WATCHLIST LOGIC ---
async function fetchAndDisplayWatchlist() {
    const watchlistGrid = document.getElementById('watchlist-grid');
    watchlistGrid.setAttribute('aria-busy', 'true');

    try {
        const response = await fetch('/.netlify/functions/update-watchlist', { method: 'GET' });
        const watchlistData = await response.json();
        
        watchlistGrid.innerHTML = '';
        watchlistGrid.removeAttribute('aria-busy');

        if (watchlistData.length === 0) {
            watchlistGrid.innerHTML = '<p>Your watchlist is empty. Add movies from their details page!</p>';
            return;
        }

        // The data is stored as strings, so we need to parse it back into objects.
        const watchlistMovies = watchlistData.map(item => JSON.parse(item));

        watchlistMovies.forEach(movie => {
            const movieCard = createMovieCard(movie);
            watchlistGrid.appendChild(movieCard);
        });

    } catch (error) {
        watchlistGrid.innerHTML = '<p>Could not load your watchlist.</p>';
        console.error('Error fetching watchlist:', error);
    }
}

async function addToWatchlist(movie) {
    const button = document.getElementById('watchlist-btn');
    button.setAttribute('aria-busy', 'true');
    button.disabled = true;

    // We only need to store essential data.
    const movieData = {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
    };
    
    try {
        await fetch('/.netlify/functions/update-watchlist', {
            method: 'POST',
            body: JSON.stringify(movieData),
        });
        button.textContent = 'Added!';
    } catch (error) {
        button.textContent = 'Failed to Add';
        console.error('Error adding to watchlist:', error);
    } finally {
        button.removeAttribute('aria-busy');
    }
}
