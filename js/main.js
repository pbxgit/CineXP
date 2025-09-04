/* --- 1. GLOBAL & DOM VARIABLES --- */
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval;
let isBg1Active = true;
let touchStartX = 0,
    touchEndX = 0;
let debounceTimer;

const DOM = {
    body: document.body, mainHeader: document.querySelector('.main-header'), bg1: document.querySelector('.hero-background'), bg2: document.querySelector('.hero-background-next'), heroSection: document.getElementById('hero-section'), heroLogoContainer: document.querySelector('.hero-logo-container'), heroLogoImg: document.querySelector('.hero-logo'), heroTitle: document.querySelector('.hero-title'), heroTagline: document.querySelector('.hero-tagline'), heroIndicatorsContainer: document.querySelector('.hero-indicators'),
    heroWatchBtn: document.querySelector('#hero-section .cta-button'), // Watch button in Hero
    carouselsContainer: document.getElementById('content-carousels'), modalOverlay: document.getElementById('details-modal-overlay'), modal: document.getElementById('details-modal'),
    modalContent: document.querySelector('#details-modal .modal-content'),
    modalBanner: document.querySelector('#details-modal .modal-banner'),
    modalScrollContainer: document.getElementById('modal-scroll-container'),
    modalCloseBtn: document.getElementById('modal-close-btn'), searchLink: document.getElementById('search-link'), searchOverlay: document.getElementById('search-overlay'), searchCloseBtn: document.getElementById('search-close-btn'), searchInput: document.getElementById('search-input'), searchResultsContainer: document.getElementById('search-results-container'),
};

/* --- 2. INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [trendingMovies, trendingShows] = await Promise.all([
            fetchMedia('movie', 'trending'),
            fetchMedia('tv', 'trending')
        ]);
        heroSlides = [...trendingMovies, ...trendingShows].filter(Boolean).sort((a, b) => b.popularity - a.popularity).slice(0, 7);
        if (heroSlides.length > 0) setupHero();
        if (trendingMovies?.length > 0) DOM.carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
        if (trendingShows?.length > 0) DOM.carouselsContainer.appendChild(createCarousel('Trending TV Shows', trendingShows));
        setupScrollAnimations();
        setupEventListeners();
    } catch (error) {
        console.error("Failed to initialize the application:", error);
    }
});

/* --- 3. EVENT LISTENERS --- */
function setupEventListeners() { if (DOM.mainHeader) { window.addEventListener('scroll', () => DOM.mainHeader.classList.toggle('scrolled', window.scrollY > 50)); } if (DOM.modalOverlay) DOM.modalOverlay.addEventListener('click', closeModal); if (DOM.modalCloseBtn) DOM.modalCloseBtn.addEventListener('click', closeModal); if (DOM.searchLink) DOM.searchLink.addEventListener('click', openSearch); if (DOM.searchCloseBtn) DOM.searchCloseBtn.addEventListener('click', closeSearch); if (DOM.searchInput) DOM.searchInput.addEventListener('input', handleSearchInput); }

