/* --- 1. GLOBAL & DOM VARIABLES --- */
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval;
let isBg1Active = true;
let touchStartX = 0, touchEndX = 0;
let debounceTimer;

const DOM = {
    body: document.body, mainHeader: document.querySelector('.main-header'), bg1: document.querySelector('.hero-background'), bg2: document.querySelector('.hero-background-next'), heroSection: document.getElementById('hero-section'), heroLogoContainer: document.querySelector('.hero-logo-container'), heroLogoImg: document.querySelector('.hero-logo'), heroTitle: document.querySelector('.hero-title'), heroTagline: document.querySelector('.hero-tagline'), heroIndicatorsContainer: document.querySelector('.hero-indicators'), carouselsContainer: document.getElementById('content-carousels'), modalOverlay: document.getElementById('details-modal-overlay'), modal: document.getElementById('details-modal'), 
    // UPDATED Modal Content Selector
    modalContent: document.querySelector('#details-modal .modal-content'),
    modalBackdrop: document.querySelector('#details-modal .modal-backdrop'),
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

/* (Sections 3, 4, 5 are unchanged) */
/* --- 3. EVENT LISTENERS --- */
function setupEventListeners(){if(DOM.mainHeader){window.addEventListener("scroll",()=>{DOM.mainHeader.classList.toggle("scrolled",window.scrollY>50)})}if(DOM.modalOverlay)DOM.modalOverlay.addEventListener("click",closeModal);if(DOM.modalCloseBtn)DOM.modalCloseBtn.addEventListener("click",closeModal);if(DOM.searchLink)DOM.searchLink.addEventListener("click",openSearch);if(DOM.searchCloseBtn)DOM.searchCloseBtn.addEventListener("click",closeSearch);if(DOM.searchInput)DOM.searchInput.addEventListener("input",handleSearchInput)}
/* --- 4. HERO SLIDER LOGIC --- */
function setupHero(){if(!DOM.heroSection)return;setupHeroIndicators();setupSwipeHandlers();updateHeroSlide(currentHeroIndex,true);startHeroSlider()}
function startHeroSlider(){clearInterval(heroInterval);const e=parseInt(getComputedStyle(document.documentElement).getPropertyValue("--hero-slide-duration"))*1000||1e4;heroInterval=setInterval(()=>{currentHeroIndex=(currentHeroIndex+1)%heroSlides.length,updateHeroSlide(currentHeroIndex)},e)}
function resetHeroSlider(){clearInterval(heroInterval),startHeroSlider()}
async function updateHeroSlide(e,t=!1){if(!heroSlides[e])return;currentHeroIndex=e;const s=heroSlides[e],o=(e+1)%heroSlides.length;heroSlides[o]?.backdrop_path&&(new Image).src=`https://image.tmdb.org/t/p/original${heroSlides[o].backdrop_path}`,DOM.heroSection.classList.remove("active");const r=s.media_type||(s.title?"movie":"tv"),[n,a]=await Promise.all([fetchMediaDetails(r,s.id),fetchMediaImages(r,s.id)]);updateHeroBackground(s.backdrop_path,t),setTimeout(()=>{updateHeroContent(n,a,s),DOM.heroSection.classList.add("active"),updateHeroIndicators(e)},600)}
function updateHeroBackground(e,t){const s=`url(https://image.tmdb.org/t/p/original${e})`,o=isBg1Active?DOM.bg1:DOM.bg2,r=isBg1Active?DOM.bg2:DOM.bg1;if(t)return void(o.style.backgroundImage=s);r.style.backgroundImage=s,o.style.opacity=0,r.style.opacity=1,isBg1Active=!isBg1Active}
function updateHeroContent(e,t,s){const o=t?.logos||[],r=o.find(e=>"en"===e.iso_639_1&&e.file_path.endsWith(".svg"))||o.find(e=>"en"===e.iso_639_1)||o[0];r?.file_path?(DOM.heroLogoImg.src=`https://image.tmdb.org/t/p/w500${r.file_path}`,DOM.heroLogoContainer.style.display="block",DOM.heroTitle.style.display="none"):(DOM.heroTitle.textContent=s.title||s.name||"Untitled",DOM.heroTitle.style.display="block",DOM.heroLogoContainer.style.display="none"),e?.tagline?(DOM.heroTagline.textContent=e.tagline,DOM.heroTagline.style.display="block"):DOM.heroTagline.style.display="none"}
/* --- 5. UI & ANIMATION HELPERS --- */
function setupHeroIndicators(){if(!DOM.heroIndicatorsContainer)return;DOM.heroIndicatorsContainer.innerHTML="";heroSlides.forEach((e,t)=>{const s=document.createElement("div");s.className="indicator-bar",s.innerHTML='<div class="progress"></div>',s.addEventListener("click",()=>{t!==currentHeroIndex&&(updateHeroSlide(t),resetHeroSlider())}),DOM.heroIndicatorsContainer.appendChild(s)})}
function updateHeroIndicators(e){if(!DOM.heroIndicatorsContainer)return;const t=DOM.heroIndicatorsContainer.querySelectorAll(".indicator-bar");t.forEach((t,s)=>{t.classList.remove("active");const o=t.querySelector(".progress");o&&(o.style.transition="none",o.style.width="0%",void o.offsetWidth,s===e&&(t.classList.add("active"),o.style.transition=`width var(--hero-slide-duration) linear`,o.style.width="100%"))})}
function createCarousel(e,t){if(!Array.isArray(t)||0===t.length)return document.createDocumentFragment();const s=document.createElement("section");s.className="carousel-section",s.innerHTML=`<h2>${e}</h2>`;const o=document.createElement("div");o.className="movie-carousel",t.forEach(e=>{if(!e?.poster_path)return;const t=document.createElement("a");t.className="movie-poster",t.href="#",t.innerHTML=`<img src="https://image.tmdb.org/t/p/w500${e.poster_path}" alt="${e.title||e.name}" loading="lazy">`,t.addEventListener("click",t=>{t.preventDefault(),openDetailsModal(e)}),o.appendChild(t)}),s.appendChild(o);return s}
function setupScrollAnimations(){const e=document.querySelectorAll(".carousel-section");if(0===e.length)return;const t=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.classList.add("is-visible"),t.unobserve(e.target))})},{threshold:.1});e.forEach(e=>t.observe(e))}

