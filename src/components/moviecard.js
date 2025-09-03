// src/components/MovieCard.js
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export function createMovieCard(media) {
    const card = document.createElement('div');
    card.className = 'movie-card';

    // Store essential data on the element for easy access
    card.dataset.id = media.id;
    card.dataset.type = media.media_type || (media.title ? 'movie' : 'tv'); // Infer type if not present
    card.dataset.backdrop = media.backdrop_path;

    const title = media.title || media.name;
    const rating = media.vote_average.toFixed(1);

    card.innerHTML = `
        <img src="${IMAGE_BASE_URL}${media.poster_path}" alt="${title}" loading="lazy">
        <div class="movie-info">
            <h3>${title}</h3>
            <span class="rating">${rating}</span>
        </div>
    `;
    return card;
}
