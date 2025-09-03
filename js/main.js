// --- Global variables for the Hero Slider ---
let heroSlides = [];      // Array to hold the top 5 media items for the slider
let currentHeroIndex = 0; // Tracks the current active slide
let heroInterval;         // Variable to hold the timer for auto-rotation

// --- Main execution block that runs after the page is loaded ---
document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. Fetch all required media in parallel for faster loading ---
    // We fetch trending movies for the hero and other categories for the carousels
    const [trendingMovies, popularTvShows, topRatedMovies] = await Promise.all([
        fetchMedia('movie', 'trending'),
        fetchMedia('tv', 'popular'),
        fetchMedia('movie', 'top_rated')
    ]);

    // --- 2. Initialize and start the Hero Section Slider ---
    if (trendingMovies && trendingMovies.length > 0) {
        // Take the top 5 trending items for our hero showcase
        heroSlides = trendingMovies.slice(0, 5);
        startHeroSlider();
    }

    // --- 3. Create and append content carousels ---
    const carouselsContainer = document.getElementById('content-carousels');

    if (trendingMovies && trendingMovies.length > 0) {
        carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
    }
    if (popularTvShows && popularTvShows.length > 0) {
        carouselsContainer.appendChild(createCarousel('Popular TV Shows', popularTvShows));
    }
    if (topRatedMovies && topRatedMovies.length > 0) {
        carouselsContainer.appendChild(createCarousel('Top Rated Movies', topRatedMovies));
    }

    // --- 4. Initialize scroll animations for the carousels ---
    setupScrollAnimations();
});

// --- Function to handle the header's background effect on scroll ---
window.addEventListener('scroll', () => {
    const header = document.querySelector('.main-header');
    // Add 'scrolled' class if user scrolls more than 50px, otherwise remove it
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});


/**
 * Updates the hero section to display a new slide's content with animations.
 * @param {number} index - The index of the slide to display from the heroSlides array.
 */
async function updateHeroSlide(index) {
    const slideData = heroSlides[index];
    const heroSection = document.getElementById('hero-section');
    const heroBackground = heroSection.querySelector('.hero-background');
    const heroLogoImg = heroSection.querySelector('.hero-logo');
    const heroDescription = heroSection.querySelector('.hero-description');

    // Trigger the fade-out animation by removing the 'active' class
    heroSection.classList.remove('active');

    // Fetch the high-quality logo for this specific media item
    // It looks for a 'movie' type first, as TMDB's trending can mix types
    const mediaType = slideData.media_type || 'movie';
    const logoData = await fetchMediaImages(mediaType, slideData.id);

    // Wait for the fade-out transition to complete (matches CSS transition duration)
    setTimeout(() => {
        // --- Update the content ---
        heroBackground.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${slideData.backdrop_path})`;
        heroDescription.textContent = slideData.overview;

        // Check if a logo was successfully fetched
        if (logoData && logoData.file_path) {
            heroLogoImg.src = `https://image.tmdb.org/t/p/w500${logoData.file_path}`;
            heroLogoImg.style.display = 'block'; // Ensure the image is visible
        } else {
            heroLogoImg.style.display = 'none'; // Hide the logo element if none is found
        }

        // Trigger the fade-in animation for the new content
        heroSection.classList.add('active');
    }, 500); // 0.5 second delay
}

/**
 * Initializes the hero slider and sets it to auto-rotate.
 */
function startHeroSlider() {
    // Stop any existing timer to prevent multiple intervals running
    clearInterval(heroInterval);

    // Display the first slide immediately without animation delay
    updateHeroSlide(0);

    // Set a timer to automatically advance to the next slide
    heroInterval = setInterval(() => {
        currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length; // Loop back to 0
        updateHeroSlide(currentHeroIndex);
    }, 8000); // 8 seconds per slide
}

/**
 * Creates a complete carousel section with a title and posters.
 * @param {string} title - The title of the carousel (e.g., "Trending Movies").
 * @param {Array} mediaItems - An array of movie or TV show objects.
 * @returns {HTMLElement} The fully constructed section element.
 */
function createCarousel(title, mediaItems) {
    const section = document.createElement('section');
    section.className = 'carousel-section';

    const h2 = document.createElement('h2');
    h2.textContent = title;
    section.appendChild(h2);

    const carouselDiv = document.createElement('div');
    carouselDiv.className = 'movie-carousel';

    mediaItems.forEach(item => {
        if (!item.poster_path) return; // Skip items without a poster

        const posterLink = document.createElement('a');
        posterLink.className = 'movie-poster';
        // Future-proofing: This link can go to a details page
        // posterLink.href = `/details.html?type=${item.media_type || 'movie'}&id=${item.id}`;

        const img = document.createElement('img');
        img.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
        img.alt = item.title || item.name; // Handles both movie titles and TV show names
        img.loading = 'lazy'; // Improves performance by loading images as they are scrolled into view

        posterLink.appendChild(img);
        carouselDiv.appendChild(posterLink);
    });

    section.appendChild(carouselDiv);
    return section;
}

/**
 * Sets up the Intersection Observer to animate carousels in as they become visible.
 */
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Stop observing once it's visible
            }
        });
    }, { threshold: 0.1 }); // Trigger when 10% of the element is visible

    // We need to find all sections and start observing them.
    // A small delay ensures all carousels have been added to the DOM.
    setTimeout(() => {
        document.querySelectorAll('.carousel-section').forEach(section => {
            observer.observe(section);
        });
    }, 100);
}
