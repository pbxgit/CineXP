/*
=====================================================
    Personal Media Explorer - Details Page JavaScript
=====================================================
*/

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SELECT DOM ELEMENTS ---
    const mainContent = document.getElementById('details-main-content');
    const backdropImageEl = document.getElementById('backdrop-image');
    const header = document.getElementById('main-header');

    // --- 2. GET MOVIE/SHOW ID AND TYPE FROM THE PAGE URL ---
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const type = params.get('type');

    // If the URL is missing the necessary info, show an error.
    if (!id || !type) {
        mainContent.innerHTML = `<p style="text-align: center; padding: 5rem 1rem;">Error: Could not find a valid movie or TV show ID in the URL.</p>`;
        document.getElementById('skeleton-loader').style.display = 'none'; // Hide skeleton
        return;
    }

    // --- 3. DEFINE THE CORRECT API URL ---
    const API_URL = `/.netlify/functions/get-media?endpoint=details&type=${type}&id=${id}`;

    /**
     * Fetches all necessary data for the details page from our Netlify function.
     */
    async function fetchDetails() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`The server responded with an error: ${response.status}`);
            }
            const data = await response.json();
            renderDetails(data); // If successful, render the page
        } catch (error) {
            console.error('Critical error fetching details:', error);
            mainContent.innerHTML = `<p style="text-align: center; padding: 5rem 1rem;">Error: Unable to load content. Please check your connection and try again.</p>`;
            document.getElementById('skeleton-loader').style.display = 'none'; // Hide skeleton
        }
    }

    /**
     * Takes the fetched data and builds the HTML to populate the page.
     * @param {object} data - The complete data object from the get-media function.
     */
    function renderDetails(data) {
        const { details, logoUrl, credits } = data;
        const title = details.title || details.name;

        // --- A. Update the page title and backdrop image ---
        document.title = `${title} | Media Explorer`;
        const backdropUrl = `https://image.tmdb.org/t/p/original${details.backdrop_path}`;
        backdropImageEl.style.backgroundImage = `url(${backdropUrl})`;
        backdropImageEl.style.opacity = 1; // Fade in the backdrop

        // --- B. Prepare data points for rendering ---
        const releaseYear = (details.release_date || details.first_air_date || '').substring(0, 4);
        const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
        const genres = details.genres.map(g => g.name).slice(0, 3).join(' &bull; ');

        // --- C. Create the HTML for the hero (top) section ---
        const heroContentHTML = `
            <div class="details-content-overlay content-reveal">
                ${logoUrl 
                    ? `<img src="${logoUrl}" alt="${title} logo" class="media-logo">`
                    : `<h1 class="fallback-title">${title}</h1>`
                }
                
                <div class="details-meta-pills">
                    <span class="meta-pill rating">★ ${rating}</span>
                    ${releaseYear ? `<span class="meta-pill">${releaseYear}</span>` : ''}
                    ${genres ? `<span class="meta-pill">${genres}</span>` : ''}
                </div>

                <div class="details-overview-container">
                    <p class="details-overview" id="details-overview">${details.overview}</p>
                    <button class="overview-toggle-btn" id="overview-toggle">Read More</button>
                </div>
            </div>`;

        // --- D. Create the HTML for the "below the fold" content (e.g., cast) ---
        const bodyContentHTML = `
            <div class="details-body-content content-reveal">
                <section id="cast-section">
                    <h2 class="details-section-title">Top Billed Cast</h2>
                    <div class="media-scroller">
                        <div class="media-scroller-inner">
                            ${credits.cast.slice(0, 20).map(member => `
                                <div class="cast-card">
                                    <img src="${member.profile_path ? `https://image.tmdb.org/t/p/w185${member.profile_path}` : 'https://via.placeholder.com/120?text=No+Image'}" alt="${member.name}">
                                    <p class="cast-name">${member.name}</p>
                                    <p class="cast-character">${member.character}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </section>
            </div>`;

        // --- E. Replace the skeleton loader with the real content ---
        mainContent.innerHTML = heroContentHTML + bodyContentHTML;
        
        // Trigger the fade-in animation
        setTimeout(() => {
            document.querySelectorAll('.content-reveal').forEach(el => el.classList.add('loaded'));
        }, 100);

        // --- F. Set up interactive elements like the "Read More" button ---
        setupEventListeners();
    }
    
    /**
     * Sets up event listeners for interactive elements after they are rendered.
     */
    function setupEventListeners() {
        const toggleBtn = document.getElementById('overview-toggle');
        const overviewEl = document.getElementById('details-overview');
        
        if (toggleBtn && overviewEl) {
            // Hide the "Read More" button if the text isn't long enough to need it
            if (overviewEl.scrollHeight <= overviewEl.clientHeight) {
                toggleBtn.style.display = 'none';
            }
            
            toggleBtn.addEventListener('click', () => {
                overviewEl.classList.toggle('expanded');
                toggleBtn.textContent = overviewEl.classList.contains('expanded') ? 'Read Less' : 'Read More';
            });
        }
    }
    
    // Add the scroll listener for the header's background effect
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 10);
    });

    // Kick off the entire process
    fetchDetails();
});