/* --- 6. MODAL LOGIC --- */

// **REBUILT AND ENHANCED**
async function openDetailsModal(mediaItem) {
    if (!DOM.modal || !mediaItem) return;

    // Set loading state immediately
    DOM.modalContent.innerHTML = '<p>Loading details...</p>';
    DOM.modalBackdrop.style.backgroundImage = ''; // Clear old backdrop

    DOM.body.classList.add('modal-open');
    DOM.modalOverlay.classList.add('active');
    DOM.modal.classList.add('active');

    const mediaType = mediaItem.media_type || (mediaItem.title ? 'movie' : 'tv');
    // This now fetches the combined data from our upgraded serverless function
    const details = await fetchMediaDetails(mediaType, mediaItem.id);

    if (!details) {
        DOM.modalContent.innerHTML = '<p>Sorry, details could not be loaded.</p>';
        return;
    }
    
    // Set dynamic backdrop
    if (details.backdrop_path) {
        DOM.modalBackdrop.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${details.backdrop_path})`;
    }

    // Prepare metadata
    const year = (details.release_date || details.first_air_date || '').split('-')[0];
    const runtime = details.runtime ? `${details.runtime} min` : (details.episode_run_time ? `${details.episode_run_time[0]} min` : '');
    const rating = details.certification || 'N/A';
    
    // Build the rich HTML structure
    DOM.modalContent.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w500${details.poster_path}" alt="${details.title || details.name}" class="modal-poster">
        <div class="modal-details">
            <h1>${details.title || details.name}</h1>
            <div class="modal-meta">
                <span>${year}</span>
                <span class="rating">${rating}</span>
                <span>${runtime}</span>
            </div>
            <div class="modal-genres">
                ${details.genres.map(genre => `<span>${genre.name}</span>`).join('')}
            </div>
            <p>${details.overview}</p>
            <div class="modal-cast">
                <h3>Cast</h3>
                <div class="cast-list">
                    ${details.cast.map(member => `
                        <div class="cast-member">
                            <img src="https://image.tmdb.org/t/p/w200${member.profile_path}" alt="${member.name}">
                            <p>${member.name}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function closeModal() {
    DOM.body.classList.remove('modal-open');
    DOM.modalOverlay.classList.remove('active');
    DOM.modal.classList.remove('active');
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
