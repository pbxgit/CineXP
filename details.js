// details.js - Phase 4

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('is-loaded'); // For page transition

    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('type');

    if (mediaId && mediaType) {
        fetchMediaDetails(mediaId, mediaType);
    } else {
        const container = document.getElementById('detail-container');
        container.innerHTML = `<p class="error-message">Missing media information.</p>`;
    }

    const backButton = document.querySelector('.back-button');
    backButton.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = e.currentTarget.href; }, 500);
    });
});

async function fetchMediaDetails(id, type) {
    const container = document.getElementById('detail-container');
    container.innerHTML = '<div class="loading-spinner"></div>'; // Show spinner while fetching

    try {
        const response = await fetch(`/api/tmdb?id=${id}&media_type=${type}`);
        if (!response.ok) throw new Error('Failed to fetch details.');

        const media = await response.json();
        document.title = `${media.title || media.name} - Cineverse`;
        
        renderMediaDetails(media, container);

    } catch (error) {
        console.error("Fetch detail error:", error);
        container.innerHTML = `<p class="error-message">Could not load details.</p>`;
    }
}

function renderMediaDetails(media, container) {
    container.innerHTML = ''; // Clear spinner

    const backdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : '';
    const posterUrl = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : '';
    const title = media.title || media.name;
    const releaseDate = media.release_date || media.first_air_date || '';
    const year = releaseDate ? releaseDate.substring(0, 4) : 'N/A';
    const runtime = media.runtime || (media.episode_run_time ? `${media.episode_run_time[0]} min` : '');
    
    // Create the new cinematic structure
    const detailHero = document.createElement('div');
    detailHero.className = 'detail-hero';
    detailHero.style.backgroundImage = `url(${backdropUrl})`;
    detailHero.innerHTML = `<div class="detail-hero-overlay"></div>`;

    const detailContent = document.createElement('div');
    detailContent.className = 'detail-content';
    detailContent.innerHTML = `
        <div class="detail-poster">
            <img src="${posterUrl}" alt="${title}">
        </div>
        <div class="detail-info">
            <h1 class="detail-title">${title}</h1>
            <div class="quick-info">
                <span>${year}</span>
                ${runtime ? `<span>•</span><span>${runtime}</span>` : ''}
                <span class="rating">⭐ ${media.vote_average.toFixed(1)}</span>
            </div>
            <div class="genres">
                ${media.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')}
            </div>
            <p class="tagline">${media.tagline || ''}</p>
            <h2>Overview</h2>
            <p class="overview">${media.overview || 'No overview available.'}</p>
        </div>
    `;

    container.appendChild(detailHero);
    container.appendChild(detailContent);

    // Animate the content in
    setTimeout(() => {
        detailContent.classList.add('is-visible');
    }, 100);
}
