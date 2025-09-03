// src/components/MovieCard.js

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export function MovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
        <img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}" loading="lazy">
        <div class="movie-info">
            <h3>${movie.title}</h3>
            <span>${movie.vote_average.toFixed(1)}</span>
        </div>
    `;
    return card;
}
