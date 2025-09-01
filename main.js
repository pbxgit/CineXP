// main.js - Homepage Overhaul

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('is-loaded');
    initializeHomepage();
});

// The 'pageshow' event fires every time the page is displayed, including from the back/forward cache.
window.addEventListener('pageshow', (event) => {
    // If the page is loaded from the cache, its 'fade-out' class might be stuck.
    if (event.persisted) {
        document.body.classList.remove('fade-out');
    }
});

async function initializeHomepage() {
    const contentContainer = document.getElementById('content-container');
    contentContainer.innerHTML = '<div class="loading-spinner"></div>'; // Show a single spinner

    try {
        // Fetch popular movies and TV shows in parallel for efficiency
        const [moviesResponse, showsResponse] = await Promise.all([
            fetch('/api/tmdb?media_type=movie'),
            fetch('/api/tmdb?media_type=tv')
        ]);

        if (!moviesResponse.ok || !showsResponse.ok) {
            throw new Error('Failed to fetch media from the API.');
        }

        const moviesData = await moviesResponse.json();
        const showsData = await showsResponse.json();
        
        contentContainer.innerHTML = ''; // Clear spinner

        // Use the top movie for the hero spotlight
        if (moviesData.results && moviesData.results.length > 0) {
            renderSpotlight(moviesData.results[0]); // Feature the #1 popular movie
            
            // Render the rows
            renderCategoryRow('Popular Movies', moviesData.results, contentContainer, 'movie');
        }

        if (showsData.results && showsData.results.length > 0) {
            renderCategoryRow('Popular TV Shows', showsData.results, contentContainer, 'tv');
        }

    } catch (error) {
        console.error("Initialization Error:", error);
        contentContainer.innerHTML = `<p class="error-message">Could not load the Cineverse.</p>`;
    }
}

function renderSpotlight(media) {
    const spotlightContainer = document.getElementById('hero-spotlight');
    const backdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : '';
    
    spotlightContainer.style.backgroundImage = `url(${backdropUrl})`;

    spotlightContainer.innerHTML = `
        <div class="hero-spotlight-overlay"></div>
        <div class="hero-spotlight-content">
            <h1 class="hero-spotlight-title">${media.title || media.name}</h1>
            <p class="hero-spotlight-overview">${media.overview}</p>
            <a href="/details.html?id=${media.id}&type=movie" class="button-primary">
                More Info
            </a>
        </div>
    `;
    
    // Add fade-out transition logic to the hero button
    const heroButton = spotlightContainer.querySelector('.button-primary');
    heroButton.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = e.currentTarget.href; }, 500);
    });
}

function renderCategoryRow(title, mediaItems, container, mediaType) {
    const categoryRow = document.createElement('section');
    categoryRow.className = 'category-row';

    const mediaRow = document.createElement('div');
    mediaRow.className = 'media-row';
    
    mediaItems.forEach(item => {
        const mediaCard = createMediaCard(item, mediaType);
        mediaRow.appendChild(mediaCard);
    });

    categoryRow.innerHTML = `<h2 class="category-title">${title}</h2>`;
    categoryRow.appendChild(mediaRow);
    container.appendChild(categoryRow);
    
    // Animate cards into view
    const cards = mediaRow.querySelectorAll('.movie-card');
    cards.forEach((card, index) => {
        setTimeout(() => { card.classList.add('is-visible'); }, index * 80);
    });
}

function createMediaCard(item, mediaType) {
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = `/details.html?id=${item.id}&type=${mediaType}`;

    const title = item.title || item.name;
    const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '/path/to/placeholder.png'; // Fallback path recommended

    card.innerHTML = `
        <div class="card-poster">
            <img src="${posterUrl}" alt="${title}" loading="lazy">
        </div>
        <div class="card-body">
            <h3 class="card-title">${title}</h3>
            <div class="card-rating">
                <span>⭐ ${item.vote_average.toFixed(1)}</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = e.currentTarget.href; }, 500);
    });

    return card;
}
