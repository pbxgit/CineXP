// src/components/Carousel.js
import { createMovieCard } from './MovieCard.js';

export function createCarousel(id, title, items) {
    const cardElements = items.map(item => {
        if (item.poster_path) {
            return createMovieCard(item).outerHTML;
        }
        return '';
    }).join('');

    return `
        <section id="${id}" class="carousel-container">
            <h2>${title}</h2>
            <div class="movie-grid">
                ${cardElements}
            </div>
        </section>
    `;
}