/* --- 4. HERO SLIDER LOGIC --- */
function setupHero() { if (!DOM.heroSection) return; setupHeroIndicators(); setupSwipeHandlers(); updateHeroSlide(currentHeroIndex, true); startHeroSlider(); }
function startHeroSlider() { clearInterval(heroInterval); const e = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hero-slide-duration')) * 1000 || 10000; heroInterval = setInterval(() => { currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length; updateHeroSlide(currentHeroIndex) }, e); }
function resetHeroSlider() { clearInterval(heroInterval); startHeroSlider(); }
async function updateHeroSlide(index, isFirstLoad = false) {
    if (!heroSlides[index]) return;
    currentHeroIndex = index;
    const slideData = heroSlides[index];
    const nextIndex = (index + 1) % heroSlides.length;
    if (heroSlides[nextIndex]?.backdrop_path) {
        new Image().src = `https://image.tmdb.org/t/p/original${heroSlides[nextIndex].backdrop_path}`;
    }
    DOM.heroSection.classList.remove('active');
    const mediaType = slideData.media_type || (slideData.title ? 'movie' : 'tv');
    const detailsData = await fetchMediaDetails(mediaType, slideData.id);
    updateHeroBackground(slideData.backdrop_path, isFirstLoad);
    setTimeout(() => {
        updateHeroContent(detailsData, slideData);
        DOM.heroSection.classList.add('active');
        updateHeroIndicators(index);
    }, 600);
}
function updateHeroBackground(backdropPath, isFirstLoad) {
    const nextBgUrl = backdropPath ? `url(https://image.tmdb.org/t/p/original${backdropPath})` : '';
    const activeBg = isBg1Active ? DOM.bg1 : DOM.bg2;
    const nextBg = isBg1Active ? DOM.bg2 : DOM.bg1;
    if (isFirstLoad) {
        activeBg.style.backgroundImage = nextBgUrl;
        return;
    }
    nextBg.style.backgroundImage = nextBgUrl;
    activeBg.style.opacity = 0;
    nextBg.style.opacity = 1;
    isBg1Active = !isBg1Active;
}
function updateHeroContent(detailsData, slideData) {
    const logos = detailsData?.logos || [];
    const bestLogo = logos.find(l => l.iso_639_1 === 'en') || logos[0];
    if (bestLogo?.file_path) {
        DOM.heroLogoImg.src = `https://image.tmdb.org/t/p/w500${bestLogo.file_path}`;
        DOM.heroLogoContainer.style.display = 'block';
        DOM.heroTitle.style.display = 'none';
    } else {
        DOM.heroTitle.textContent = detailsData.title || detailsData.name || slideData.title || slideData.name || 'Untitled';
        DOM.heroTitle.style.display = 'block';
        DOM.heroLogoContainer.style.display = 'none';
    }
    DOM.heroTagline.textContent = detailsData.tagline || '';
    DOM.heroTagline.style.display = detailsData.tagline ? 'block' : 'none';

    // ### DYNAMIC HERO WATCH BUTTON ###
    const mediaType = detailsData.seasons ? 'tv' : 'movie';
    if (mediaType === 'movie') {
        DOM.heroWatchBtn.href = `https://www.cineby.app/movie/${detailsData.id}?play=true`;
    } else if (mediaType === 'tv') {
        const firstSeason = detailsData.seasons?.find(s => s.season_number > 0);
        if (firstSeason) {
            DOM.heroWatchBtn.href = `https://www.cineby.app/tv/${detailsData.id}/${firstSeason.season_number}/1?play=true`;
        } else {
            DOM.heroWatchBtn.href = '#'; // Fallback if no seasons
        }
    }
}

/* --- 5. UI & ANIMATION HELPERS --- */
function setupHeroIndicators(){if(!DOM.heroIndicatorsContainer)return;DOM.heroIndicatorsContainer.innerHTML="";heroSlides.forEach((e,t)=>{const s=document.createElement("div");s.className="indicator-bar",s.innerHTML='<div class="progress"></div>',s.addEventListener("click",()=>{t!==currentHeroIndex&&(updateHeroSlide(t),resetHeroSlider())}),DOM.heroIndicatorsContainer.appendChild(s)})}
function updateHeroIndicators(e){if(!DOM.heroIndicatorsContainer)return;const t=DOM.heroIndicatorsContainer.querySelectorAll(".indicator-bar");t.forEach((t,s)=>{t.classList.remove("active");const o=t.querySelector(".progress");o&&(o.style.transition="none",o.style.width="0%",void o.offsetWidth,s===e&&(t.classList.add("active"),o.style.transition=`width var(--hero-slide-duration) linear`,o.style.width="100%"))})}
function createCarousel(e,t){if(!Array.isArray(t)||0===t.length)return document.createDocumentFragment();const s=document.createElement("section");s.className="carousel-section",s.innerHTML=`<h2>${e}</h2>`;const o=document.createElement("div");o.className="movie-carousel",t.forEach(e=>{if(!e?.poster_path)return;const t=document.createElement("a");t.className="movie-poster",t.href="#",t.innerHTML=`<img src="https://image.tmdb.org/t/p/w500${e.poster_path}" alt="${e.title||e.name}" loading="lazy">`,t.addEventListener("click",t=>{t.preventDefault(),openDetailsModal(e)}),o.appendChild(t)}),s.appendChild(o);return s}
function setupScrollAnimations(){const e=document.querySelectorAll(".carousel-section");if(0===e.length)return;const t=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.classList.add("is-visible"),t.unobserve(e.target))})},{threshold:.1});e.forEach(e=>t.observe(e))}

