document.addEventListener('DOMContentLoaded', async () => {
    const carouselsContainer = document.getElementById('content-carousels');

    // --- 1. Fetch all required media in parallel for faster loading ---
    const [trendingMovies, popularTvShows, topRatedMovies] = await Promise.all([
        fetchMedia('movie', 'trending'),
        fetchMedia('tv', 'popular'),
        fetchMedia('movie', 'top_rated')
    ]);

    // --- 2. Populate the Hero Section ---
    // Let's use the top trending movie for the hero
    if (trendingMovies && trendingMovies.length > 0) {
        populateHero(trendingMovies[0]);
    }

    // --- 3. Create and append carousels ---
    if (trendingMovies && trendingMovies.length > 0) {
        carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
    }
    if (popularTvShows && popularTvShows.length > 0) {
        carouselsContainer.appendChild(createCarousel('Popular TV Shows', popularTvShows));
    }
    if (topRatedMovies && topRatedMovies.length > 0) {
        carouselsContainer.appendChild(createCarousel('Top Rated Movies', topRatedMovies));
    }

    // --- 4. Initialize scroll animations ---
    setupScrollAnimations();
});

function populateHero(mediaItem) {
    const heroSection = document.getElementById('hero-section');
    const heroBackground = heroSection.querySelector('.hero-background');
    const heroTitle = heroSection.querySelector('.hero-title');
    const heroDescription = heroSection.querySelector('.hero-description');

    if (mediaItem.backdrop_path) {
        heroBackground.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${mediaItem.backdrop_path})`;
    }
    
    // TMDb uses 'title' for movies and 'name' for TV shows. This handles both.
    heroTitle.textContent = mediaItem.title || mediaItem.name;
    heroDescription.textContent = mediaItem.overview;
}

function createCarousel(title, mediaItems) {
    const section = document.createElement('section');
    section.className = 'carousel-section';

    const h2 = document.createElement('h2');
    h2.textContent = title;
    section.appendChild(h2);

    const carouselDiv = document.createElement('div');
    carouselDiv.className = 'movie-carousel';

    mediaItems.forEach(item => {
        if (!item.poster_path) return;

        const posterLink = document.createElement('a');
        posterLink.className = 'movie-poster';
        // You can set a link to a details page here in the future
        // posterLink.href = `/details.html?type=${item.media_type}&id=${item.id}`;

        const img = document.createElement('img');
        img.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
        img.alt = item.title || item.name; // Handles both movies and TV shows
        img.loading = 'lazy';

        posterLink.appendChild(img);
        carouselDiv.appendChild(posterLink);
    });

    section.appendChild(carouselDiv);
    return section;
}

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // This needs to run after carousels are potentially added to the DOM
    setTimeout(() => {
        document.querySelectorAll('.carousel-section').forEach(section => {
            observer.observe(section);
        });
    }, 100);
}
