// Find this function in main.js
async function fetchAndDisplayDetails(type, id) {
// ...and replace it with this new version...

async function fetchAndDisplayDetails(type, id) {
    const mainContent = document.querySelector('#details-main-content');
    try {
        const response = await fetch(`/.netlify/functions/get-media?endpoint=details&type=${type}&id=${id}`);
        const { details: media, logoUrl } = await response.json();

        // **BLUR-UP TECHNIQUE**
        const smallBackdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w300${media.backdrop_path}` : '';
        const largeBackdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : '';
        const backdropElement = mainContent.querySelector('.details-backdrop');
        if (backdropElement) {
            backdropElement.style.backgroundImage = `url('${smallBackdropUrl}')`;
            const highResImage = new Image();
            highResImage.src = largeBackdropUrl;
            highResImage.onload = () => {
                backdropElement.style.backgroundImage = `url('${largeBackdropUrl}')`;
            };
        }

        // **NEW: RENDER THE LOGO OR A FALLBACK TITLE**
        const titleElement = logoUrl
            ? `<img src="${logoUrl}" alt="${media.name || media.title}" class="media-logo">`
            : `<h1 class="fallback-title">${media.name || media.title}</h1>`;

        // **NEW: RENDER THE GENRE & META PILLS**
        const releaseDate = media.release_date || media.first_air_date;
        let metaPillsHTML = `<div class="meta-pill">${releaseDate ? releaseDate.substring(0, 4) : 'N/A'}</div>`;
        if (media.genres) {
            media.genres.slice(0, 3).forEach(genre => { // Show up to 3 genres
                metaPillsHTML += `<div class="meta-pill">${genre.name}</div>`;
            });
        }
        if (media.vote_average) {
            metaPillsHTML += `<div class="meta-pill rating">⭐ ${media.vote_average.toFixed(1)}</div>`;
        }

        // **BUILD THE FINAL HTML**
        mainContent.querySelector('.details-content').innerHTML = `
            <div class="details-content-overlay">
                ${titleElement}
                <div class="details-meta-pills">${metaPillsHTML}</div>
                <p class="details-overview">${media.overview}</p>
                <div class="action-buttons">
                    <button id="watchlist-btn" class="btn-primary"></button>
                    <button class="btn-secondary" onclick="window.location.href='/'">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor"/></svg>
                        More Info
                    </button>
                </div>
            </div>
        `;
        
        updateWatchlistButton(media, type);

    } catch (error) {
        mainContent.innerHTML = '<h1>Could not load details.</h1>';
        console.error('Error fetching details:', error);
    }
}