/* --- 6. MODAL LOGIC --- */
async function openDetailsModal(mediaItem) {
    if (!DOM.modal || !mediaItem) return;
    DOM.modalContent.innerHTML = '';
    DOM.modalBanner.style.backgroundImage = '';
    DOM.modal.classList.remove('active');

    const mediaType = mediaItem.media_type || (mediaItem.title ? 'movie' : 'tv');
    const details = await fetchMediaDetails(mediaType, mediaItem.id);
    if (!details || Object.keys(details).length === 0) {
        DOM.modalContent.innerHTML = '<p>Sorry, details could not be loaded.</p>';
        return;
    }

    const bannerUrl = details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '';
    const imagePromise = new Promise(resolve => {
        if (!bannerUrl) return resolve();
        const bannerImage = new Image();
        bannerImage.onload = resolve;
        bannerImage.onerror = resolve; // Resolve even if image fails, so modal still opens
        bannerImage.src = bannerUrl;
    });

    await imagePromise; // Wait for image to be cached by browser

    DOM.modalBanner.style.backgroundImage = `url(${bannerUrl})`;
    DOM.body.classList.add('modal-open');
    DOM.modalOverlay.classList.add('active');
    setTimeout(() => DOM.modal.classList.add('active'), 50);

    const year = (details.release_date || details.first_air_date || '').split('-')[0];
    const runtime = details.runtime ? `${details.runtime} min` : (details.episode_run_time?.length > 0 ? `${details.episode_run_time[0]} min` : '');
    const rating = details.certification || 'N/A';
    const bestLogo = details.logos?.find(l => l.iso_639_1 === 'en') || details.logos?.[0];

    const titleHtml = bestLogo?.file_path ?
        `<img src="https://image.tmdb.org/t/p/w500${bestLogo.file_path}" class="modal-title-logo" alt="${details.title || details.name}">` :
        `<h1 class="modal-title-text">${details.title || details.name}</h1>`;

    const filteredCast = details.cast?.filter(c => c.profile_path);
    const filteredSeasons = details.seasons?.filter(s => s.poster_path && s.episodes?.length > 0);

    let watchBtnHtml = '';
    if (mediaType === 'movie') {
        watchBtnHtml = `<a href="https://www.cineby.app/movie/${details.id}?play=true" class="modal-watch-btn" target="_blank">Watch Now</a>`;
    } else if (mediaType === 'tv' && filteredSeasons?.length > 0) {
        const firstSeasonNum = filteredSeasons[0].season_number;
        const firstEpisodeNum = filteredSeasons[0].episodes[0]?.episode_number;
        if (firstEpisodeNum) {
            watchBtnHtml = `<a href="https://www.cineby.app/tv/${details.id}/${firstSeasonNum}/${firstEpisodeNum}?play=true" class="modal-watch-btn" target="_blank">Watch Now</a>`;
        }
    }

    const playIconSvg = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>`;
    const seasonsHtml = (mediaType === 'tv' && filteredSeasons?.length > 0) ? `
        <div class="modal-seasons">
            <h3 class="section-title">Seasons</h3>
            <div class="seasons-browser">
                <div class="seasons-tabs">
                    ${filteredSeasons.map(s => `<button class="season-tab" data-season="${s.season_number}">${s.name}</button>`).join('')}
                </div>
                <div class="episodes-display">
                    ${filteredSeasons.map(s => `
                        <div class="episodes-list" id="season-${s.season_number}-episodes">
                            ${s.episodes.map(ep => `
                                <div class="episode-item">
                                    <div class="episode-thumbnail-container">
                                        <img src="${ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}" alt="${ep.name}" class="episode-thumbnail">
                                        <a href="https://www.cineby.app/tv/${details.id}/${s.season_number}/${ep.episode_number}?play=true" class="episode-play-btn" target="_blank">${playIconSvg}</a>
                                    </div>
                                    <div class="episode-info">
                                        <h5>${ep.episode_number}. ${ep.name}</h5>
                                        <p>${ep.overview || 'No description available.'}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    ` : '';

    DOM.modalContent.innerHTML = `
        <div class="modal-main-details">
            ${details.poster_path ? `<img src="https://image.tmdb.org/t/p/w500${details.poster_path}" alt="${details.title || details.name}" class="modal-poster">` : ''}
            <div class="modal-title-group">
                ${titleHtml}
                <div class="modal-meta">
                    ${year ? `<span>${year}</span>` : ''}
                    <span class="rating">${rating}</span>
                    ${runtime ? `<span>${runtime}</span>` : ''}
                </div>
                <div class="modal-genres">
                    ${details.genres?.map(g => `<span>${g.name}</span>`).join('') || ''}
                </div>
                ${watchBtnHtml}
            </div>
        </div>
        <div class="modal-info-column">
            <div class="modal-overview">
                <p>${details.overview || ''}</p>
            </div>
            ${(filteredCast && filteredCast.length > 0) ? `<div class="modal-cast"><h3 class="section-title">Cast</h3><div class="cast-list">${filteredCast.map(member => `<div class="cast-member"><img src="https://image.tmdb.org/t/p/w200${member.profile_path}" alt="${member.name}"><p>${member.name}</p></div>`).join('')}</div></div>` : ''}
            ${seasonsHtml}
        </div>
    `;

    const seasonTabs = DOM.modalContent.querySelectorAll('.season-tab');
    if (seasonTabs.length > 0) {
        seasonTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const seasonNumber = tab.dataset.season;
                seasonTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                DOM.modalContent.querySelectorAll('.episodes-list').forEach(list => list.classList.remove('active'));
                DOM.modalContent.querySelector(`#season-${seasonNumber}-episodes`)?.classList.add('active');
            });
        });
        seasonTabs[0].click();
    }
}

