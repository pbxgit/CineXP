// src/app.js (expanded)
import { getTrendingMovies } from './services/api.js';
import { MovieCard } from './components/MovieCard.js';

// Register Service Worker (from before)
if ('serviceWorker' in navigator) { /* ... */ }

// Simple router logic
const app = document.getElementById('app-root');

function renderHomePage() {
    app.innerHTML = `
        <section class="carousel-container">
            <h2>Trending This Week</h2>
            <div class="movie-grid" id="trending-grid"></div>
        </section>
    `;

    const trendingGrid = document.getElementById('trending-grid');

    getTrendingMovies().then(data => {
        if (data && data.results) {
            data.results.forEach(movie => {
                const card = MovieCard(movie);
                trendingGrid.appendChild(card);
            });
        }
    });
}

// Initial page load
renderHomePage();
