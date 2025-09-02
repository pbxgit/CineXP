/*
=====================================================
    Personal Media Explorer - CONSOLIDATED Main JavaScript File
=====================================================

    This single script handles all pages by detecting which page is currently active.

    TABLE OF CONTENTS
    -----------------
    1.  SHARED FUNCTIONALITY (Runs on all pages)
    2.  HOMEPAGE-SPECIFIC LOGIC
    3.  DETAILS-PAGE-SPECIFIC LOGIC
    4.  INITIALIZER (The "Router" that decides which logic to run)
*/

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SHARED FUNCTIONALITY (Runs on all pages) ---

    const header = document.getElementById('main-header');
    
    // Header scroll effect for background
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 10);
        });
    }

    // Intersection Observer for fade-in animations on any page
    const animatedElements = document.querySelectorAll('[data-animation="fade-in-up"]');
    if (animatedElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(element => observer.observe(element));
    }


    // --- HOMEPAGE-SPECIFIC LOGIC ---

    /**
     * This function contains all the code needed to initialize the homepage.
     */
    function initializeHomepage() {
        const heroSliderWrapper = document.getElementById('hero-slider-wrapper');
        const topTenGrid = document.getElementById('top-10-grid');
        const trendingMoviesGrid = document.getElementById('trending-movies-grid');
        const popularTvGrid = document.getElementById('popular-tv-grid');

        const API_BASE_URL = '/.netlify/functions/get-media';

        async function fetchData(endpoint) {
            const url = `${API_BASE_URL}?endpoint=${endpoint}`;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Network response was not ok`);
                return await response.json();
            } catch (error) {
                console.error(`Failed to fetch from ${url}:`, error);
                return null;
            }
        }

        function populateHeroSlider(movies = []) {
             if (!movies.length || !heroSliderWrapper) return;
            const sliderMovies = movies.slice(0, 5);
            heroSliderWrapper.innerHTML = sliderMovies.map(movie => {
                const backdropUrl = `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;
                return `<div class="swiper-slide hero-slide" style="background-image: url(${backdropUrl});"><a href="/details.html?id=${movie.id}&type=movie" class="hero-slide-content"><h2 class="hero-slide-title">${movie.title}</h2><p class="hero-slide-overview">${movie.overview}</p></a></div>`;
            }).join('');
            new Swiper('.hero-slider', { loop: true, effect: 'fade', fadeEffect: { crossFade: true }, autoplay: { delay: 6000, disableOnInteraction: false }, navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' } });
        }
        
        function populateTopTenShelf(movies = [], gridElement) {
            if (!movies.length || !gridElement) return;
            const topTenMovies = movies.slice(0, 10);
            gridElement.innerHTML = topTenMovies.map((movie, index) => {
                if (!movie.poster_path) return '';
                const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
                return `<a href="/details.html?id=${movie.id}&type=movie" class="top-ten-card"><div class="top-ten-number">${index + 1}</div><img src="${posterUrl}" alt="${movie.title}" class="top-ten-poster" loading="lazy"></a>`;
            }).join('');
        }

        function populateStandardShelf(mediaItems = [], gridElement) {
            if (!mediaItems.length || !gridElement) return;
            gridElement.innerHTML = mediaItems.map(item => {
                if (!item.poster_path) return '';
                const posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
                const title = item.title || item.name;
                const mediaType = item.title ? 'movie' : 'tv';
                return `<a href="/details.html?id=${item.id}&type=${mediaType}" class="media-card"><img src="${posterUrl}" alt="${title}" loading="lazy"></a>`;
            }).join('');
        }

        async function loadAllHomepageContent() {
            const [trendingData, popularTvData, topRatedData] = await Promise.all([
                fetchData('trending_movies'), fetchData('popular_tv'), fetchData('top_rated_movies')
            ]);
            if (trendingData && trendingData.results) {
                populateHeroSlider(trendingData.results);
                populateStandardShelf(trendingData.results, trendingMoviesGrid);
            }
            if (popularTvData && popularTvData.results) {
                populateStandardShelf(popularTvData.results, popularTvGrid);
            }
            if (topRatedData && topRatedData.results) {
                populateTopTenShelf(topRatedData.results, topTenGrid);
            }
        }
        
        loadAllHomepageContent();
    }


    // --- DETAILS-PAGE-SPECIFIC LOGIC ---

    /**
     * This function contains all the code needed to initialize the details page.
     */
    function initializeDetailsPage() {
        const mainContent = document.getElementById('details-main-content');
        const backdropImageEl = document.getElementById('backdrop-image');
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const type = params.get('type');

        if (!id || !type) {
            mainContent.innerHTML = `<p style="text-align: center; padding: 5rem 1rem;">Error: Missing ID.</p>`;
            document.getElementById('skeleton-loader').style.display = 'none';
            return;
        }

        const API_URL = `/.netlify/functions/get-media?endpoint=details&type=${type}&id=${id}`;

        async function fetchDetails() {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error('Failed to fetch media details.');
                const data = await response.json();
                renderDetails(data);
            } catch (error) {
                console.error('Error fetching details:', error);
                mainContent.innerHTML = `<p>Error loading content.</p>`;
                document.getElementById('skeleton-loader').style.display = 'none';
            }
        }

        function renderDetails(data) {
            const { details, logoUrl, credits } = data;
            const title = details.title || details.name;
            document.title = `${title} | Media Explorer`;
            const backdropUrl = `https://image.tmdb.org/t/p/original${details.backdrop_path}`;
            backdropImageEl.style.backgroundImage = `url(${backdropUrl})`;
            backdropImageEl.style.opacity = 1;
            const releaseYear = (details.release_date || details.first_air_date || '').substring(0, 4);
            const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
            const genres = details.genres.map(g => g.name).slice(0, 3).join(' &bull; ');
            const heroContentHTML = `<div class="details-content-overlay content-reveal">${logoUrl ? `<img src="${logoUrl}" alt="${title} logo" class="media-logo">` : `<h1 class="fallback-title">${title}</h1>`}<div class="details-meta-pills"><span class="meta-pill rating">★ ${rating}</span>${releaseYear ? `<span class="meta-pill">${releaseYear}</span>` : ''}${genres ? `<span class="meta-pill">${genres}</span>` : ''}</div><div class="details-overview-container"><p class="details-overview" id="details-overview">${details.overview}</p><button class="overview-toggle-btn" id="overview-toggle">Read More</button></div></div>`;
            const bodyContentHTML = `<div class="details-body-content content-reveal"><section id="cast-section"><h2 class="details-section-title">Top Billed Cast</h2><div class="media-scroller"><div class="media-scroller-inner">${credits.cast.slice(0, 20).map(member => `<div class="cast-card"><img src="${member.profile_path ? `https://image.tmdb.org/t/p/w185${member.profile_path}` : 'https://via.placeholder.com/120?text=No+Image'}" alt="${member.name}"><p class="cast-name">${member.name}</p><p class="cast-character">${member.character}</p></div>`).join('')}</div></div></section></div>`;
            mainContent.innerHTML = heroContentHTML + bodyContentHTML;
            setTimeout(() => { document.querySelectorAll('.content-reveal').forEach(el => el.classList.add('loaded')); }, 100);
            setupDetailsEventListeners();
        }

        function setupDetailsEventListeners() {
            const toggleBtn = document.getElementById('overview-toggle');
            const overviewEl = document.getElementById('details-overview');
            if (toggleBtn && overviewEl) {
                if (overviewEl.scrollHeight <= overviewEl.clientHeight) {
                    toggleBtn.style.display = 'none';
                }
                toggleBtn.addEventListener('click', () => {
                    overviewEl.classList.toggle('expanded');
                    toggleBtn.textContent = overviewEl.classList.contains('expanded') ? 'Read Less' : 'Read More';
                });
            }
        }
        
        fetchDetails();
    }


    // --- 4. INITIALIZER (The "Router") ---

    // This checks which page we are on and runs the correct function.
    if (document.getElementById('hero-slider-wrapper')) {
        initializeHomepage();
    } else if (document.getElementById('details-main-content')) {
        initializeDetailsPage();
    }
    // You can add more 'else if' blocks here for other pages like the watchlist.
});