function closeModal() {
    DOM.body.classList.remove('modal-open');
    DOM.modalOverlay.classList.remove('active');
    DOM.modal.classList.remove('active');
    setTimeout(() => {
        if (DOM.modalScrollContainer) DOM.modalScrollContainer.scrollTop = 0;
    }, 600);
}

/* (Sections 7 and 8 for Search and Swipe are unchanged) */
/* --- 7. AWWWARDS-LEVEL SEARCH LOGIC --- */
function openSearch(e){e.preventDefault(),DOM.body.classList.add("search-open"),DOM.searchOverlay.classList.add("active"),setTimeout(()=>DOM.searchInput.focus(),400)}
function closeSearch(){DOM.body.classList.remove("search-open"),DOM.searchOverlay.classList.remove("active"),setTimeout(()=>{DOM.searchInput.value="",DOM.searchResultsContainer.innerHTML=""},400)}
function handleSearchInput(){clearTimeout(debounceTimer),debounceTimer=setTimeout(async()=>{const e=DOM.searchInput.value.trim();if(e.length>1){const t=await searchMedia(e);displaySearchResults(t)}else DOM.searchResultsContainer.innerHTML=""},500)}
function displaySearchResults(e){DOM.searchResultsContainer.innerHTML="";if(0===e.length){const t=document.createElement("p");t.className="no-results",t.textContent="No results found.",DOM.searchResultsContainer.appendChild(t),setTimeout(()=>t.classList.add("is-visible"),50);return}
e.forEach((e,t)=>{if(!e.poster_path)return;const s=document.createElement("a");s.className="movie-poster",s.href="#",s.innerHTML=`<img src="https://image.tmdb.org/t/p/w500${e.poster_path}" alt="${e.title||e.name}" loading="lazy">`,s.addEventListener("click",s=>{s.preventDefault(),closeSearch(),setTimeout(()=>openDetailsModal(e),400)}),DOM.searchResultsContainer.appendChild(s),setTimeout(()=>{s.classList.add("is-visible")},50*t)})}
/* --- 8. SWIPE LOGIC --- */
function setupSwipeHandlers(){if(!DOM.heroSection)return;DOM.heroSection.addEventListener("touchstart",e=>{touchStartX=e.touches[0].clientX,clearInterval(heroInterval)},{passive:!0}),DOM.heroSection.addEventListener("touchmove",e=>{touchEndX=e.touches[0].clientX},{passive:!0}),DOM.heroSection.addEventListener("touchend",()=>{0!==touchEndX&&Math.abs(touchStartX-touchEndX)>50&&(currentHeroIndex=touchStartX>touchEndX?(currentHeroIndex+1)%heroSlides.length:(currentHeroIndex-1+heroSlides.length)%heroSlides.length,updateHeroSlide(currentHeroIndex)),startHeroSlider(),touchStartX=0,touchEndX=0})}
